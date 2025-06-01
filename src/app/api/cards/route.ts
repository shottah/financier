import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const searchParams = request.nextUrl.searchParams
    const includeStatements = searchParams.get('includeStatements') === 'true'
    
    const cards = await db.card.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { statements: true },
        },
        ...(includeStatements && {
          statements: {
            include: {
              transactions: true,
              _count: {
                select: { transactions: true }
              }
            },
            orderBy: { statementDate: 'desc' }
          }
        })
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(cards)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const { name, type, lastFour, color } = body
    const card = await db.card.create({
      data: {
        userId: user.id,
        name,
        type,
        lastFour,
        color: color || '#3B82F6',
      },
    })
    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }
}