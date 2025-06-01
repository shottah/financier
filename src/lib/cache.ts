import { unstable_cache } from 'next/cache'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Cache card data for 5 minutes
export const getCachedCards = unstable_cache(
  async () => {
    return await prisma.card.findMany({
      include: {
        _count: {
          select: { statements: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },
  ['cards'],
  {
    revalidate: 300, // 5 minutes
    tags: ['cards']
  }
)

// Cache analytics data for 1 minute
export const getCachedAnalytics = unstable_cache(
  async () => {
    return await prisma.card.findMany({
      include: {
        statements: {
          include: {
            transactions: true
          },
          orderBy: { statementDate: 'desc' }
        }
      }
    })
  },
  ['analytics'],
  {
    revalidate: 60, // 1 minute
    tags: ['analytics', 'cards', 'transactions']
  }
)

// Cache individual card data
export const getCachedCard = unstable_cache(
  async (id: string) => {
    return await prisma.card.findUnique({
      where: { id },
      include: {
        statements: {
          include: {
            transactions: true
          },
          orderBy: { statementDate: 'desc' }
        }
      }
    })
  },
  ['card'],
  {
    revalidate: 60,
    tags: ['cards']
  }
)