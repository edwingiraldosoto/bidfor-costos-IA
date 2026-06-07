/**
 * Configuration for invoice analysis
 * All values come from environment variables - no hardcoded values
 * Supports multiple providers: anthropic, google, openai
 */

import { validateConfiguration } from '../services/ValidationSchemas'
import { logger } from '../services/Logger'

const DEFAULT_PROMPT = `Analiza esta factura en formato PDF y extrae la siguiente información en JSON:
{
  "numero_factura": "string (número de la factura)",
  "nombre_proveedor": "string (nombre de la empresa/proveedor)",
  "nit_proveedor": "string (NIT o ID fiscal del proveedor)",
  "email_proveedor": "string o null",
  "telefono_proveedor": "string o null",
  "fecha_emision": "YYYY-MM-DD",
  "fecha_vencimiento": "YYYY-MM-DD",
  "valor_antes_iva": "number (El valor total a pagar de la factura MENOS el valor_iva sumado)",
  "porcentaje_iva": "number o string (Si hay múltiples porcentajes como en supermercados pon 'custom', de lo contrario 0, 5 o 19)",
  "valor_iva": "number (La suma total de todos los IVAs cobrados)",
  "aplica_retencion": "boolean",
  "valor_retencion": "number (0 si no aplica)"
}

IMPORTANTE:
- Si algún campo no está disponible, usa null
- Los valores deben ser números sin símbolos ($, ., ,)
- Las fechas en formato YYYY-MM-DD
- Si es una factura de contado o no tiene fecha de vencimiento, usa la misma fecha de emisión para fecha_vencimiento
- Si hay múltiples fechas, usa la de vencimiento para fecha_vencimiento
- Devuelve SOLO el JSON, sin explicaciones adicionales`

function parseMotors(motorStr) {
  if (!motorStr) return []
  return motorStr
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0)
}

export const INVOICE_ANALYSIS_CONFIG = {
  proveedor: import.meta.env.VITE_PROVEEDOR_ID || 'anthropic',
  apiKey: import.meta.env.VITE_API_KEY_IA,
  motors: parseMotors(import.meta.env.VITE_MOTOR_IA),
  temperatura: parseFloat(import.meta.env.VITE_TEMPERATURA_IA || '0.1'),
  maxTokens: 1024,
  timeout: 30000,
  prompt: import.meta.env.VITE_PROMPT_FACTURA || DEFAULT_PROMPT,
}

export function validateConfig() {
  try {
    validateConfiguration(INVOICE_ANALYSIS_CONFIG)
    logger.info('config.validated', { provider: INVOICE_ANALYSIS_CONFIG.proveedor })
  } catch (error) {
    logger.error('config.validation.failed', error)
    throw error
  }
}
