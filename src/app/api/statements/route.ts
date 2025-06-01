import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const searchParams = request.nextUrl.searchParams
    const cardId = searchParams.get('cardId')
    
    let where: any = {}
    
    if (cardId) {
      // Verify card ownership if cardId is provided
      const card = await prisma.card.findFirst({
        where: { id: cardId, userId: user.id }
      })
      if (!card) {
        return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 403 })
      }
      where.cardId = cardId
    } else {
      // If no cardId, only show user's statements
      where.card = { userId: user.id }
    }
    
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