/**
 * Invoice Repository Service
 * Single Responsibility: Data persistence for invoices
 * - Save invoices to database
 * - Retrieve invoices
 * - Update invoice status
 * Follows Repository Pattern (abstracts DB details)
 */

import { supabase } from '../lib/supabase'
import { logger } from './Logger'

export class InvoiceRepository {
  constructor() {
    this.logger = logger.createChild('InvoiceRepository')
    this.tableName = 'facturas'
  }

  /**
   * Save a new invoice to database
   * @param {Object} invoiceData - Invoice data to persist
   * @returns {Promise<Object>} Saved invoice with ID
   * @throws {Error} If insert fails
   */
  async create(invoiceData) {
    this.logger.debug('invoice.create.start', {
      invoice_number: invoiceData.numero_factura,
      supplier: invoiceData.proveedor_id,
    })

    try {
      // Validate required fields
      this._validateInvoiceData(invoiceData)

      // Insert into database
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([invoiceData])
        .select()

      if (error) {
        throw new Error(`Database insert error: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('Invoice was not created (no data returned)')
      }

      const savedInvoice = data[0]

      this.logger.info('invoice.created', {
        invoice_id: savedInvoice.id,
        invoice_number: savedInvoice.numero_factura,
      })

      return savedInvoice
    } catch (error) {
      this.logger.error('invoice.create.failed', error, {
        invoice_number: invoiceData.numero_factura,
      })
      throw error
    }
  }

  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object|null>} Invoice data or null if not found
   */
  async getById(invoiceId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      this.logger.error('invoice.getById.failed', error, { invoice_id: invoiceId })
      throw error
    }
  }

  /**
   * Get invoice by invoice number and project
   * @param {string} invoiceNumber - Invoice number (numero_factura)
   * @param {string} projectId - Project ID
   * @returns {Promise<Object|null>} Invoice data or null
   */
  async getByInvoiceNumber(invoiceNumber, projectId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('numero_factura', invoiceNumber)
        .eq('proyecto_id', projectId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      this.logger.error('invoice.getByNumber.failed', error, {
        invoice_number: invoiceNumber,
        project_id: projectId,
      })
      throw error
    }
  }

  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Updated invoice
   */
  async updateStatus(invoiceId, newStatus) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          estado_pago_id: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()

      if (error) {
        throw error
      }

      this.logger.debug('invoice.status.updated', {
        invoice_id: invoiceId,
        new_status: newStatus,
      })

      return data[0]
    } catch (error) {
      this.logger.error('invoice.updateStatus.failed', error, {
        invoice_id: invoiceId,
        status: newStatus,
      })
      throw error
    }
  }

  /**
   * Get invoices by project
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options (limit, offset, etc.)
   * @returns {Promise<Array>} Invoices
   */
  async getByProject(projectId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('proyecto_id', projectId)
        .range(offset, offset + limit - 1)
        .order('fecha_emision', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      this.logger.error('invoice.getByProject.failed', error, {
        project_id: projectId,
      })
      throw error
    }
  }

  /**
   * Check if invoice already exists
   * @param {string} invoiceNumber - Invoice number
   * @param {string} projectId - Project ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(invoiceNumber, projectId) {
    const existing = await this.getByInvoiceNumber(invoiceNumber, projectId)
    return existing !== null
  }

  /**
   * Validate invoice data before persistence
   * @private
   */
  _validateInvoiceData(data) {
    const requiredFields = [
      'numero_factura',
      'proveedor_id',
      'proyecto_id',
      'fecha_emision',
      'valor_antes_iva',
      'porcentaje_iva',
      'valor_iva',
    ]

    const missing = requiredFields.filter((field) => !data[field])
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }
  }
}

export const invoiceRepository = new InvoiceRepository()
