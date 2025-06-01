import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cardId = searchParams.get('cardId')
    
    const where = cardId ? { cardId } : {}
    
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
    return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 })
  }
}