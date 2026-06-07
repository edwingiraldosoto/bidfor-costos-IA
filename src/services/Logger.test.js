/**
 * Unit tests for Logger service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Logger, LOG_LEVELS } from './Logger'

describe('Logger', () => {
  let logger
  let consoleSpy

  beforeEach(() => {
    logger = new Logger('TestContext', LOG_LEVELS.DEBUG)
    // Spy on console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(),
      warn: vi.spyOn(console, 'warn').mockImplementation(),
      error: vi.spyOn(console, 'error').mockImplementation(),
    }
  })

  afterEach(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.warn.mockRestore()
    consoleSpy.error.mockRestore()
  })

  describe('log levels', () => {
    it('should have correct log level constants', () => {
      expect(LOG_LEVELS.DEBUG).toBe(0)
      expect(LOG_LEVELS.INFO).toBe(1)
      expect(LOG_LEVELS.WARN).toBe(2)
      expect(LOG_LEVELS.ERROR).toBe(3)
    })
  })

  describe('debug()', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message')
      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should include context in debug logs', () => {
      logger.debug('Test message')
      const callArgs = consoleSpy.log.mock.calls[0]
      expect(callArgs[0]).toContain('TestContext')
    })

    it('should include data in debug logs', () => {
      const data = { userId: 123 }
      logger.debug('Test message', data)
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('TestContext'),
        'Test message',
        data
      )
    })
  })

  describe('info()', () => {
    it('should log info messages', () => {
      logger.info('Test info message')
      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should include emoji in info logs', () => {
      logger.info('Test message')
      const callArgs = consoleSpy.log.mock.calls[0]
      expect(callArgs[0]).toContain('ℹ️')
    })
  })

  describe('warn()', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning')
      expect(consoleSpy.warn).toHaveBeenCalled()
    })

    it('should include warning emoji', () => {
      logger.warn('Test message')
      const callArgs = consoleSpy.warn.mock.calls[0]
      expect(callArgs[0]).toContain('⚠️')
    })
  })

  describe('error()', () => {
    it('should log error messages', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error)
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should include error emoji', () => {
      logger.error('Test message', new Error('error'))
      const callArgs = consoleSpy.error.mock.calls[0]
      expect(callArgs[0]).toContain('❌')
    })

    it('should extract error details from Error object', () => {
      const error = new Error('Test error message')
      logger.error('Failed operation', error)
      const callArgs = consoleSpy.error.mock.calls[0]
      const logData = JSON.parse(callArgs[2])
      expect(logData.data.message).toBe('Test error message')
    })
  })

  describe('createChild()', () => {
    it('should create child logger with nested context', () => {
      const childLogger = logger.createChild('ChildContext')
      expect(childLogger.context).toBe('TestContext/ChildContext')
    })

    it('should inherit log level from parent', () => {
      const childLogger = logger.createChild('Child')
      expect(childLogger.minLevel).toBe(LOG_LEVELS.DEBUG)
    })
  })

  describe('data sanitization', () => {
    it('should redact sensitive API keys', () => {
      const sensitiveData = {
        apiKey: 'sk-ant-secret-key-12345',
        username: 'testuser',
      }
      logger.info('Test', sensitiveData)
      const callArgs = consoleSpy.log.mock.calls[0]
      expect(callArgs[3]).toContain('***REDACTED***')
    })

    it('should redact password fields', () => {
      const sensitiveData = {
        password: 'super-secret-password',
        username: 'user',
      }
      logger.info('Test', sensitiveData)
      const callArgs = consoleSpy.log.mock.calls[0]
      expect(callArgs[3]).toContain('***REDACTED***')
    })

    it('should redact token fields', () => {
      const sensitiveData = {
        token: 'eyJhbGciOiJIUzI1NiJ9...',
        userId: 123,
      }
      logger.info('Test', sensitiveData)
      const callArgs = consoleSpy.log.mock.calls[0]
      expect(callArgs[3]).toContain('***REDACTED***')
    })
  })

  describe('log level filtering', () => {
    it('should not log debug when minLevel is INFO', () => {
      const infoLogger = new Logger('TestContext', LOG_LEVELS.INFO)
      infoLogger.debug('Debug message')
      expect(consoleSpy.log).not.toHaveBeenCalled()
    })

    it('should not log warn when minLevel is ERROR', () => {
      const errorLogger = new Logger('TestContext', LOG_LEVELS.ERROR)
      errorLogger.warn('Warning message')
      expect(consoleSpy.warn).not.toHaveBeenCalled()
    })

    it('should log error regardless of minLevel', () => {
      const infoLogger = new Logger('TestContext', LOG_LEVELS.INFO)
      infoLogger.error('Error message', new Error('test'))
      expect(consoleSpy.error).toHaveBeenCalled()
    })
  })
})
