/**
 * Factura Processing Service
 * Single Responsibility: Orchestrate complete invoice processing workflow
 * Coordinates: Analysis → Validation → Provider → Storage → Database
 * Uses specialized services for each step (Dependency Injection)
 */

import { logger } from './Logger'
import { analyzeFacturaPDF } from '../lib/analyzeFacturaPDF'
import { invoiceValidationService } from './InvoiceValidationService'
import { invoiceRepository } from './InvoiceRepository'
import { suprabaseStorageService } from './SupabaseStorageService'

// These would be injected in constructor ideally
// For now using direct imports
import { obtenerOCrearProveedor } from '../lib/proveedorHelper'
import { validarFechaFactura } from '../lib/dateValidator'
import { validateWithDIAN } from '../lib/dianValidator'

export class FacturaProcessingService {
  constructor(options = {}) {
    this.logger = logger.createChild('FacturaProcessingService')
    this.options = {
      validateDIAN: options.validateDIAN !== false, // default true
      checkDate: options.checkDate !== false,
      ...options,
    }
  }

  /**
   * Process a single invoice file
   * @param {File} file - Invoice file (PDF, image, XML)
   * @param {Object} context - { proyectoId, proyectoNumero, proyectoNombre }
   * @returns {Promise<Object>} Processing result
   * @throws {Error} If processing fails critically
   */
  async processInvoice(file, context) {
    const startTime = Date.now()

    this.logger.info('factura.processing.started', {
      fileName: file.name,
      proyecto: context.proyectoId,
    })

    try {
      // Step 1: Analyze invoice
      const extractedData = await this._analyzeFile(file)

      // Step 2: Validate extracted data
      await this._validateExtractedData(extractedData)

      // Step 3: Check if invoice already exists
      await this._checkDuplicate(extractedData, context)

      // Step 4: Get or create provider
      const provider = await this._getOrCreateProvider(extractedData)

      // Step 5: Validate invoice date (optional, non-blocking)
      if (this.options.checkDate) {
        await this._validateInvoiceDate(extractedData, context)
      }

      // Step 6: Validate with DIAN (optional)
      let dianValidation = null
      if (this.options.validateDIAN) {
        dianValidation = await this._validateWithDIAN(extractedData)
      }

      // Step 7: Upload file to storage
      const storageResult = await this._uploadFile(file, context, extractedData)

      // Step 8: Save to database
      const savedInvoice = await this._saveToDatabase(
        extractedData,
        provider,
        context,
        storageResult
      )

      const duration = Date.now() - startTime

      this.logger.info('factura.processing.completed', {
        invoiceId: savedInvoice.id,
        invoiceNumber: savedInvoice.numero_factura,
        provider: provider.nombre,
        duration: `${duration}ms`,
      })

      return {
        success: true,
        invoiceId: savedInvoice.id,
        invoiceNumber: savedInvoice.numero_factura,
        provider: provider.nombre,
        amount: extractedData.valor_antes_iva,
        dianValidation: dianValidation?.estado || 'no-validated',
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      this.logger.error('factura.processing.failed', error, {
        fileName: file.name,
        proyecto: context.proyectoId,
        duration: `${duration}ms`,
      })

      throw error
    }
  }

  /**
   * Analyze file to extract invoice data
   * @private
   */
  async _analyzeFile(file) {
    try {
      this.logger.debug('file.analysis.started', { fileName: file.name })

      const data = await analyzeFacturaPDF(file)

      this.logger.debug('file.analysis.completed', {
        fileName: file.name,
        invoiceNumber: data.numero_factura,
      })

      return data
    } catch (error) {
      throw new Error(`Failed to analyze file: ${error.message}`)
    }
  }

  /**
   * Validate extracted data
   * @private
   */
  async _validateExtractedData(data) {
    const validation = invoiceValidationService.validate(data)

    if (!validation.valid) {
      const errorMessage = invoiceValidationService.getErrorMessage(validation.errors)
      throw new Error(errorMessage)
    }

    this.logger.debug('data.validation.passed', {
      invoiceNumber: data.numero_factura,
    })
  }

  /**
   * Check for duplicate invoice
   * @private
   */
  async _checkDuplicate(data, context) {
    try {
      const exists = await invoiceRepository.exists(data.numero_factura, context.proyectoId)

      if (exists) {
        throw new Error(
          `Invoice ${data.numero_factura} already exists in this project`
        )
      }

      this.logger.debug('duplicate.check.passed', {
        invoiceNumber: data.numero_factura,
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Get or create provider
   * @private
   */
  async _getOrCreateProvider(data) {
    try {
      this.logger.debug('provider.get_or_create.started', {
        providerName: data.nombre_proveedor,
      })

      const provider = await obtenerOCrearProveedor(data)

      this.logger.debug('provider.get_or_create.completed', {
        providerId: provider.id,
        providerName: provider.nombre,
      })

      return provider
    } catch (error) {
      throw new Error(`Failed to get or create provider: ${error.message}`)
    }
  }

  /**
   * Validate invoice date
   * @private
   */
  async _validateInvoiceDate(data, context) {
    try {
      const dateToValidate = data.fecha_emision || data.fecha_vencimiento

      const validation = await validarFechaFactura(dateToValidate, context.proyectoId)

      if (!validation.valida) {
        throw new Error(validation.mensaje)
      }

      this.logger.debug('date.validation.passed', {
        invoiceNumber: data.numero_factura,
        message: validation.mensaje,
      })
    } catch (error) {
      throw new Error(`Date validation failed: ${error.message}`)
    }
  }

  /**
   * Validate with DIAN
   * @private
   */
  async _validateWithDIAN(data) {
    try {
      this.logger.debug('dian.validation.started', {
        invoiceNumber: data.numero_factura,
      })

      const result = await validateWithDIAN(data)

      this.logger.debug('dian.validation.completed', {
        invoiceNumber: data.numero_factura,
        status: result.estado,
      })

      return result
    } catch (error) {
      this.logger.warn('dian.validation.failed', error, {
        invoiceNumber: data.numero_factura,
      })
      // DIAN validation is optional, don't throw
      return null
    }
  }

  /**
   * Upload file to storage
   * @private
   */
  async _uploadFile(file, context, invoiceData) {
    try {
      this.logger.debug('file.upload.started', {
        fileName: file.name,
        invoiceNumber: invoiceData.numero_factura,
      })

      const result = await suprabaseStorageService.uploadInvoiceFile(
        file,
        context.proyectoNumero,
        context.proyectoNombre,
        invoiceData.numero_factura
      )

      this.logger.debug('file.upload.completed', {
        invoiceNumber: invoiceData.numero_factura,
        url: result.url,
      })

      return result
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  /**
   * Save invoice to database
   * @private
   */
  async _saveToDatabase(invoiceData, provider, context, storageResult) {
    try {
      this.logger.debug('database.save.started', {
        invoiceNumber: invoiceData.numero_factura,
      })

      const dbData = {
        numero_factura: invoiceData.numero_factura,
        proveedor_id: provider.id,
        proyecto_id: context.proyectoId,
        fecha_emision: invoiceData.fecha_emision,
        fecha_vencimiento: invoiceData.fecha_vencimiento,
        valor_antes_iva: Number(invoiceData.valor_antes_iva),
        porcentaje_iva: invoiceData.porcentaje_iva,
        valor_iva: Number(invoiceData.valor_iva),
        aplica_retencion: invoiceData.aplica_retencion || false,
        valor_retencion: Number(invoiceData.valor_retencion || 0),
        valor_neto_pagar:
          Number(invoiceData.valor_antes_iva) +
          Number(invoiceData.valor_iva) -
          Number(invoiceData.valor_retencion || 0),
        estado_pago_id: 'pendiente',
        archivo_url: storageResult.url,
      }

      const savedInvoice = await invoiceRepository.create(dbData)

      this.logger.debug('database.save.completed', {
        invoiceId: savedInvoice.id,
        invoiceNumber: savedInvoice.numero_factura,
      })

      return savedInvoice
    } catch (error) {
      throw new Error(`Failed to save to database: ${error.message}`)
    }
  }
}

export const facturaProcessingService = new FacturaProcessingService()
