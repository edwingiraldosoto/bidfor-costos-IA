/**
 * Tests for InvoiceValidationService
 * Tests validation of invoice data
 */

import { describe, it, expect } from 'vitest'
import { InvoiceValidationService } from './InvoiceValidationService'

describe('InvoiceValidationService', () => {
  let service

  beforeEach(() => {
    service = new InvoiceValidationService()
  })

  describe('validate()', () => {
    const validInvoice = {
      numero_factura: 'INV-2024-001',
      nombre_proveedor: 'Acme Corp',
      nit_proveedor: '123456789',
      email_proveedor: 'info@acme.com',
      telefono_proveedor: '5551234567',
      fecha_emision: '2024-01-15',
      fecha_vencimiento: '2024-02-15',
      valor_antes_iva: 10000,
      porcentaje_iva: 19,
      valor_iva: 1900,
      aplica_retencion: false,
      valor_retencion: 0,
    }

    it('should validate correct invoice data', () => {
      const result = service.validate(validInvoice)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const invalid = { ...validInvoice }
      delete invalid.numero_factura

      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Missing fields')
    })

    it('should detect multiple missing fields', () => {
      const invalid = { ...validInvoice }
      delete invalid.numero_factura
      delete invalid.nombre_proveedor

      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Missing fields')
    })

    it('should reject negative valor_antes_iva', () => {
      const invalid = { ...validInvoice, valor_antes_iva: -100 }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })

    it('should reject zero valor_antes_iva', () => {
      const invalid = { ...validInvoice, valor_antes_iva: 0 }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })

    it('should reject negative valor_iva', () => {
      const invalid = { ...validInvoice, valor_iva: -100 }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })

    it('should allow zero valor_iva', () => {
      const data = { ...validInvoice, valor_iva: 0 }
      const result = service.validate(data)
      expect(result.valid).toBe(true)
    })

    it('should accept custom porcentaje_iva', () => {
      const data = { ...validInvoice, porcentaje_iva: 'custom' }
      const result = service.validate(data)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid porcentaje_iva', () => {
      const invalid = { ...validInvoice, porcentaje_iva: 150 }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })

    it('should validate date format', () => {
      const invalid = { ...validInvoice, fecha_emision: '01-15-2024' }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })

    it('should reject due date before emission date', () => {
      const invalid = {
        ...validInvoice,
        fecha_emision: '2024-02-15',
        fecha_vencimiento: '2024-01-15',
      }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })

    it('should allow same date for emission and due', () => {
      const data = {
        ...validInvoice,
        fecha_emision: '2024-01-15',
        fecha_vencimiento: '2024-01-15',
      }
      const result = service.validate(data)
      expect(result.valid).toBe(true)
    })

    it('should reject unreasonably high IVA', () => {
      const invalid = {
        ...validInvoice,
        valor_antes_iva: 100,
        valor_iva: 60, // 60% IVA is unrealistic
      }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })

    it('should reject unreasonably high retention', () => {
      const invalid = {
        ...validInvoice,
        valor_antes_iva: 100,
        valor_retencion: 20, // 20% retention is unrealistic
      }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })

    it('should validate boolean aplica_retencion', () => {
      const invalid = { ...validInvoice, aplica_retencion: 'yes' }
      const result = service.validate(invalid)
      expect(result.valid).toBe(false)
    })
  })

  describe('getErrorMessage()', () => {
    it('should return null for no errors', () => {
      const message = service.getErrorMessage([])
      expect(message).toBeNull()
    })

    it('should return single error directly', () => {
      const message = service.getErrorMessage(['Single error'])
      expect(message).toBe('Single error')
    })

    it('should format multiple errors', () => {
      const message = service.getErrorMessage(['Error 1', 'Error 2', 'Error 3'])
      expect(message).toContain('Validation errors')
      expect(message).toContain('Error 1')
      expect(message).toContain('Error 2')
    })
  })
})
