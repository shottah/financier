import { ProcessedStatement } from '@/types/card-processor'

const PROCESSOR_API_URL = process.env.NEXT_PUBLIC_PROCESSOR_API_URL || 'http://localhost:3001/api'
const PROCESSOR_API_KEY = process.env.NEXT_PUBLIC_PROCESSOR_API_KEY!

export class CardAnalysisService {
  /**
   * Process a bank statement PDF using the external processor service
   */
  async processStatement(pdfFile: File): Promise<ProcessedStatement> {
    const formData = new FormData()
    formData.append('statement', pdfFile)

    try {
      const response = await fetch(`${PROCESSOR_API_URL}/process`, {
        method: 'POST',
        headers: {
          'X-API-Key': PROCESSOR_API_KEY,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to process statement')
      }

      const result = await response.json()
      return result as ProcessedStatement
    } catch (error) {
      console.error('Error processing statement:', error)
      throw error
    }
  }

  /**
   * Check if the processor service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${PROCESSOR_API_URL}/health`)
      const data = await response.json()
      return data.status === 'healthy'
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}