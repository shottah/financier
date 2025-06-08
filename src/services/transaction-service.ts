import { db } from '@/db'
import { MerchantService } from './merchant-service'
import { FilterBuilder } from './filter-builder'
import { Prisma } from '@prisma/client'

// Input interface for creating transactions (this is needed as it's not a DB entity)
export interface CreateTransactionInput {
  date: Date
  description: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  category?: string
  statementId: string
}

/**
 * Service to handle transaction operations including creation, updates, and merchant linking
 */
export class TransactionService {
  /**
   * Create a single transaction with automatic merchant linking
   */
  static async createTransaction(
    userId: string,
    transactionData: CreateTransactionInput
  ) {
    // Find or create merchant for this transaction
    const merchant = await MerchantService.findOrCreateMerchant(
      userId,
      transactionData.description,
      transactionData.category
    )

    // Create transaction with merchant reference
    return db.transaction.create({
      data: {
        date: transactionData.date,
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
        statementId: transactionData.statementId,
        merchantId: merchant.id
      }
    })
  }

  /**
   * Create multiple transactions with automatic merchant linking
   * More efficient than creating transactions one by one
   */
  static async createTransactions(
    userId: string,
    transactionsData: CreateTransactionInput[]
  ) {
    const createdTransactions = []

    for (const transactionData of transactionsData) {
      try {
        const transaction = await this.createTransaction(userId, transactionData)
        createdTransactions.push(transaction)
      } catch (error) {
        console.error(`Error creating transaction: ${transactionData.description}`, error)
        // Continue processing other transactions
      }
    }

    return createdTransactions
  }

  /**
   * Get transactions with card details for UI display
   */
  static async getTransactionsWithCardDetails(
    userId: string,
    filters?: {
      cardId?: string
      merchantId?: string
      category?: string
      type?: 'DEBIT' | 'CREDIT'
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    }
  ) {
    const where = FilterBuilder.transactionsByUser(userId, filters)
    const pagination = FilterBuilder.pagination(filters?.limit, filters?.offset)

    return db.transaction.findMany({
      where,
      include: FilterBuilder.transactionIncludes.withCard,
      orderBy: { date: 'desc' },
      ...pagination
    })
  }

  /**
   * Get transactions for a user with optional filtering
   */
  static async getUserTransactions(
    userId: string,
    filters?: {
      cardId?: string
      merchantId?: string
      category?: string
      type?: 'DEBIT' | 'CREDIT'
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    }
  ) {
    const where = FilterBuilder.transactionsByUser(userId, filters)
    const pagination = FilterBuilder.pagination(filters?.limit, filters?.offset)

    const transactions = await db.transaction.findMany({
      where,
      include: FilterBuilder.transactionIncludes.withMerchantAndCard,
      orderBy: { date: 'desc' },
      ...pagination
    })

    return transactions
  }

  /**
   * Get transaction by ID with user verification
   */
  static async getTransactionById(
    userId: string,
    transactionId: string
  ) {
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        statement: {
          card: {
            userId
          }
        }
      },
      include: {
        merchant: true,
        statement: {
          include: {
            card: true
          }
        }
      }
    })

    return transaction
  }

  /**
   * Update transaction category and/or merchant
   */
  static async updateTransaction(
    userId: string,
    transactionId: string,
    updates: {
      category?: string
      merchantId?: string
    }
  ) {
    try {
      // Verify user owns this transaction
      const existingTransaction = await db.transaction.findFirst({
        where: {
          id: transactionId,
          statement: {
            card: {
              userId
            }
          }
        }
      })

      if (!existingTransaction) return null

      // If merchantId is provided, verify user owns that merchant
      if (updates.merchantId) {
        const merchant = await db.merchant.findFirst({
          where: {
            id: updates.merchantId,
            userId
          }
        })

        if (!merchant) {
          throw new Error('Merchant not found or unauthorized')
        }
      }

      return db.transaction.update({
        where: { id: transactionId },
        data: updates
      })
    } catch (error) {
      console.error('Error updating transaction:', error)
      return null
    }
  }

  /**
   * Update multiple transactions' categories by merchant
   */
  static async updateTransactionsByMerchant(
    userId: string,
    merchantId: string,
    category: string
  ): Promise<{ updatedCount: number }> {
    // Verify user owns the merchant
    const merchant = await db.merchant.findFirst({
      where: {
        id: merchantId,
        userId
      }
    })

    if (!merchant) {
      throw new Error('Merchant not found or unauthorized')
    }

    const result = await db.transaction.updateMany({
      where: {
        merchantId,
        statement: {
          card: {
            userId
          }
        }
      },
      data: {
        category
      }
    })

    return { updatedCount: result.count }
  }

  /**
   * Delete transaction with user verification
   */
  static async deleteTransaction(
    userId: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      // Verify user owns this transaction
      const transaction = await db.transaction.findFirst({
        where: {
          id: transactionId,
          statement: {
            card: {
              userId
            }
          }
        }
      })

      if (!transaction) return false

      await db.transaction.delete({
        where: { id: transactionId }
      })

      return true
    } catch (error) {
      console.error('Error deleting transaction:', error)
      return false
    }
  }

  /**
   * Delete all transactions for a statement
   */
  static async deleteTransactionsByStatement(
    userId: string,
    statementId: string
  ): Promise<{ deletedCount: number }> {
    // Verify user owns the statement
    const statement = await db.statement.findFirst({
      where: {
        id: statementId,
        card: {
          userId
        }
      }
    })

    if (!statement) {
      throw new Error('Statement not found or unauthorized')
    }

    const result = await db.transaction.deleteMany({
      where: { statementId }
    })

    return { deletedCount: result.count }
  }

  /**
   * Get transaction statistics for a user
   */
  static async getTransactionStats(
    userId: string,
    filters?: {
      cardId?: string
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{
    totalTransactions: number
    totalDebit: number
    totalCredit: number
    netAmount: number
    avgTransactionAmount: number
    topCategories: Array<{ category: string; count: number; total: number }>
  }> {
    const where = FilterBuilder.transactionsByUser(userId, filters)

    // Get basic stats
    const transactions = await db.transaction.findMany({
      where,
      select: {
        amount: true,
        type: true,
        category: true
      }
    })

    const totalTransactions = transactions.length
    const totalDebit = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalCredit = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0)
    const netAmount = totalCredit - totalDebit
    const avgTransactionAmount = totalTransactions > 0 
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / totalTransactions 
      : 0

    // Calculate top categories
    const categoryStats = new Map<string, { count: number; total: number }>()
    
    for (const transaction of transactions) {
      const category = transaction.category || 'Uncategorized'
      const existing = categoryStats.get(category) || { count: 0, total: 0 }
      categoryStats.set(category, {
        count: existing.count + 1,
        total: existing.total + transaction.amount
      })
    }

    const topCategories = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return {
      totalTransactions,
      totalDebit,
      totalCredit,
      netAmount,
      avgTransactionAmount,
      topCategories
    }
  }

  /**
   * Link transactions to merchants (for migration purposes)
   */
  static async linkTransactionsToMerchants(
    userId: string,
    transactionIds: string[],
    merchantId: string
  ): Promise<{ updatedCount: number }> {
    // Verify user owns the merchant
    const merchant = await db.merchant.findFirst({
      where: {
        id: merchantId,
        userId
      }
    })

    if (!merchant) {
      throw new Error('Merchant not found or unauthorized')
    }

    const result = await db.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        statement: {
          card: {
            userId
          }
        }
      },
      data: {
        merchantId
      }
    })

    return { updatedCount: result.count }
  }
}