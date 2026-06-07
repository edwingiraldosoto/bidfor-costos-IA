/**
 * Simple wrapper for invoice analysis
 * Delegates to InvoiceAnalysisService for actual work
 * Maintains backward compatibility with existing code
 */

import { INVOICE_ANALYSIS_CONFIG, validateConfig } from './config'
import { InvoiceAnalysisService } from '../services/InvoiceAnalysisService'
import { logger } from '../services/Logger'

let analysisService = null

function getAnalysisService() {
  if (!analysisService) {
    validateConfig()
    analysisService = new InvoiceAnalysisService(INVOICE_ANALYSIS_CONFIG)
  }

  return analysisService
}

export async function analyzeFacturaPDF(file) {
  try {
    const service = getAnalysisService()
    return await service.analyzeInvoice(file)
  } catch (error) {
    logger.error('invoice.analysis.error', error)
    throw error
  }
}
