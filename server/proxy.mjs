/**
 * Proxy server for invoice analysis API
 * Handles authentication, rate limiting, validation, and API requests
 */

import http from 'http'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Configuration
const CONFIG = {
  API_KEY: process.env.VITE_API_KEY_IA || process.env.ANTHROPIC_API_KEY, // VITE_API_KEY_IA is provider-agnostic
  PORT: parseInt(process.env.PORT || '3001', 10),
  REQUEST_TIMEOUT: 60000, // 60 seconds (increased for large uploads)
  MAX_REQUEST_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_MODELS: ['claude-sonnet-4-6', 'claude-opus-4-1', 'claude-3-5-haiku-20241022'],
}

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})

// Rate limiting: track requests per IP
const requestTracking = new Map()
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 60,
  CLEANUP_INTERVAL: 60000, // Clean old entries every minute
}

// Validate configuration on startup
function validateStartupConfig() {
  if (!CONFIG.API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY no está configurada en .env.local')
    process.exit(1)
  }
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(clientIp) {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  if (!requestTracking.has(clientIp)) {
    requestTracking.set(clientIp, [])
  }

  const clientRequests = requestTracking.get(clientIp)
  const recentRequests = clientRequests.filter((timestamp) => timestamp > oneMinuteAgo)

  if (recentRequests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    return false
  }

  recentRequests.push(now)
  requestTracking.set(clientIp, recentRequests)
  return true
}

/**
 * Clean up old tracking data
 */
function cleanupRateLimitTracking() {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  for (const [ip, timestamps] of requestTracking.entries()) {
    const recentTimestamps = timestamps.filter((t) => t > oneMinuteAgo)
    if (recentTimestamps.length === 0) {
      requestTracking.delete(ip)
    } else {
      requestTracking.set(ip, recentTimestamps)
    }
  }
}

/**
 * Validate model against whitelist
 */
function validateModel(motor) {
  if (!CONFIG.ALLOWED_MODELS.includes(motor)) {
    throw new Error(
      `Invalid model: ${motor}. Allowed: ${CONFIG.ALLOWED_MODELS.join(', ')}`
    )
  }
}

/**
 * Validate request body
 */
function validateRequestBody(body) {
  if (!body || typeof body !== 'string') {
    throw new Error('Request body is empty or invalid')
  }

  let parsed
  try {
    parsed = JSON.parse(body)
  } catch (error) {
    console.error('JSON parse error:', error.message)
    throw new Error('Invalid JSON in request body: ' + error.message)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Request body must be a JSON object')
  }

  const { motor, messages, temperatura, max_tokens } = parsed

  if (!motor || typeof motor !== 'string') {
    throw new Error('motor field is required and must be a string')
  }

  if (!Array.isArray(messages)) {
    throw new Error('messages must be an array')
  }

  if (messages.length === 0) {
    throw new Error('messages array cannot be empty')
  }

  validateModel(motor)

  const temp = temperatura !== undefined ? temperatura : 0.1
  if (typeof temp !== 'number' || temp < 0 || temp > 2) {
    throw new Error(`temperatura must be a number between 0 and 2, got: ${temp}`)
  }

  const tokens = max_tokens !== undefined ? max_tokens : 1024
  if (typeof tokens !== 'number' || tokens < 256 || tokens > 4096) {
    throw new Error(`max_tokens must be a number between 256 and 4096, got: ${tokens}`)
  }

  return { motor, messages, temperatura: temp, max_tokens: tokens }
}

/**
 * Handle CORS headers
 */
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('X-Content-Type-Options', 'nosniff')
}

/**
 * Send error response
 */
function sendError(res, statusCode, message) {
  try {
    if (res.headersSent) {
      console.warn('Headers already sent, cannot send error response')
      return
    }
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: message }))
  } catch (error) {
    console.error('Error sending error response:', error.message)
    try {
      res.destroy()
    } catch (e) {
      // Already destroyed
    }
  }
}

/**
 * Send success response
 */
function sendSuccess(res, data) {
  try {
    if (res.headersSent) {
      console.warn('Headers already sent, cannot send success response')
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  } catch (error) {
    console.error('Error sending success response:', error.message)
    try {
      res.destroy()
    } catch (e) {
      // Already destroyed
    }
  }
}

/**
 * Handle /api/analyze endpoint
 */
async function handleAnalyzeRequest(req, res) {
  let responseEnded = false
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    console.warn(`⚠️  Rate limit exceeded for IP: ${clientIp}`)
    return sendError(res, 429, 'Too many requests. Max 60 per minute.')
  }

  let body = ''
  let contentLength = 0
  let timeoutHandle = null

  // Set request timeout
  timeoutHandle = setTimeout(() => {
    if (!responseEnded && !res.writableEnded) {
      console.warn('⚠️  Request timeout after', CONFIG.REQUEST_TIMEOUT / 1000, 'seconds')
      responseEnded = true
      sendError(res, 504, 'Request timeout')
    }
  }, CONFIG.REQUEST_TIMEOUT)

  const cleanup = () => {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
  }

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message)
    cleanup()
    if (!responseEnded && !res.writableEnded) {
      responseEnded = true
      sendError(res, 400, 'Request error: ' + error.message)
    }
  })

  res.on('error', (error) => {
    console.error('❌ Response error:', error.message)
    cleanup()
    responseEnded = true
  })

  req.on('data', (chunk) => {
    try {
      contentLength += chunk.length

      // Prevent oversized requests
      if (contentLength > CONFIG.MAX_REQUEST_SIZE) {
        req.pause()
        if (!responseEnded && !res.writableEnded) {
          responseEnded = true
          sendError(res, 413, `Request too large. Max size: ${CONFIG.MAX_REQUEST_SIZE / 1024 / 1024}MB`)
        }
        cleanup()
        return
      }

      body += chunk.toString()
    } catch (error) {
      console.error('❌ Error in data handler:', error.message)
      if (!responseEnded && !res.writableEnded) {
        responseEnded = true
        sendError(res, 400, 'Error processing request data')
      }
      cleanup()
    }
  })

  req.on('end', async () => {
    if (responseEnded || res.writableEnded) {
      cleanup()
      return
    }

    try {
      // Validate request
      const { motor, messages, temperatura, max_tokens } = validateRequestBody(body)

      console.log(`📤 Analyzing with model: ${motor}`)

      // Call Anthropic API
      let response
      try {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': CONFIG.API_KEY,
            'anthropic-version': '2023-06-01', // Stable API version
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: motor,
            max_tokens,
            temperature: temperatura,
            messages,
          }),
        })
      } catch (fetchError) {
        console.error(`❌ Fetch error:`, fetchError.message)
        if (!responseEnded && !res.writableEnded) {
          responseEnded = true
          sendError(res, 502, 'Failed to connect to API: ' + fetchError.message)
        }
        cleanup()
        return
      }

      let data
      let responseText = ''

      try {
        responseText = await response.text()
        console.log(`📥 Response status: ${response.status}`)
        console.log(`📥 Content-Type: ${response.headers.get('content-type')}`)
        console.log(`📥 Response preview (first 500 chars): ${responseText.substring(0, 500)}`)

        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error(`❌ JSON parse error:`, jsonError.message)
        console.error(`❌ Response was not valid JSON. Status: ${response.status}`)
        console.error(`❌ Response text: ${responseText.substring(0, 1000)}`)

        if (!responseEnded && !res.writableEnded) {
          responseEnded = true

          // Provide better error message based on status
          if (response.status === 401) {
            sendError(res, 401, 'Unauthorized: API key is invalid or expired')
          } else if (response.status === 429) {
            sendError(res, 429, 'Too many requests to Anthropic API')
          } else if (response.status >= 500) {
            sendError(res, 502, `Anthropic API error (${response.status}): Server error`)
          } else {
            sendError(res, 502, `Invalid response from API (${response.status})`)
          }
        }
        cleanup()
        return
      }

      if (!response.ok) {
        console.error(`❌ API error from Anthropic (${response.status}):`, data.error || data)
        if (!responseEnded && !res.writableEnded) {
          responseEnded = true
          sendError(res, response.status, data.error?.message || data.message || 'API request failed')
        }
        cleanup()
        return
      }

      console.log(`✅ Analysis successful with ${motor}`)
      if (!responseEnded && !res.writableEnded) {
        responseEnded = true
        sendSuccess(res, data)
      }
      cleanup()
    } catch (error) {
      console.error(`❌ Error processing request:`, error.message, error.stack)
      if (!responseEnded && !res.writableEnded) {
        responseEnded = true
        const statusCode = error.message && error.message.includes('Invalid') ? 400 : 500
        sendError(res, statusCode, error.message || 'Internal server error')
      }
      cleanup()
    }
  })
}

/**
 * Main request handler
 */
const server = http.createServer(async (req, res) => {
  try {
    setCORSHeaders(res)

    // Handle preflight CORS
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // Route requests
    if (req.method === 'POST' && req.url === '/api/analyze') {
      return await handleAnalyzeRequest(req, res)
    }

    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
      sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() })
      return
    }

    // 404
    sendError(res, 404, 'Not Found')
  } catch (error) {
    console.error('❌ Unhandled error in request handler:', error.message, error.stack)
    if (!res.headersSent) {
      sendError(res, 500, 'Internal server error')
    }
  }
})

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error)
})

server.on('clientError', (error, socket) => {
  console.error('❌ Client error:', error.message)
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  }
})

// Setup cleanup interval for rate limiting
setInterval(cleanupRateLimitTracking, RATE_LIMIT_CONFIG.CLEANUP_INTERVAL)

// Start server
validateStartupConfig()

server.listen(CONFIG.PORT, () => {
  console.log(`✅ Proxy server corriendo en http://localhost:${CONFIG.PORT}`)
  console.log(`📊 POST /api/analyze - Analizar facturas`)
  console.log(`❤️  GET /health - Health check`)
})
