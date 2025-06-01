import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeStatements = searchParams.get('includeStatements') === 'true'
    
    const cards = await prisma.card.findMany({
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
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, lastFour, color } = body
    const card = await prisma.card.create({
      data: {
        name,
        type,
        lastFour,
        color: color || '#3B82F6',
      },
    })
    return NextResponse.json(card, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }
}