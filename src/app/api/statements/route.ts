import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { FilterBuilder } from '@/services/filter-builder'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const searchParams = request.nextUrl.searchParams
    const cardId = searchParams.get('cardId')
    
    // If cardId is provided, verify card ownership
    if (cardId) {
      const card = await prisma.card.findFirst({
        where: { id: cardId, userId: user.id }
      })
      if (!card) {
        return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 403 })
      }
    }
    
    const where = FilterBuilder.statementsByUser(user.id, { cardId: cardId || undefined })
    
    const statements = await prisma.statement.findMany({
      where,
      include: {
        card: true,
        transactions: {
          orderBy: { date: 'desc' }
        },
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { statementDate: 'desc' }
    })
    
    return NextResponse.json(statements)
  } catch (error) {
    console.error('Failed to fetch statements:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 })
  }
}