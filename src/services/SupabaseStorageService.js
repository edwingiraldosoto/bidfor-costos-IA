/**
 * Supabase Storage Service
 * Single Responsibility: File storage operations
 * - Upload files to Supabase bucket
 * - Delete files
 * - Generate public URLs
 */

import { supabase } from '../lib/supabase'
import { logger } from './Logger'

const BUCKET_NAME = 'facturas'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export class SupabaseStorageService {
  constructor() {
    this.logger = logger.createChild('SupabaseStorageService')
    this.bucketName = BUCKET_NAME
  }

  /**
   * Upload invoice file to storage
   * @param {File} file - File to upload
   * @param {string} projectNumber - Project number for path
   * @param {string} projectName - Project name for organization
   * @param {string} invoiceNumber - Invoice number for filename
   * @returns {Promise<Object>} { url: string, path: string }
   * @throws {Error} If upload fails
   */
  async uploadInvoiceFile(file, projectNumber, projectName, invoiceNumber) {
    this.logger.debug('file.upload.start', {
      fileName: file.name,
      fileSize: file.size,
      invoiceNumber,
    })

    try {
      // Validate file
      this._validateFile(file)

      // Generate safe path
      const filePath = this._generateFilePath(projectNumber, projectName, invoiceNumber, file.name)

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw new Error(`Storage upload error: ${error.message}`)
      }

      // Generate public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      this.logger.info('file.uploaded', {
        fileName: file.name,
        filePath,
        url: publicUrl,
        invoiceNumber,
      })

      return {
        url: publicUrl,
        path: filePath,
        size: file.size,
      }
    } catch (error) {
      this.logger.error('file.upload.failed', error, {
        fileName: file.name,
        invoiceNumber,
      })
      throw error
    }
  }

  /**
   * Delete file from storage
   * @param {string} filePath - File path in bucket
   * @returns {Promise<void>}
   * @throws {Error} If delete fails
   */
  async deleteFile(filePath) {
    this.logger.debug('file.delete.start', { filePath })

    try {
      if (!filePath) {
        throw new Error('File path is required')
      }

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        throw new Error(`Storage delete error: ${error.message}`)
      }

      this.logger.info('file.deleted', { filePath })
    } catch (error) {
      this.logger.error('file.delete.failed', error, { filePath })
      throw error
    }
  }

  /**
   * Validate file before upload
   * @private
   */
  _validateFile(file) {
    if (!file) {
      throw new Error('File is required')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
      )
    }

    // Allow common invoice file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/xml',
      'application/xml',
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `File type not allowed: ${file.type}. Allowed: ${allowedTypes.join(', ')}`
      )
    }
  }

  /**
   * Generate safe file path for storage
   * Path structure: /PROYECTO_NUMERO/PROYECTO_NOMBRE/FACTURA_NUMERO/filename
   * @private
   */
  _generateFilePath(projectNumber, projectName, invoiceNumber, fileName) {
    // Sanitize inputs to prevent directory traversal
    const safeProjNum = this._sanitizePathComponent(projectNumber)
    const safeProjName = this._sanitizePathComponent(projectName)
    const safeInvNum = this._sanitizePathComponent(invoiceNumber)
    const safeFileName = this._sanitizeFileName(fileName)

    return `${safeProjNum}/${safeProjName}/${safeInvNum}/${safeFileName}`
  }

  /**
   * Sanitize path component to prevent traversal attacks
   * @private
   */
  _sanitizePathComponent(component) {
    if (!component) return 'UNKNOWN'
    // Remove ../, ..\\, and other problematic characters
    return String(component)
      .replace(/\.\.\//g, '')
      .replace(/\.\.\\/g, '')
      .replace(/[<>:"|?*]/g, '')
      .substring(0, 100) // Limit length
  }

  /**
   * Sanitize filename while preserving extension
   * @private
   */
  _sanitizeFileName(fileName) {
    if (!fileName) return 'documento'

    // Split name and extension
    const parts = fileName.split('.')
    const ext = parts.length > 1 ? parts[parts.length - 1] : 'pdf'
    let name = parts.slice(0, -1).join('.')

    // Remove problematic characters from name
    name = name
      .replace(/[<>:"|?*]/g, '')
      .substring(0, 100)

    // Ensure we have a valid filename
    name = name || 'documento'

    // Return sanitized filename with timestamp
    const timestamp = Date.now()
    return `${name}-${timestamp}.${ext}`
  }

  /**
   * Get public URL for a file
   * @param {string} filePath - File path in bucket
   * @returns {string} Public URL
   */
  getPublicUrl(filePath) {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}

export const suprabaseStorageService = new SupabaseStorageService()
