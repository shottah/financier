import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await context.params
    const card = await db.card.findUnique({
      where: { id, userId: user.id },
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
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await context.params
    const body = await request.json()
    const { name, type, lastFour, color } = body
    const card = await db.card.update({
      where: { id, userId: user.id },
      data: {
        name,
        type,
        lastFour,
        color,
      },
    })
    return NextResponse.json(card)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await context.params
    await db.card.delete({
      where: { id, userId: user.id },
    })
    return NextResponse.json({ message: 'Card deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 })
  }
}