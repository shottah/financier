import OpenAI from 'openai'
import { ProcessedStatement, Transaction } from './types'

export class OpenAIService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Process bank statement text using OpenAI
   */
  async processStatementText(text: string): Promise<ProcessedStatement> {
    try {
      console.log(`\n=== Starting statement processing with GPT-4o-mini ===`)
      
      const validCategories = this.getValidCategories()
      
      // Single prompt for both extraction and categorization
      const extractionPrompt = `Extract structured data from this bank statement AND categorize each transaction.

CRITICAL: Only extract lines that match this exact transaction format:
[Date] [Date] [TransactionID] [Description] [Amount with currency] [Balance]
Example: "05-Dec-2023 05-Dec-2023 0612206523 CRUNCHYROLL *MEMBERSHI, 415-503-9235 (7.99 USD) $54.07"

DO NOT include:
- Summary totals (like "Total Purchases: $500.00")
- Balance summaries
- Statement headers or footers
- Any line that doesn't have ALL of these components: two dates, transaction ID, description, amount, and balance

Return a JSON object with:
1. accountInfo: {
    accountNumberLast4: string,
    statementPeriod: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" },
    openingBalance: number,
    closingBalance: number
  }
2. transactions: array of {
    date: "YYYY-MM-DD" (use the first date),
    description: string (merchant name and details),
    amount: number (as absolute value from the parentheses),
    type: "debit" or "credit",
    category: string (from the categories list below)
  }

IMPORTANT CREDIT CARD STATEMENT RULES:
- For CREDIT CARD statements (not bank accounts):
  * POSITIVE amounts = DEBITS = Money borrowed/charged to the card (purchases, fees)
  * NEGATIVE amounts = CREDITS = Money paid back to the card (payments, refunds, cashback)
- Special cases:
  * "INTERNET - CARD PAYMENT" (negative) = CREDIT (payment made to card)
  * Refunds are CREDITS (shown as negative)
  * Cashback rewards are CREDITS (shown as negative)
  * Purchases and fees are DEBITS (shown as positive)
  * Card payments/repayments are CREDITS (shown as negative)

CATEGORIES - Use ONLY these categories:
${validCategories.map(cat => `- ${cat}`).join('\n')}

IMPORTANT CATEGORIZATION RULES:
- ALWAYS use the most specific category available
- Only use "Other" if NONE of the categories even remotely apply
- Common patterns:
  * Gas stations → "Gas & Fuel"
  * Supermarkets → "Groceries" 
  * Restaurants/cafes → "Restaurants"
  * Uber/Lyft → "Ride Sharing"
  * Netflix/Spotify → "Streaming Services"
  * Card payment credits/cashback → "Banking & Fees"
  * Internet payments (negative amounts) → "Banking & Fees"

Bank statement text:
${text}

Return only valid JSON matching the structure above.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert financial data extraction and categorization assistant specializing in CREDIT CARD statements. Extract credit card statement data accurately and categorize each transaction using the MOST SPECIFIC category from the provided list. Pay careful attention to determining whether transactions are debits (charges/borrowed money) or credits (payments/refunds) based on the sign of the amount and the transaction description. Remember: for credit cards, positive amounts are money borrowed, negative amounts are money paid back.',
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })

      console.log('OpenAI Response:')
      console.log('Prompt tokens:', response.usage?.prompt_tokens)
      console.log('Completion tokens:', response.usage?.completion_tokens)
      console.log('Total tokens:', response.usage?.total_tokens)

      const extractedData = JSON.parse(response.choices[0]?.message?.content || '{}')

      // Validate and ensure proper structure
      const accountInfo = extractedData.accountInfo || {
        accountNumberLast4: '',
        statementPeriod: { start: '', end: '' },
        openingBalance: 0,
        closingBalance: 0,
      }

      const transactions = extractedData.transactions || []

      // Validate categories and add any missing ones
      const validatedTransactions = transactions.map((tx: any) => {
        const category = validCategories.includes(tx.category) ? tx.category : 'Other'
        return {
          ...tx,
          category,
        }
      })

      console.log('\nExtracted and categorized transactions:')
      validatedTransactions.forEach((tx: any, index: number) => {
        console.log(`${index + 1}. ${tx.description} → ${tx.category}`)
      })
      console.log('=== Statement processing complete ===\n')

      return {
        accountInfo,
        transactions: validatedTransactions,
      }
    } catch (error) {
      console.error('Error processing with OpenAI:', error)
      throw new Error(
        `OpenAI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get the list of valid transaction categories
   */
  private getValidCategories(): string[] {
    return [
      'Food & Dining',
      'Groceries',
      'Restaurants',
      'Shopping',
      'Clothing & Accessories',
      'Electronics',
      'Home & Garden',
      'Transportation',
      'Gas & Fuel',
      'Public Transit',
      'Ride Sharing',
      'Vehicle Maintenance',
      'Entertainment',
      'Streaming Services',
      'Movies & Shows',
      'Gaming',
      'Utilities',
      'Electricity',
      'Water',
      'Internet & Phone',
      'Rent & Mortgage',
      'Property Management',
      'Transfers',
      'Banking & Fees',
      'ATM Withdrawals',
      'Travel',
      'Hotels & Lodging',
      'Flights',
      'Car Rentals',
      'Insurance',
      'Healthcare',
      'Pharmacy',
      'Medical Services',
      'Fitness & Sports',
      'Gym Memberships',
      'Sports Equipment',
      'Education',
      'Subscriptions',
      'Personal Care',
      'Pets',
      'Gifts & Donations',
      'Government & Taxes',
      'Investments',
      'Business Expenses',
      'Other',
    ]
  }

  /**
   * Categorize all transactions in a single batch request
   * This is now a fallback function - main processing uses processStatementText
   */
  private async categorizeTransactionsBatch(transactions: Transaction[]): Promise<Transaction[]> {
    if (transactions.length === 0) {
      return transactions
    }

    console.log(`\n=== Starting categorization for ${transactions.length} transactions ===`)

    const validCategories = this.getValidCategories()

    try {
      // Create a prompt that includes all transactions
      const transactionList = transactions
        .map((tx, index) => `${index + 1}. ${tx.description} (${tx.type}, $${tx.amount})`)
        .join('\n')
      
      console.log('Transactions to categorize:')
      console.log(transactionList)

      const prompt = `Categorize the following bank transactions into the MOST SPECIFIC category from this list:
${validCategories.map(cat => `- ${cat}`).join('\n')}

IMPORTANT RULES:
1. ALWAYS use the most specific category available (e.g., "Groceries" instead of "Food & Dining" for supermarkets)
2. Only use "Other" if NONE of the categories even remotely apply
3. For merchants with multiple categories, choose based on the primary business (e.g., Walmart → "Groceries", not "Shopping")
4. Consider common merchant patterns:
   - Gas stations → "Gas & Fuel"
   - Supermarkets → "Groceries"
   - Restaurants/cafes → "Restaurants"  
   - Uber/Lyft → "Ride Sharing"
   - Netflix/Spotify → "Streaming Services"
   - Amazon → Usually "Shopping" unless clearly groceries

Transactions:
${transactionList}

Return a JSON object with a "categories" array containing the category for each transaction IN ORDER. 
The categories array MUST have exactly ${transactions.length} items.
Example: {"categories": ["Groceries", "Gas & Fuel", "Restaurants"]}`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert financial analyst specializing in transaction categorization. You MUST categorize each transaction using the MOST SPECIFIC category available from the provided list. Avoid using "Other" unless absolutely no other category applies. Always respond with a JSON object containing a "categories" array.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })

      // Parse the response
      const content = response.choices[0]?.message?.content || '{"categories": []}'
      let categories: string[]

      console.log('OpenAI Categorization Response:')
      console.log('Raw content:', content)
      console.log('Prompt tokens:', response.usage?.prompt_tokens)
      console.log('Completion tokens:', response.usage?.completion_tokens)
      console.log('Total tokens:', response.usage?.total_tokens)

      try {
        const parsed = JSON.parse(content)
        categories = parsed.categories || []

        // Ensure we have the right number of categories
        if (categories.length !== transactions.length) {
          console.warn(
            `Category count mismatch: got ${categories.length}, expected ${transactions.length}`
          )
          // Fill missing categories with "Other"
          while (categories.length < transactions.length) {
            categories.push('Other')
          }
          // Trim excess categories
          categories = categories.slice(0, transactions.length)
        }
      } catch (e) {
        console.error('Failed to parse categories response:', content)
        // Fill all with "Other" on parse error
        categories = new Array(transactions.length).fill('Other')
      }

      // Map categories back to transactions with validation
      const categorizedTransactions = transactions.map((transaction, index) => {
        const category = categories[index] || 'Other'
        const validCategory = validCategories.includes(category) ? category : 'Other'
        return {
          ...transaction,
          category: validCategory,
        }
      })

      console.log('\nCategorization results:')
      categorizedTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.description} → ${tx.category}`)
      })
      console.log('=== Categorization complete ===\n')

      return categorizedTransactions
    } catch (error) {
      console.error('Error categorizing transactions:', error)
      // Return transactions with "Other" category on error
      return transactions.map(tx => ({ ...tx, category: 'Other' }))
    }
  }

  /**
   * Process statement with image understanding (for future use with GPT-4 Vision)
   */
  async processStatementImages(images: Buffer[]): Promise<ProcessedStatement> {
    // This method is prepared for when GPT-4 Vision API becomes more accessible
    // For now, we'll use OCR + text processing
    throw new Error('Image processing not yet implemented. Use processStatementText instead.')
  }
}
