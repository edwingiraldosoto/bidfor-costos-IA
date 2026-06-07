/**
 * API Provider Factory - implements Open/Closed principle
 * Supports multiple AI providers (Anthropic, Google, OpenAI)
 * New providers can be added without modifying existing code
 */

import { logger } from './Logger'

/**
 * Abstract base class for AI providers
 */
export class BaseAPIProvider {
  constructor(config) {
    this.config = config
    this.logger = logger.createChild(this.constructor.name)
  }

  /**
   * Analyze invoice data
   * @abstract
   */
  async analyze(options) {
    throw new Error('analyze() must be implemented')
  }

  /**
   * Validate configuration
   * @abstract
   */
  validateConfig() {
    throw new Error('validateConfig() must be implemented')
  }

  protected _extractJsonFromResponse(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No valid JSON found in response')
    return JSON.parse(jsonMatch[0])
  }
}

/**
 * Anthropic Claude provider
 */
export class AnthropicProvider extends BaseAPIProvider {
  constructor(config) {
    super(config)
    this.endpoint = 'https://api.anthropic.com/v1/messages'
    this.version = '2023-06-01'
    this.validateConfig()
  }

  validateConfig() {
    if (!this.config.apiKey) throw new Error('API key is required for Anthropic')
  }

  async analyze(options) {
    const { motor, images, temperatura, max_tokens, prompt } = options

    const messages = [
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
            text: prompt,
          },
        ],
      },
    ]

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': this.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: motor,
        max_tokens,
        temperature: temperatura,
        messages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMsg = errorData.error?.message || 'Unknown error'
      throw new Error(`Anthropic API error: ${errorMsg}`)
    }

    const data = await response.json()

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response structure from Anthropic API')
    }

    return this._extractJsonFromResponse(data.content[0].text)
  }
}

/**
 * Google Gemini provider (placeholder for future implementation)
 */
export class GoogleGeminiProvider extends BaseAPIProvider {
  constructor(config) {
    super(config)
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models'
    this.validateConfig()
  }

  validateConfig() {
    if (!this.config.apiKey) throw new Error('API key is required for Google Gemini')
  }

  async analyze(options) {
    throw new Error('Google Gemini provider not yet implemented')
  }
}

/**
 * OpenAI provider (placeholder for future implementation)
 */
export class OpenAIProvider extends BaseAPIProvider {
  constructor(config) {
    super(config)
    this.endpoint = 'https://api.openai.com/v1/chat/completions'
    this.validateConfig()
  }

  validateConfig() {
    if (!this.config.apiKey) throw new Error('API key is required for OpenAI')
  }

  async analyze(options) {
    throw new Error('OpenAI provider not yet implemented')
  }
}

/**
 * Factory for creating API providers
 * Usage: const provider = APIProviderFactory.create('anthropic', config)
 */
export class APIProviderFactory {
  static PROVIDERS = {
    anthropic: AnthropicProvider,
    google: GoogleGeminiProvider,
    openai: OpenAIProvider,
  }

  /**
   * Create a provider instance
   * @param {string} providerName - 'anthropic', 'google', or 'openai'
   * @param {Object} config - Provider configuration
   * @returns {BaseAPIProvider} Provider instance
   * @throws {Error} If provider not found
   */
  static create(providerName, config) {
    const ProviderClass = this.PROVIDERS[providerName.toLowerCase()]

    if (!ProviderClass) {
      throw new Error(
        `Unknown provider: ${providerName}. Available: ${Object.keys(this.PROVIDERS).join(', ')}`
      )
    }

    return new ProviderClass(config)
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders() {
    return Object.keys(this.PROVIDERS)
  }
}

export default APIProviderFactory
