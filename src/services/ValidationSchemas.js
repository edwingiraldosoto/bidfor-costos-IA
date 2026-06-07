/**
 * Validation schemas for invoice data and API requests
 * Uses Zod for runtime type validation with clear error messages
 */

import { z } from 'zod'

// Constants for validation
export const VALIDATION_RULES = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_MODELS: ['claude-sonnet-4-6', 'claude-opus-4-1', 'claude-3-5-haiku-20241022'],
  ALLOWED_PROVIDERS: ['anthropic', 'google', 'openai'],
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  MAX_TOKENS_MIN: 256,
  MAX_TOKENS_MAX: 4096,
}

// Invoice data extracted from PDF/Image
export const InvoiceDataSchema = z
  .object({
    numero_factura: z.string().min(1, 'Invoice number is required'),
    nombre_proveedor: z.string().min(1, 'Provider name is required'),
    nit_proveedor: z.string().nullable().default(null),
    email_proveedor: z.string().email().nullable().default(null),
    telefono_proveedor: z.string().nullable().default(null),
    fecha_emision: z.string().date('Invalid emission date format (YYYY-MM-DD)'),
    fecha_vencimiento: z.string().date('Invalid due date format (YYYY-MM-DD)'),
    valor_antes_iva: z.number().positive('Value before VAT must be positive'),
    porcentaje_iva: z.union([
      z.number().min(0).max(100),
      z.literal('custom'),
    ]),
    valor_iva: z.number().min(0, 'VAT value cannot be negative'),
    aplica_retencion: z.boolean().default(false),
    valor_retencion: z.number().min(0).default(0),
  })
  .strict()

// API request body for invoice analysis
export const AnalyzeInvoiceRequestSchema = z.object({
  motor: z
    .string()
    .refine(
      (m) => VALIDATION_RULES.ALLOWED_MODELS.includes(m),
      `Model must be one of: ${VALIDATION_RULES.ALLOWED_MODELS.join(', ')}`
    ),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.array(
        z.union([
          z.object({
            type: z.literal('text'),
            text: z.string(),
          }),
          z.object({
            type: z.literal('image'),
            source: z.object({
              type: z.literal('base64'),
              media_type: z.string(),
              data: z.string(),
            }),
          }),
        ])
      ),
    })
  ),
  temperatura: z
    .number()
    .min(VALIDATION_RULES.TEMPERATURE_MIN)
    .max(VALIDATION_RULES.TEMPERATURE_MAX)
    .default(0.1),
  max_tokens: z
    .number()
    .min(VALIDATION_RULES.MAX_TOKENS_MIN)
    .max(VALIDATION_RULES.MAX_TOKENS_MAX)
    .default(1024),
})

// File upload validation
export const FileUploadSchema = z.object({
  file: z
    .object({
      size: z.number().max(VALIDATION_RULES.MAX_FILE_SIZE, 'File too large (max 50MB)'),
      type: z
        .string()
        .refine(
          (t) => VALIDATION_RULES.ALLOWED_FILE_TYPES.includes(t),
          `File type must be one of: ${VALIDATION_RULES.ALLOWED_FILE_TYPES.join(', ')}`
        ),
      name: z.string().min(1),
    })
    .passthrough(),
})

// Configuration validation
export const ConfigurationSchema = z.object({
  proveedor: z
    .enum(VALIDATION_RULES.ALLOWED_PROVIDERS)
    .refine((p) => p, 'Provider must be specified'),
  apiKey: z.string().min(1, 'API key is required'),
  motors: z.array(z.string()).min(1, 'At least one model is required'),
  temperatura: z
    .number()
    .min(VALIDATION_RULES.TEMPERATURE_MIN)
    .max(VALIDATION_RULES.TEMPERATURE_MAX)
    .default(0.1),
  maxTokens: z
    .number()
    .min(VALIDATION_RULES.MAX_TOKENS_MIN)
    .max(VALIDATION_RULES.MAX_TOKENS_MAX)
    .default(1024),
  timeout: z.number().min(1000).default(30000),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
})

/**
 * Validates invoice data extracted from AI
 * @throws {ValidationError} If data doesn't match schema
 */
export function validateInvoiceData(data) {
  try {
    // Parse but allow partial data (coerce types)
    const parsed = {
      numero_factura: String(data.numero_factura || ''),
      nombre_proveedor: String(data.nombre_proveedor || ''),
      nit_proveedor: data.nit_proveedor || null,
      email_proveedor: data.email_proveedor || null,
      telefono_proveedor: data.telefono_proveedor || null,
      fecha_emision: String(data.fecha_emision || ''),
      fecha_vencimiento: String(data.fecha_vencimiento || data.fecha_emision || ''),
      valor_antes_iva: Number(data.valor_antes_iva) || 0,
      porcentaje_iva: data.porcentaje_iva === 'custom' ? 'custom' : (Number(data.porcentaje_iva) || 0),
      valor_iva: Number(data.valor_iva) || 0,
      aplica_retencion: Boolean(data.aplica_retencion) || false,
      valor_retencion: Number(data.valor_retencion) || 0,
    }

    // Minimal validation
    if (!parsed.numero_factura) throw new Error('numero_factura is required')
    if (!parsed.nombre_proveedor) throw new Error('nombre_proveedor is required')
    if (!parsed.fecha_emision) throw new Error('fecha_emision is required')
    if (parsed.valor_antes_iva <= 0) throw new Error('valor_antes_iva must be positive')

    return parsed
  } catch (error) {
    throw new ValidationError('Invalid invoice data: ' + error.message)
  }
}

/**
 * Validates API analysis request
 * @throws {ValidationError} If request is invalid
 */
export function validateAnalysisRequest(request) {
  try {
    return AnalyzeInvoiceRequestSchema.parse(request)
  } catch (error) {
    throw new ValidationError('Invalid analysis request', error.errors)
  }
}

/**
 * Validates file upload
 * @throws {ValidationError} If file is invalid
 */
export function validateFileUpload(file) {
  try {
    return FileUploadSchema.parse({ file })
  } catch (error) {
    throw new ValidationError('Invalid file upload', error.errors)
  }
}

/**
 * Validates configuration
 * @throws {ValidationError} If config is invalid
 */
export function validateConfiguration(config) {
  try {
    return ConfigurationSchema.parse(config)
  } catch (error) {
    throw new ValidationError('Invalid configuration', error.errors)
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
    this.statusCode = 400
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors,
      statusCode: this.statusCode,
    }
  }
}
