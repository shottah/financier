import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireUser } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const searchParams = request.nextUrl.searchParams
    const cardId = searchParams.get('cardId')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build where clause
    const where: any = {}
    
    if (cardId) {
      // Verify card ownership
      const card = await prisma.card.findFirst({
        where: { id: cardId, userId: user.id }
      })
      if (!card) {
        return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 403 })
      }
      where.statement = {
        cardId,
      }
    } else {
      // If no cardId, filter to only user's transactions
      where.statement = {
        card: { userId: user.id }
      }
    }
    
    if (category) {
      where.category = category === 'uncategorized' ? null : category
    }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }
    
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        statement: {
          include: {
            card: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
    
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}