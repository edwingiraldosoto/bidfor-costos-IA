/**
 * Invoice analysis service - orchestrates PDF analysis and data extraction
 * Coordinates: PDF conversion → API calls via proxy → Validation
 * Single responsibility: invoice analysis workflow
 */

import { pdfConverter } from './PDFConverter'
import { validateInvoiceData, validateFileUpload } from './ValidationSchemas'
import { logger } from './Logger'

const PROXY_URL = 'http://localhost:3001'

export class InvoiceAnalysisService {
  constructor(config) {
    this.config = config
    this.logger = logger.createChild('InvoiceAnalysisService')
  }

  /**
   * Analyze invoice from file (PDF or image)
   * @param {File} file - PDF or image file
   * @returns {Promise<Object>} Extracted invoice data with validation
   * @throws {ValidationError} If data is invalid
   */
  async analyzeInvoice(file) {
    this.logger.info('invoice.analysis.started', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // Step 1: Validate file
    validateFileUpload(file)

    // Step 2: Convert to images
    const images = await this._getImages(file)

    // Step 3: Analyze with API (retry logic)
    const result = await this._analyzeWithRetry(images, file.name)

    // Step 4: Validate and return
    try {
      const validatedData = validateInvoiceData(result)

      this.logger.info('invoice.analysis.success', {
        invoice_number: validatedData.numero_factura,
        provider: validatedData.nombre_proveedor,
        motor_used: result._motorUsado,
      })

      return validatedData
    } catch (validationError) {
      this.logger.error('invoice.validation.failed', validationError, {
        extractedData: JSON.stringify(result).substring(0, 500),
      })
      throw validationError
    }
  }

  async _getImages(file) {
    if (file.type === 'application/pdf') {
      this.logger.debug('file.type.pdf', { fileName: file.name })
      return pdfConverter.convert(file)
    }

    if (file.type.startsWith('image/')) {
      this.logger.debug('file.type.image', { fileName: file.name, mimeType: file.type })
      return [await this._imageToBase64(file)]
    }

    throw new Error(
      `Unsupported file type: ${file.type}. Allowed: PDF, JPG, PNG, WebP`
    )
  }

  async _imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async _analyzeWithRetry(images, fileName) {
    const motors = this.config.motors
    const errors = []

    for (const motor of motors) {
      try {
        this.logger.debug('api.request.start', { motor, fileName })

        const response = await fetch(`${PROXY_URL}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            motor,
            temperatura: this.config.temperatura,
            max_tokens: this.config.maxTokens,
            messages: [
              {
                role: 'user',
                content: [
                  ...images.map((imgBase64) => ({
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'image/jpeg',
                      data: imgBase64,
                    },
                  })),
                  {
                    type: 'text',
                    text: this.config.prompt,
                  },
                ],
              },
            ],
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          const errorMsg = data.error || 'Unknown error'
          this.logger.warn('api.request.failed', new Error(errorMsg), { motor, fileName })
          errors.push({ motor, error: errorMsg })
          continue
        }

        this.logger.debug('api.request.success', { motor })

        // Extract JSON from response
        const extractedText = data.content[0].text

        // Try to extract JSON from markdown code block first
        let jsonText = extractedText
        const codeBlockMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1].trim()
        }

        // Extract JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/)

        if (!jsonMatch) {
          const error = 'No valid JSON in response'
          this.logger.warn('json.parse.failed', new Error(error), { motor })
          errors.push({ motor, error })
          continue
        }

        const result = JSON.parse(jsonMatch[0])
        result._motorUsado = motor

        return result
      } catch (error) {
        const errorMsg = error.message || String(error)
        errors.push({ motor, error: errorMsg })
        this.logger.warn('api.request.error', error, { motor, fileName })
      }
    }

    // All models failed
    const errorMessage = `All motors failed: ${errors.map((e) => `${e.motor}: ${e.error}`).join('; ')}`
    this.logger.error('analysis.all_motors_failed', new Error(errorMessage))
    throw new Error(errorMessage)
  }
}
