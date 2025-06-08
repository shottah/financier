import { Prisma } from '@prisma/client'

/**
 * Utility class for building reusable Prisma where clauses
 * Helps maintain consistency across services and reduces code duplication
 */
export class FilterBuilder {
  /**
   * Build where clause for transactions filtered by user ownership
   */
  static transactionsByUser(
    userId: string,
    filters?: {
      cardId?: string
      merchantId?: string
      category?: string
      type?: 'DEBIT' | 'CREDIT'
      startDate?: Date
      endDate?: Date
    }
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      statement: {
        card: {
          userId
        }
      }
    }

    // Apply card filter
    if (filters?.cardId) {
      where.statement = {
        card: {
          userId,
          id: filters.cardId
        }
      }
    }

    // Apply merchant filter
    if (filters?.merchantId) {
      where.merchantId = filters.merchantId
    }

    // Apply category filter
    if (filters?.category) {
      where.category = filters.category
    }

    // Apply transaction type filter
    if (filters?.type) {
      where.type = filters.type
    }

    // Apply date range filters
    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = filters.startDate
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate
      }
    }

    return where
  }

  /**
   * Build where clause for statements filtered by user ownership
   */
  static statementsByUser(
    userId: string,
    filters?: {
      cardId?: string
      status?: string
      startDate?: Date
      endDate?: Date
    }
  ): Prisma.StatementWhereInput {
    const where: Prisma.StatementWhereInput = {
      card: {
        userId
      }
    }

    // Apply card filter
    if (filters?.cardId) {
      where.card = {
        userId,
        id: filters.cardId
      }
    }

    // Apply status filter
    if (filters?.status) {
      where.status = filters.status
    }

    // Apply date range filters
    if (filters?.startDate || filters?.endDate) {
      where.statementDate = {}
      if (filters.startDate) {
        where.statementDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.statementDate.lte = filters.endDate
      }
    }

    return where
  }

  /**
   * Build where clause for cards filtered by user ownership
   */
  static cardsByUser(
    userId: string,
    filters?: {
      type?: string
      name?: string
    }
  ): Prisma.CardWhereInput {
    const where: Prisma.CardWhereInput = {
      userId
    }

    // Apply type filter
    if (filters?.type) {
      where.type = filters.type
    }

    // Apply name filter (partial match)
    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive'
      }
    }

    return where
  }

  /**
   * Build where clause for merchants filtered by user ownership
   */
  static merchantsByUser(
    userId: string,
    filters?: {
      category?: string
      name?: string
      billingName?: string
    }
  ): Prisma.MerchantWhereInput {
    const where: Prisma.MerchantWhereInput = {
      userId
    }

    // Apply category filter
    if (filters?.category) {
      where.category = filters.category
    }

    // Apply name filter (partial match)
    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive'
      }
    }

    // Apply billing name filter (partial match)
    if (filters?.billingName) {
      where.billingName = {
        contains: filters.billingName,
        mode: 'insensitive'
      }
    }

    return where
  }

  /**
   * Build where clause for notifications filtered by user ownership
   */
  static notificationsByUser(
    userId: string,
    filters?: {
      read?: boolean
      type?: string
      startDate?: Date
      endDate?: Date
    }
  ): Prisma.NotificationWhereInput {
    const where: Prisma.NotificationWhereInput = {
      userId
    }

    // Apply read status filter
    if (typeof filters?.read === 'boolean') {
      where.read = filters.read
    }

    // Apply type filter
    if (filters?.type) {
      where.type = filters.type
    }

    // Apply date range filters
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    return where
  }

  /**
   * Build pagination options for Prisma queries
   */
  static pagination(
    limit?: number,
    offset?: number
  ): {
    take?: number
    skip?: number
  } {
    const pagination: { take?: number; skip?: number } = {}

    if (limit && limit > 0) {
      pagination.take = Math.min(limit, 1000) // Cap at 1000 for performance
    }

    if (offset && offset > 0) {
      pagination.skip = offset
    }

    return pagination
  }

  /**
   * Build common include clauses for transactions
   */
  static transactionIncludes = {
    // For frontend display with card info
    withCard: {
      statement: {
        include: {
          card: true
        }
      }
    } as const,

    // For detailed view with merchant and card info
    withMerchantAndCard: {
      merchant: true,
      statement: {
        include: {
          card: true
        }
      }
    } as const,

    // Minimal include for performance
    minimal: {
      merchant: true
    } as const
  }

  /**
   * Build common include clauses for statements
   */
  static statementIncludes = {
    // With card info
    withCard: {
      card: true
    } as const,

    // With transactions and card info
    withTransactionsAndCard: {
      card: true,
      transactions: {
        include: {
          merchant: true
        }
      }
    } as const
  }
}