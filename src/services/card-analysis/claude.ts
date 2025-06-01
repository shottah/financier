import Anthropic from '@anthropic-ai/sdk'

import { ProcessedStatement } from './types'

export class ClaudeService {
  private anthropic: Anthropic
  private maxRetries = 3
  private retryDelay = 1000 // Start with 1 second

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }

  /**
   * Process bank statement images using Claude Vision
   */
  async processStatement(images: string[]): Promise<ProcessedStatement> {
    const prompt = this.createPrompt()
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                ...images.map(image => ({
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: 'image/png' as const,
                    data: image,
                  },
                })),
              ],
            },
          ],
        })

        const firstContent = response.content[0]
        if (firstContent.type !== 'text') {
          throw new Error('Unexpected response type from Claude')
        }
        const result = this.parseResponse(firstContent.text)
        console.log('Successfully processed statement with Claude')
        return result
      } catch (error: any) {
        console.error(`Attempt ${attempt + 1} failed:`, error)

        if (error.status === 429) {
          // Rate limit error - exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt)
          console.log(`Rate limited. Retrying in ${delay}ms...`)
          await this.sleep(delay)
          continue
        }

        if (attempt === this.maxRetries - 1) {
          throw new Error(`Failed to process statement after ${this.maxRetries} attempts`)
        }
      }
    }

    throw new Error('Failed to process statement')
  }

  /**
   * Create the prompt for Claude
   */
  private createPrompt(): string {
    return `Analyze this CREDIT CARD statement and extract the following information in JSON format:

1. Account Information:
   - Last 4 digits of account number
   - Statement period (start and end dates in YYYY-MM-DD format)
   - Opening balance
   - Closing balance

2. All transactions with:
   - Date (in YYYY-MM-DD format)
   - Description (cleaned and standardized)
   - Amount (as a positive number)
   - Type ("debit" or "credit")

CRITICAL: Only extract lines that match the exact transaction format:
[Date] [Date] [TransactionID] [Description] [Amount with currency] [Balance]
Example: "05-Dec-2023 05-Dec-2023 0612206523 CRUNCHYROLL *MEMBERSHI, 415-503-9235 (7.99 USD) $54.07"

DO NOT include:
- Summary totals or account summary lines
- Balance summaries or running totals
- Statement headers, footers, or information lines
- Any line that doesn't have ALL components: two dates, transaction ID, description, amount in parentheses, and balance

Important rules:
- Use the first date for the transaction date
- Extract amount from parentheses (e.g., "(7.99 USD)" becomes 7.99)
- Convert all dates to YYYY-MM-DD format
- Clean transaction descriptions (remove extra spaces, standardize merchant names)
- All amounts should be positive numbers
- Identify whether each transaction is a debit or credit:
  * For CREDIT CARD statements (not bank accounts):
  * POSITIVE amounts are DEBITS (money borrowed/charged to the card)
  * NEGATIVE amounts are CREDITS (money paid back to the card/refunds/cashback)
  * "INTERNET - CARD PAYMENT" (negative) = CREDIT (payment made to card)
- Handle multiple pages if present

Return ONLY valid JSON in this exact format:
{
  "accountInfo": {
    "accountNumberLast4": "1234",
    "statementPeriod": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    },
    "openingBalance": 1500.00,
    "closingBalance": 1750.25
  },
  "transactions": [
    {
      "date": "2025-01-05",
      "description": "GROCERY STORE PURCHASE",
      "amount": 42.50,
      "type": "debit"
    }
  ]
}`
  }

  /**
   * Parse Claude's response into structured data
   */
  private parseResponse(text: string): ProcessedStatement {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const data = JSON.parse(jsonMatch[0])
      
      // Validate the structure
      if (!data.accountInfo || !data.transactions) {
        throw new Error('Invalid response structure')
      }

      return data as ProcessedStatement
    } catch (error) {
      console.error('Error parsing Claude response:', error)
      console.debug('Raw response:', text)
      throw new Error('Failed to parse Claude response')
    }
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}