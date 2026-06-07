/**
 * Invoice Queue Processor - Refactored Edition
 *
 * ARCHITECTURE:
 * - BatchProcessingService: Manages queue and parallelism
 * - FacturaProcessingService: Orchestrates invoice processing workflow
 * - Specialized services for each responsibility (SRP)
 *
 * QUALITY:
 * - Single Responsibility Principle: Each service has one reason to change
 * - Dependency Injection: Services are injected, making code testable
 * - Error Classification: Errors are categorized for better handling
 * - Comprehensive Logging: Every step is logged with context
 * - Zero Complexity: Main class is simple and readable
 */

import { BatchProcessingService } from '../services/BatchProcessingService'
import { facturaProcessingService } from '../services/FacturaProcessingService'
import { logger } from '../services/Logger'

export class FacturaQueueProcessor {
  constructor(options = {}) {
    this.batchService = new BatchProcessingService({
      maxParallel: options.maxParallel || 3,
      pollInterval: options.pollInterval || 500,
    })

    this.facturaService = facturaProcessingService

    this.logger = logger.createChild('FacturaQueueProcessor')

    // Proxy batch service methods for backward compatibility
    this.queue = this.batchService.queue
    this.processing = this.batchService.processing
    this.completed = this.batchService.completed
    this.errors = this.batchService.errors
    this.isRunning = this.batchService.isRunning
  }

  /**
   * Add files to the processing queue
   * @param {Array<File>} files - Files to process
   * @param {string} proyectoId - Project ID
   * @param {string} proyectoNumero - Project number
   * @param {string} proyectoNombre - Project name
   */
  addFiles(files, proyectoId, proyectoNumero, proyectoNombre) {
    if (!Array.isArray(files) || files.length === 0) {
      this.logger.warn('addFiles.invalid_input', { fileCount: files?.length || 0 })
      return
    }

    const context = {
      proyectoId,
      proyectoNumero,
      proyectoNombre,
    }

    this.batchService.addFiles(files, context)

    this.logger.info('files.added_to_queue', {
      count: files.length,
      projectId: proyectoId,
    })
  }

  /**
   * Start processing all queued files
   * @returns {Promise<Object>} Final results
   */
  async start() {
    this.logger.info('processing.start_requested')

    try {
      const results = await this.batchService.start((item) =>
        this._processItem(item)
      )

      return results
    } catch (error) {
      this.logger.error('processing.failed', error)
      throw error
    }
  }

  /**
   * Process a single item (delegates to FacturaProcessingService)
   * @private
   */
  async _processItem(item) {
    return this.facturaService.processInvoice(item.file, item.context)
  }

  /**
   * Pause processing
   */
  pause() {
    this.batchService.pause()
    this.logger.info('processing.paused')
  }

  /**
   * Resume processing
   */
  resume() {
    this.logger.info('processing.resume_requested')
    return this.batchService.resume((item) => this._processItem(item))
  }

  /**
   * Get current processing status
   * @returns {Object} Status object
   */
  getStatus() {
    const status = this.batchService.getStatus()
    return {
      total: status.total,
      pendientes: status.pending,
      procesando: status.processing,
      completadas: status.completed,
      errores: status.errors,
      porcentaje: status.percentage,
      isRunning: status.isRunning,
    }
  }

  /**
   * Get detailed task information
   * @returns {Object} Tasks organized by state
   */
  getTasks() {
    return this.batchService.getTasks()
  }

  /**
   * Subscribe to progress updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    return this.batchService.subscribe(callback)
  }

  /**
   * Clear all queued and processed items
   */
  clear() {
    this.batchService.clear()
    this.logger.info('queue.cleared')
  }

  /**
   * Get completed results summary
   * @returns {Object} Summary of results
   */
  getResults() {
    return this.batchService.getResults()
  }
}

// Export singleton instance for backward compatibility
export const facturaQueueProcessor = new FacturaQueueProcessor()
