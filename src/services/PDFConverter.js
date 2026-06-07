/**
 * PDF conversion service - handles PDF to image conversion
 * Follows Single Responsibility Principle: only converts PDFs
 */

import * as pdfjsLib from 'pdfjs-dist'
import { logger } from './Logger'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// PDF conversion configuration
const PDF_CONFIG = {
  SCALE: 2.0, // 2x scale for better OCR quality
  JPEG_QUALITY: 0.9, // High quality, smaller file
  MAX_CANVAS_DIMENSION: 16000, // Browser canvas memory limit
  MAX_HEIGHT_PER_SLICE: 4000, // Anthropic image size limit
}

export class PDFConverter {
  constructor() {
    this.logger = logger.createChild('PDFConverter')
  }

  /**
   * Convert PDF to base64 images
   * @param {File} file - PDF file
   * @returns {Promise<string[]>} Array of base64 encoded JPEG images
   * @throws {Error} If conversion fails
   */
  async convert(file) {
    this.logger.info('conversion.started', { fileName: file.name, fileSize: file.size })

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await this._loadPDF(arrayBuffer)

      const images = []
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const pageImages = await this._convertPage(pdf, pageNum)
        images.push(...pageImages)
      }

      this.logger.info('conversion.completed', {
        fileName: file.name,
        totalPages: pdf.numPages,
        totalImages: images.length,
      })

      return images
    } catch (error) {
      this.logger.error('conversion.failed', error, { fileName: file.name })
      throw error
    }
  }

  async _loadPDF(arrayBuffer) {
    return pdfjsLib.getDocument({ data: arrayBuffer }).promise
  }

  async _convertPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum)
    const canvas = await this._renderPageToCanvas(page)
    return this._sliceCanvasIfNeeded(canvas, pageNum)
  }

  async _renderPageToCanvas(page) {
    const scale = this._calculateOptimalScale(page)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const context = canvas.getContext('2d')
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise

    return canvas
  }

  _calculateOptimalScale(page) {
    const baseViewport = page.getViewport({ scale: 1 })
    const maxDimension = Math.max(baseViewport.width, baseViewport.height)

    let scale = PDF_CONFIG.SCALE

    // If document is too large, reduce scale to avoid browser memory limits
    if (maxDimension * scale > PDF_CONFIG.MAX_CANVAS_DIMENSION) {
      scale = PDF_CONFIG.MAX_CANVAS_DIMENSION / maxDimension
      this.logger.warn('scale.adjusted', {
        originalScale: PDF_CONFIG.SCALE,
        adjustedScale: scale.toFixed(2),
        reason: 'Document exceeds canvas dimension limit',
      })
    }

    return scale
  }

  _sliceCanvasIfNeeded(canvas, pageNum) {
    if (canvas.height <= PDF_CONFIG.MAX_HEIGHT_PER_SLICE) {
      return [this._canvasToBase64(canvas)]
    }

    return this._sliceCanvasIntoChunks(canvas, pageNum)
  }

  _sliceCanvasIntoChunks(canvas, pageNum) {
    const images = []
    let currentY = 0
    let sliceCount = 1

    while (currentY < canvas.height) {
      const sliceHeight = Math.min(
        PDF_CONFIG.MAX_HEIGHT_PER_SLICE,
        canvas.height - currentY
      )

      const sliceCanvas = this._createSliceCanvas(canvas, currentY, sliceHeight)
      const base64 = this._canvasToBase64(sliceCanvas)

      images.push(base64)

      this.logger.debug('page.slice.created', {
        page: pageNum,
        slice: sliceCount,
        height: sliceHeight,
      })

      currentY += sliceHeight
      sliceCount++
    }

    return images
  }

  _createSliceCanvas(sourceCanvas, startY, height) {
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = sourceCanvas.width
    sliceCanvas.height = height

    const context = sliceCanvas.getContext('2d')
    context.drawImage(
      sourceCanvas,
      0, // sourceX
      startY, // sourceY
      sourceCanvas.width, // sourceWidth
      height, // sourceHeight
      0, // destX
      0, // destY
      sliceCanvas.width, // destWidth
      sliceCanvas.height // destHeight
    )

    return sliceCanvas
  }

  _canvasToBase64(canvas) {
    const dataUrl = canvas.toDataURL('image/jpeg', PDF_CONFIG.JPEG_QUALITY)
    return dataUrl.split(',')[1]
  }
}

export const pdfConverter = new PDFConverter()
