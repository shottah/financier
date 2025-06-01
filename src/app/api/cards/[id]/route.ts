import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        statements: {
          orderBy: { statementDate: 'desc' },
        },
      },
    })
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    return NextResponse.json(card)
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { name, type, lastFour, color } = body
    const card = await prisma.card.update({
      where: { id },
      data: {
        name,
        type,
        lastFour,
        color,
      },
    })
    return NextResponse.json(card)
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await prisma.card.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Card deleted successfully' })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 })
  }
}