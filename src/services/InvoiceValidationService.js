/**
 * Invoice Validation Service
 * Single Responsibility: Validate invoice data
 * - Required fields
 * - Data types and ranges
 * - Business rules (positive values, valid dates)
 * Does NOT call external services
 */

import { logger } from './Logger'
import { validateInvoiceData } from './ValidationSchemas'

const REQUIRED_FIELDS = [
  'numero_factura',
  'nombre_proveedor',
  'fecha_emision',
  'valor_antes_iva',
  'porcentaje_iva',
  'valor_iva',
]

export class InvoiceValidationService {
  constructor() {
    this.logger = logger.createChild('InvoiceValidationService')
  }

  /**
   * Validate extracted invoice data
   * @param {Object} invoiceData - Data extracted from PDF/XML/image
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(invoiceData) {
    const errors = []

    // 1. Check ONLY critical required fields
    const criticalFields = ['numero_factura', 'nombre_proveedor', 'fecha_emision', 'valor_antes_iva']
    const missingCritical = criticalFields.filter(field => !invoiceData[field])

    if (missingCritical.length > 0) {
      errors.push(`Missing critical fields: ${missingCritical.join(', ')}`)
      this.logger.warn('validation.failed.missing_critical', {
        missingFields: missingCritical,
        invoice: invoiceData.numero_factura,
      })
      return { valid: false, errors }
    }

    // 2. Validate ONLY critical data types
    const valorBase = Number(invoiceData.valor_antes_iva)
    if (isNaN(valorBase) || valorBase <= 0) {
      errors.push('valor_antes_iva must be a positive number')
    }

    // Validate dates are in correct format
    if (invoiceData.fecha_emision) {
      const fecha = new Date(invoiceData.fecha_emision)
      if (isNaN(fecha.getTime())) {
        errors.push('fecha_emision must be YYYY-MM-DD format')
      }
    }

    if (errors.length > 0) {
      this.logger.warn('validation.failed.critical', {
        invoice: invoiceData.numero_factura,
        errors,
      })
      return { valid: false, errors }
    }

    this.logger.debug('validation.passed', {
      invoice: invoiceData.numero_factura,
    })

    return { valid: true, errors: [] }
  }

  /**
   * Validate that all required fields are present
   * @private
   */
  _validateRequiredFields(data) {
    return REQUIRED_FIELDS.filter((field) => !data[field])
  }

  /**
   * Validate data types and ranges
   * @private
   */
  _validateDataTypes(data) {
    const errors = []

    // Validate valor_antes_iva is a positive number
    const valorBase = Number(data.valor_antes_iva)
    if (isNaN(valorBase) || valorBase <= 0) {
      errors.push('valor_antes_iva must be a positive number')
    }

    // Validate valor_iva is non-negative
    const valorIVA = Number(data.valor_iva)
    if (isNaN(valorIVA) || valorIVA < 0) {
      errors.push('valor_iva must be a non-negative number')
    }

    // Validate valor_retencion is non-negative
    if (data.valor_retencion !== undefined) {
      const valorRetencion = Number(data.valor_retencion)
      if (isNaN(valorRetencion) || valorRetencion < 0) {
        errors.push('valor_retencion must be a non-negative number')
      }
    }

    // Validate porcentaje_iva is valid
    if (data.porcentaje_iva !== 'custom') {
      const porcentaje = Number(data.porcentaje_iva)
      if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        errors.push('porcentaje_iva must be between 0 and 100 or "custom"')
      }
    }

    // Validate aplica_retencion is boolean
    if (typeof data.aplica_retencion !== 'boolean') {
      errors.push('aplica_retencion must be a boolean')
    }

    return errors
  }

  /**
   * Validate business rules
   * @private
   */
  _validateBusinessRules(data) {
    const errors = []

    // Validate dates
    const fechaEmision = new Date(data.fecha_emision)
    if (isNaN(fechaEmision.getTime())) {
      errors.push('fecha_emision must be a valid date (YYYY-MM-DD)')
    }

    const fechaVencimiento = new Date(data.fecha_vencimiento)
    if (isNaN(fechaVencimiento.getTime())) {
      errors.push('fecha_vencimiento must be a valid date (YYYY-MM-DD)')
    }

    // Validate due date is not before emission date
    if (
      !isNaN(fechaEmision.getTime()) &&
      !isNaN(fechaVencimiento.getTime()) &&
      fechaVencimiento < fechaEmision
    ) {
      errors.push('fecha_vencimiento cannot be before fecha_emision')
    }

    // Validate IVA is reasonable (total IVA shouldn't exceed 50% of base)
    const valorBase = Number(data.valor_antes_iva)
    const valorIVA = Number(data.valor_iva)
    if (valorBase > 0 && valorIVA / valorBase > 0.5) {
      errors.push(
        `IVA (${((valorIVA / valorBase) * 100).toFixed(1)}%) seems too high relative to base value`
      )
    }

    // Validate retention is reasonable (shouldn't exceed 10% of base)
    const valorRetencion = Number(data.valor_retencion || 0)
    if (valorBase > 0 && valorRetencion / valorBase > 0.1) {
      errors.push(
        `Retention (${((valorRetencion / valorBase) * 100).toFixed(1)}%) seems too high relative to base value`
      )
    }

    return errors
  }

  /**
   * Get validation errors for display
   */
  getErrorMessage(errors) {
    if (errors.length === 0) return null
    if (errors.length === 1) return errors[0]
    return `Validation errors: ${errors.join('; ')}`
  }
}

export const invoiceValidationService = new InvoiceValidationService()
