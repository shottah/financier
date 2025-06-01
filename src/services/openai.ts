import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Optional: Set a different base URL if needed
  // baseURL: process.env.OPENAI_BASE_URL,
  // Optional: Set timeout
  // timeout: 60000, // 60 seconds
  // Optional: Set max retries
  // maxRetries: 3,
})

// Example function for chat completions
export async function getChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  model: string = 'gpt-3.5-turbo'
): Promise<OpenAI.Chat.ChatCompletion> {
  return await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
  })
}

// Example function for transaction categorization using OpenAI
export async function categorizeTransactionWithAI(
  description: string,
  amount: number,
  type: 'DEBIT' | 'CREDIT'
): Promise<string> {
  try {
    const prompt = `Categorize the following bank transaction into one of these categories:
    - Food & Dining
    - Shopping
    - Transportation
    - Entertainment
    - Utilities
    - Transfers
    - Banking & Fees
    - Travel
    - Insurance
    - Healthcare
    - Fitness & Sports
    - Other
    
    Transaction: ${description}
    Amount: $${amount}
    Type: ${type}
    
    Respond with only the category name.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that categorizes bank transactions accurately.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 20,
    })

    const category = response.choices[0]?.message?.content?.trim()
    
    // Validate the category against our predefined list
    const validCategories = [
      'Food & Dining',
      'Shopping',
      'Transportation',
      'Entertainment',
      'Utilities',
      'Transfers',
      'Banking & Fees',
      'Travel',
      'Insurance',
      'Healthcare',
      'Fitness & Sports',
      'Other'
    ]
    
    return category && validCategories.includes(category) ? category : 'Other'
  } catch (error) {
    console.error('Error categorizing transaction with AI:', error)
    return 'Other'
  }
}

// Export the OpenAI instance for direct use if needed
export default openai