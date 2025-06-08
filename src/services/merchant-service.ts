import { db } from '@/db'
import { FilterBuilder } from './filter-builder'

export interface MerchantData {
  id: string
  name: string
  billingName: string
  category?: string
}

/**
 * Service to handle merchant operations including finding or creating merchants
 */
export class MerchantService {
  /**
   * Find or create a merchant for a user based on the billing name
   * If a merchant with the same billing name exists for the user, return it
   * Otherwise, create a new merchant with name = billingName by default
   */
  static async findOrCreateMerchant(
    userId: string, 
    billingName: string, 
    category?: string
  ): Promise<MerchantData> {
    // Clean the billing name
    const cleanBillingName = billingName.trim()
    
    // Try to find existing merchant by billing name
    let merchant = await db.merchant.findFirst({
      where: {
        userId,
        billingName: cleanBillingName
      }
    })
    
    if (!merchant) {
      // Create new merchant with name = billingName by default
      merchant = await db.merchant.create({
        data: {
          userId,
          name: cleanBillingName, // Default name is the billing name
          billingName: cleanBillingName,
          category
        }
      })
    } else if (category && !merchant.category) {
      // Update category if provided and merchant doesn't have one
      merchant = await db.merchant.update({
        where: { id: merchant.id },
        data: { category }
      })
    }
    
    return {
      id: merchant.id,
      name: merchant.name,
      billingName: merchant.billingName,
      category: merchant.category || undefined
    }
  }
  
  /**
   * Update merchant name and/or category
   */
  static async updateMerchant(
    userId: string,
    merchantId: string,
    updates: { name?: string; category?: string }
  ): Promise<MerchantData | null> {
    try {
      const merchant = await db.merchant.update({
        where: {
          id: merchantId,
          userId // Ensure user owns this merchant
        },
        data: updates
      })
      
      return {
        id: merchant.id,
        name: merchant.name,
        billingName: merchant.billingName,
        category: merchant.category || undefined
      }
    } catch (error) {
      return null
    }
  }
  
  /**
   * Get all merchants for a user
   */
  static async getUserMerchants(
    userId: string,
    filters?: {
      category?: string
      name?: string
      billingName?: string
    }
  ): Promise<MerchantData[]> {
    const where = FilterBuilder.merchantsByUser(userId, filters)
    
    const merchants = await db.merchant.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    
    return merchants.map(merchant => ({
      id: merchant.id,
      name: merchant.name,
      billingName: merchant.billingName,
      category: merchant.category || undefined
    }))
  }
  
  /**
   * Get merchant by ID for a specific user
   */
  static async getMerchantById(
    userId: string, 
    merchantId: string
  ): Promise<MerchantData | null> {
    const merchant = await db.merchant.findFirst({
      where: {
        id: merchantId,
        userId
      }
    })
    
    if (!merchant) return null
    
    return {
      id: merchant.id,
      name: merchant.name,
      billingName: merchant.billingName,
      category: merchant.category || undefined
    }
  }
  
  /**
   * Delete a merchant and unlink from transactions
   */
  static async deleteMerchant(userId: string, merchantId: string): Promise<boolean> {
    try {
      // First, unlink all transactions from this merchant
      await db.transaction.updateMany({
        where: {
          merchantId,
          statement: {
            card: {
              userId
            }
          }
        },
        data: {
          merchantId: null
        }
      })
      
      // Then delete the merchant
      await db.merchant.delete({
        where: {
          id: merchantId,
          userId
        }
      })
      
      return true
    } catch (error) {
      return false
    }
  }
  
  /**
   * Migrate existing transactions to use merchants
   * This function processes existing transactions and creates merchants for them
   */
  static async migrateExistingTransactions(userId: string): Promise<{
    processed: number
    merchantsCreated: number
    errors: number
  }> {
    let processed = 0
    let merchantsCreated = 0
    let errors = 0
    
    try {
      // Get all transactions for the user that don't have a merchant yet
      const transactions = await db.transaction.findMany({
        where: {
          merchantId: null,
          statement: {
            card: {
              userId
            }
          }
        },
        include: {
          statement: {
            include: {
              card: true
            }
          }
        }
      })
      
      // Group transactions by description to minimize merchant creation
      const transactionsByDescription = new Map<string, typeof transactions>()
      
      for (const transaction of transactions) {
        const description = transaction.description.trim()
        if (!transactionsByDescription.has(description)) {
          transactionsByDescription.set(description, [])
        }
        transactionsByDescription.get(description)!.push(transaction)
      }
      
      // Process each unique description
      for (const [description, transactionGroup] of Array.from(transactionsByDescription.entries())) {
        try {
          // Find the most common category for this merchant
          const categoryCount = new Map<string, number>()
          for (const tx of transactionGroup) {
            if (tx.category) {
              categoryCount.set(tx.category, (categoryCount.get(tx.category) || 0) + 1)
            }
          }
          
          let mostCommonCategory: string | undefined
          let maxCount = 0
          for (const [category, count] of Array.from(categoryCount.entries())) {
            if (count > maxCount) {
              maxCount = count
              mostCommonCategory = category
            }
          }
          
          // Find or create merchant
          const merchant = await this.findOrCreateMerchant(
            userId, 
            description, 
            mostCommonCategory
          )
          
          if (merchant) {
            merchantsCreated++
            
            // Update all transactions with this description to link to the merchant
            const transactionIds = transactionGroup.map(tx => tx.id)
            await db.transaction.updateMany({
              where: {
                id: { in: transactionIds }
              },
              data: {
                merchantId: merchant.id
              }
            })
            
            processed += transactionGroup.length
          }
        } catch (error) {
          console.error(`Error processing merchant "${description}":`, error)
          errors++
        }
      }
    } catch (error) {
      console.error('Error in merchant migration:', error)
      errors++
    }
    
    return { processed, merchantsCreated, errors }
  }
}