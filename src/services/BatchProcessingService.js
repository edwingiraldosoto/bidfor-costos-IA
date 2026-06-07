/**
 * Batch Processing Service
 * Single Responsibility: Orchestrate batch processing workflow
 * - Manage queue state
 * - Coordinate parallel processing
 * - Delegate to specialized services
 * - Notify progress
 */

import { logger } from './Logger'

export class BatchProcessingService {
  constructor(options = {}) {
    this.maxParallel = options.maxParallel || 3
    this.pollInterval = options.pollInterval || 500 // ms

    // State management
    this.queue = []
    this.processing = []
    this.completed = []
    this.errors = []
    this.isRunning = false
    this.listeners = []

    this.logger = logger.createChild('BatchProcessingService')
  }

  /**
   * Add files to processing queue
   * @param {Array<File>} files - Files to process
   * @param {Object} context - Project and metadata context
   */
  addFiles(files, context) {
    if (!Array.isArray(files) || files.length === 0) {
      this.logger.warn('queue.add.empty')
      return
    }

    files.forEach((file) => {
      const item = {
        id: this._generateId(),
        file,
        context,
        state: 'pending',
        progress: 0,
        error: null,
        errorType: null,
        result: null,
        timestamp: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      }
      this.queue.push(item)
    })

    this.logger.info('files.added.to.queue', {
      count: files.length,
      queueLength: this.queue.length,
    })

    this._notifyListeners()
  }

  /**
   * Start processing queue
   * @param {Function} processorFn - Function to process each item
   * @returns {Promise<Object>} Final results
   */
  async start(processorFn) {
    if (!processorFn || typeof processorFn !== 'function') {
      throw new Error('processorFn must be a function')
    }

    if (this.isRunning) {
      this.logger.warn('processing.already_running')
      return
    }

    this.isRunning = true
    this.logger.info('batch.processing.started', {
      totalItems: this.queue.length,
      maxParallel: this.maxParallel,
    })
    this._notifyListeners()

    try {
      while (this.queue.length > 0 || this.processing.length > 0) {
        // Move items from queue to processing (up to maxParallel)
        while (this.processing.length < this.maxParallel && this.queue.length > 0) {
          const item = this.queue.shift()
          item.state = 'processing'
          item.startedAt = new Date().toISOString()
          this.processing.push(item)

          // Start processing (fire and forget)
          this._processItem(item, processorFn)
        }

        // Wait before checking again
        await this._sleep(this.pollInterval)
      }

      this.logger.info('batch.processing.completed', {
        completed: this.completed.length,
        errors: this.errors.length,
        total: this.completed.length + this.errors.length,
      })

      return this.getResults()
    } finally {
      this.isRunning = false
      this._notifyListeners()
    }
  }

  /**
   * Process single item
   * @private
   */
  async _processItem(item, processorFn) {
    try {
      const result = await processorFn(item)

      item.state = 'completed'
      item.progress = 100
      item.result = result
      item.completedAt = new Date().toISOString()

      this.processing = this.processing.filter((p) => p.id !== item.id)
      this.completed.push(item)

      this.logger.debug('item.processed.success', {
        itemId: item.id,
        duration: this._calculateDuration(item),
      })

      this._notifyListeners()
    } catch (error) {
      item.state = 'error'
      item.progress = -1
      item.error = error.message
      item.errorType = this._classifyError(error)
      item.completedAt = new Date().toISOString()

      this.processing = this.processing.filter((p) => p.id !== item.id)
      this.errors.push(item)

      this.logger.error('item.processed.error', error, {
        itemId: item.id,
        errorType: item.errorType,
        duration: this._calculateDuration(item),
      })

      this._notifyListeners()
    }
  }

  /**
   * Pause processing
   */
  pause() {
    this.isRunning = false
    this.logger.info('batch.paused')
    this._notifyListeners()
  }

  /**
   * Resume processing
   * @param {Function} processorFn - Function to process items
   */
  async resume(processorFn) {
    if (this.queue.length === 0) {
      this.logger.warn('resume.called.but.queue.empty')
      return
    }
    await this.start(processorFn)
  }

  /**
   * Get current status
   */
  getStatus() {
    const total =
      this.queue.length + this.processing.length + this.completed.length + this.errors.length
    const processed = this.completed.length + this.errors.length

    return {
      total,
      pending: this.queue.length,
      processing: this.processing.length,
      completed: this.completed.length,
      errors: this.errors.length,
      percentage: total === 0 ? 0 : Math.round((processed * 100) / total),
      isRunning: this.isRunning,
    }
  }

  /**
   * Get all tasks organized by state
   */
  getTasks() {
    return {
      completed: [...this.completed],
      processing: [...this.processing],
      pending: [...this.queue],
      errors: [...this.errors],
    }
  }

  /**
   * Get final results
   */
  getResults() {
    return {
      status: this.getStatus(),
      completed: this.completed.map((item) => ({
        id: item.id,
        file: item.file.name,
        result: item.result,
        timestamp: item.completedAt,
      })),
      errors: this.errors.map((item) => ({
        id: item.id,
        file: item.file.name,
        error: item.error,
        errorType: item.errorType,
        timestamp: item.completedAt,
      })),
    }
  }

  /**
   * Subscribe to progress updates
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }
    this.listeners.push(callback)

    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  /**
   * Clear all data
   */
  clear() {
    if (this.isRunning) {
      this.logger.warn('clear.called.while.running')
    }
    this.queue = []
    this.processing = []
    this.completed = []
    this.errors = []
    this.logger.debug('batch.cleared')
    this._notifyListeners()
  }

  /**
   * Notify all listeners
   * @private
   */
  _notifyListeners() {
    const status = this.getStatus()
    this.listeners.forEach((callback) => {
      try {
        callback(status)
      } catch (error) {
        this.logger.error('listener.callback.error', error)
      }
    })
  }

  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return `batch-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  /**
   * Sleep for ms milliseconds
   * @private
   */
  async _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Calculate item processing duration
   * @private
   */
  _calculateDuration(item) {
    if (!item.startedAt || !item.completedAt) return 0
    return new Date(item.completedAt) - new Date(item.startedAt)
  }

  /**
   * Classify error type for better logging
   * @private
   */
  _classifyError(error) {
    const message = error.message || String(error)
    if (message.includes('analizar') || message.includes('analyze')) return 'analysis'
    if (message.includes('proveedor') || message.includes('provider')) return 'provider'
    if (message.includes('storage') || message.includes('upload')) return 'storage'
    if (message.includes('database') || message.includes('insert')) return 'database'
    if (message.includes('validation')) return 'validation'
    if (message.includes('timeout')) return 'timeout'
    return 'unknown'
  }
}

export const batchProcessingService = new BatchProcessingService()
