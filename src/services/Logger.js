/**
 * Centralized logger service
 * Provides structured logging with levels, timestamps, and context
 * All logs follow a consistent format for SonarQube and monitoring tools
 */

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

export class Logger {
  constructor(context = 'App', minLevel = LOG_LEVELS.DEBUG) {
    this.context = context
    this.minLevel = minLevel
  }

  formatLog(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const levelName = Object.keys(LOG_LEVELS).find((k) => LOG_LEVELS[k] === level)

    const log = {
      timestamp,
      level: levelName,
      context: this.context,
      message,
      ...(data && { data: this._sanitizeData(data) }),
    }

    return log
  }

  _sanitizeData(data) {
    if (!data) return null

    const sanitized = { ...data }

    // Remove sensitive data
    const sensitiveKeys = ['apiKey', 'api_key', 'password', 'token', 'secret']
    sensitiveKeys.forEach((key) => {
      Object.keys(sanitized).forEach((k) => {
        if (k.toLowerCase().includes(key.toLowerCase())) {
          sanitized[k] = '***REDACTED***'
        }
      })
    })

    return sanitized
  }

  _shouldLog(level) {
    return level >= this.minLevel
  }

  debug(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.DEBUG)) {
      const log = this.formatLog(LOG_LEVELS.DEBUG, message, data)
      console.log(`[${log.context}]`, message, data)
    }
  }

  info(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.INFO)) {
      const log = this.formatLog(LOG_LEVELS.INFO, message, data)
      console.log(`[${log.context}] ℹ️`, message, data ? JSON.stringify(log.data) : '')
    }
  }

  warn(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.WARN)) {
      const log = this.formatLog(LOG_LEVELS.WARN, message, data)
      console.warn(`[${log.context}] ⚠️`, message, data ? JSON.stringify(log.data) : '')
    }
  }

  error(message, error = null, data = null) {
    if (this._shouldLog(LOG_LEVELS.ERROR)) {
      const errorData = {
        message: error?.message || String(error),
        code: error?.code,
        stack: error?.stack,
        ...data,
      }
      const log = this.formatLog(LOG_LEVELS.ERROR, message, errorData)
      console.error(`[${log.context}] ❌`, message, JSON.stringify(log.data))
    }
  }

  createChild(context) {
    return new Logger(`${this.context}/${context}`, this.minLevel)
  }
}

// Default export
export const logger = new Logger('App')
