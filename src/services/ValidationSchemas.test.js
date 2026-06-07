/**
 * Unit tests for ValidationSchemas
 */

import { describe, it, expect } from 'vitest'
import {
  validateInvoiceData,
  validateFileUpload,
  validateConfiguration,
  ValidationError,
  VALIDATION_RULES,
} from './ValidationSchemas'

describe('ValidationSchemas', () => {
  describe('validateInvoiceData', () => {
    it('should validate valid invoice data', () => {
      const validData = {
        numero_factura: 'INV-2024-001',
        nombre_proveedor: 'Acme Corp',
        nit_proveedor: '123456789',
        email_proveedor: 'test@acme.com',
        telefono_proveedor: '5551234567',
        fecha_emision: '2024-01-15',
        fecha_vencimiento: '2024-02-15',
        valor_antes_iva: 1000,
        porcentaje_iva: 19,
        valor_iva: 190,
        aplica_retencion: false,
        valor_retencion: 0,
      }

      const result = validateInvoiceData(validData)
      expect(result.numero_factura).toBe('INV-2024-001')
      expect(result.valor_antes_iva).toBe(1000)
    })

    it('should accept custom IVA percentage', () => {
      const data = {
        numero_factura: 'INV-001',
        nombre_proveedor: 'Supplier',
        fecha_emision: '2024-01-15',
        fecha_vencimiento: '2024-02-15',
        valor_antes_iva: 500,
        porcentaje_iva: 'custom',
        valor_iva: 85,
        aplica_retencion: false,
        valor_retencion: 0,
      }

      const result = validateInvoiceData(data)
      expect(result.porcentaje_iva).toBe('custom')
    })

    it('should throw error if numero_factura is missing', () => {
      const invalidData = {
        nombre_proveedor: 'Acme Corp',
        fecha_emision: '2024-01-15',
        fecha_vencimiento: '2024-02-15',
        valor_antes_iva: 1000,
        porcentaje_iva: 19,
        valor_iva: 190,
        aplica_retencion: false,
        valor_retencion: 0,
      }

      expect(() => validateInvoiceData(invalidData)).toThrow(ValidationError)
    })

    it('should throw error if valor_antes_iva is negative', () => {
      const invalidData = {
        numero_factura: 'INV-001',
        nombre_proveedor: 'Supplier',
        fecha_emision: '2024-01-15',
        fecha_vencimiento: '2024-02-15',
        valor_antes_iva: -100,
        porcentaje_iva: 19,
        valor_iva: 0,
        aplica_retencion: false,
        valor_retencion: 0,
      }

      expect(() => validateInvoiceData(invalidData)).toThrow(ValidationError)
    })

    it('should throw error for invalid date format', () => {
      const invalidData = {
        numero_factura: 'INV-001',
        nombre_proveedor: 'Supplier',
        fecha_emision: '01-15-2024', // Wrong format
        fecha_vencimiento: '2024-02-15',
        valor_antes_iva: 1000,
        porcentaje_iva: 19,
        valor_iva: 190,
        aplica_retencion: false,
        valor_retencion: 0,
      }

      expect(() => validateInvoiceData(invalidData)).toThrow(ValidationError)
    })
  })

  describe('validateFileUpload', () => {
    it('should validate valid PDF file', () => {
      const file = {
        size: 1024 * 100, // 100KB
        type: 'application/pdf',
        name: 'invoice.pdf',
      }

      const result = validateFileUpload(file)
      expect(result.file.type).toBe('application/pdf')
    })

    it('should reject file exceeding max size', () => {
      const file = {
        size: VALIDATION_RULES.MAX_FILE_SIZE + 1,
        type: 'application/pdf',
        name: 'large.pdf',
      }

      expect(() => validateFileUpload(file)).toThrow(ValidationError)
    })

    it('should reject unsupported file type', () => {
      const file = {
        size: 1024,
        type: 'application/msword',
        name: 'document.doc',
      }

      expect(() => validateFileUpload(file)).toThrow(ValidationError)
    })

    it('should accept image files', () => {
      const imageFile = {
        size: 1024 * 500, // 500KB
        type: 'image/jpeg',
        name: 'invoice.jpg',
      }

      const result = validateFileUpload(imageFile)
      expect(result.file.type).toBe('image/jpeg')
    })
  })

  describe('validateConfiguration', () => {
    it('should validate valid configuration', () => {
      const config = {
        proveedor: 'anthropic',
        apiKey: 'sk-ant-test-key',
        motors: ['claude-sonnet-4-6', 'claude-opus-4-1'],
        temperatura: 0.1,
        maxTokens: 1024,
        timeout: 30000,
        prompt: 'Analyze this invoice',
      }

      const result = validateConfiguration(config)
      expect(result.proveedor).toBe('anthropic')
      expect(result.motors).toHaveLength(2)
    })

    it('should reject invalid provider', () => {
      const config = {
        proveedor: 'invalid-provider',
        apiKey: 'sk-ant-test-key',
        motors: ['claude-sonnet-4-6'],
        temperatura: 0.1,
        maxTokens: 1024,
        timeout: 30000,
        prompt: 'Analyze this invoice',
      }

      expect(() => validateConfiguration(config)).toThrow(ValidationError)
    })

    it('should reject missing API key', () => {
      const config = {
        proveedor: 'anthropic',
        apiKey: '',
        motors: ['claude-sonnet-4-6'],
        temperatura: 0.1,
        maxTokens: 1024,
        timeout: 30000,
        prompt: 'Analyze this invoice',
      }

      expect(() => validateConfiguration(config)).toThrow(ValidationError)
    })

    it('should reject temperature outside valid range', () => {
      const config = {
        proveedor: 'anthropic',
        apiKey: 'sk-ant-test-key',
        motors: ['claude-sonnet-4-6'],
        temperatura: 2.5, // Max is 2.0
        maxTokens: 1024,
        timeout: 30000,
        prompt: 'Analyze this invoice',
      }

      expect(() => validateConfiguration(config)).toThrow(ValidationError)
    })

    it('should reject max_tokens outside valid range', () => {
      const config = {
        proveedor: 'anthropic',
        apiKey: 'sk-ant-test-key',
        motors: ['claude-sonnet-4-6'],
        temperatura: 0.1,
        maxTokens: 100, // Min is 256
        timeout: 30000,
        prompt: 'Analyze this invoice',
      }

      expect(() => validateConfiguration(config)).toThrow(ValidationError)
    })
  })

  describe('ValidationError', () => {
    it('should create error with correct structure', () => {
      const errors = [{ path: ['numero_factura'], message: 'Required' }]
      const error = new ValidationError('Invalid invoice data', errors)

      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Invalid invoice data')
      expect(error.statusCode).toBe(400)
      expect(error.errors).toEqual(errors)
    })

    it('should serialize to JSON correctly', () => {
      const error = new ValidationError('Test error')
      const json = error.toJSON()

      expect(json.name).toBe('ValidationError')
      expect(json.statusCode).toBe(400)
      expect(json.message).toBe('Test error')
    })
  })
})
