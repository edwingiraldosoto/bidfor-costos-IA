import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

app.post('/api/analyze-invoice', async (req, res) => {
  try {
    const { base64, motors, temperatura, prompt, apiKey } = req.body

    if (!apiKey) {
      return res.status(400).json({ error: 'API key requerida' })
    }

    if (!motors || motors.length === 0) {
      return res.status(400).json({ error: 'Al menos un motor requerido' })
    }

    const errors = []

    // Intentar con cada motor
    for (const motor of motors) {
      try {
        console.log(`[${motor}] Analizando...`)

        const response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: motor,
            max_tokens: 1024,
            temperature: temperatura,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'application/pdf',
                      data: base64,
                    },
                  },
                  {
                    type: 'text',
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          const errorMsg = errorData.error?.message || 'Unknown error'
          errors.push({ motor, error: errorMsg })
          console.warn(`[${motor}] Error: ${errorMsg}`)
          continue
        }

        const data = await response.json()
        const extractedText = data.content[0].text

        // Parsear JSON
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          errors.push({ motor, error: 'JSON no encontrado' })
          continue
        }

        const extractedData = JSON.parse(jsonMatch[0])
        extractedData._motorUsado = motor

        console.log(`[${motor}] ✅ Éxito`)
        return res.json(extractedData)
      } catch (motorError) {
        const errorMsg = motorError.message || String(motorError)
        errors.push({ motor, error: errorMsg })
        console.warn(`[${motor}] ${errorMsg}`)
      }
    }

    // Todos fallaron
    const errorMessage = `Todos los motores fallaron:\n${errors.map((e) => `- ${e.motor}: ${e.error}`).join('\n')}`
    return res.status(400).json({ error: errorMessage })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Proxy server corriendo en http://localhost:${PORT}`)
  console.log(`📊 POST /api/analyze-invoice para analizar facturas`)
})
