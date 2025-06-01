import { CacheService } from './cache'
import { ClaudeService } from './claude'
import { OpenAIService } from './openai'
import { PDFProcessor } from './pdf-processor'
import { ProcessedStatement } from './types'

export type AIProvider = 'claude' | 'openai' | 'none'

export class CardAnalysisProcessor {
  private claudeService: ClaudeService
  private openaiService: OpenAIService
  private pdfProcessor: PDFProcessor
  private cacheService: CacheService

  constructor() {
    this.claudeService = new ClaudeService()
    this.openaiService = new OpenAIService()
    this.pdfProcessor = new PDFProcessor()
    this.cacheService = new CacheService()
  }

  /**
   * Process a bank statement PDF file
   * @param file - The PDF file to process
   * @param provider - The AI provider to use ('claude', 'openai', or 'none')
   * @param forceReprocess - Whether to bypass cache and force reprocessing
   */
  async processStatement(
    file: File, 
    provider: AIProvider = 'openai',
    forceReprocess: boolean = false
  ): Promise<ProcessedStatement> {
    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const pdfBuffer = Buffer.from(arrayBuffer)

      // Check cache first (unless force reprocess is true)
      const cacheKey = `${provider}:${pdfBuffer.toString('base64').slice(0, 32)}`
      if (!forceReprocess) {
        const cachedResult = await this.cacheService.get(pdfBuffer)
        if (cachedResult) {
          console.log('Returning cached result')
          return cachedResult
        }
      } else {
        console.log('Force reprocessing - bypassing cache')
        // Clear the existing cache entry for this file
        await this.cacheService.delete(pdfBuffer)
      }

      let result: ProcessedStatement

      if (provider === 'openai') {
        // Extract text from PDF for OpenAI processing
        console.log('Extracting text from PDF...')
        const pdfParse = require('@/lib/pdf-parse-patch')
        const pdfData = await pdfParse(pdfBuffer)
        const text = pdfData.text

        // Process with OpenAI
        console.log('Processing with OpenAI...')
        result = await this.openaiService.processStatementText(text)
      } else if (provider === 'claude') {
        // Convert PDF to images for Claude
        console.log('Converting PDF to images...')
        const images = await this.pdfProcessor.convertToImages(pdfBuffer)

        // Process with Claude
        console.log('Processing with Claude AI...')
        result = await this.claudeService.processStatement(images)
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`)
      }

      // Cache the result
      await this.cacheService.set(pdfBuffer, result)

      // Clean up expired cache entries
      await this.cacheService.clearExpired()

      return result
    } catch (error) {
      console.error('Error processing statement:', error)
      throw error
    }
  }

  /**
   * Process a bank statement using text extraction only (no AI)
   */
  async processStatementText(text: string): Promise<ProcessedStatement> {
    // This method can be used for non-AI processing
    // Currently, the regex-based extraction is in the route file
    // Could be moved here for better organization
    throw new Error('Text-only processing not implemented in this service')
  }
}

// Export a singleton instance
export const cardAnalysisProcessor = new CardAnalysisProcessor()

// Export types and services for direct use if needed
export type { ProcessedStatement, Transaction, AccountInfo } from './types'
export { ClaudeService } from './claude'
export { OpenAIService } from './openai'