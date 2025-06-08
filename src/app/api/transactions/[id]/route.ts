import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await context.params
    const updates = await request.json()

    // First, verify the transaction exists and belongs to the user
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        statement: {
          include: {
            card: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.statement.card.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate and sanitize the updates
    const allowedFields = ['description', 'category', 'amount', 'type']
    const validUpdates: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'amount') {
          // Ensure amount is a valid number
          const numAmount = Number(value)
          if (isNaN(numAmount) || numAmount < 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
          }
          validUpdates[key] = numAmount
        } else if (key === 'type') {
          // Validate transaction type
          if (value !== 'DEBIT' && value !== 'CREDIT') {
            return NextResponse.json({ error: 'Invalid transaction type. Must be DEBIT or CREDIT' }, { status: 400 })
          }
          validUpdates[key] = value
        } else if (key === 'description' || key === 'category') {
          // Ensure strings are not empty after trimming
          const trimmedValue = String(value || '').trim()
          if (key === 'description' && !trimmedValue) {
            return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 })
          }
          validUpdates[key] = trimmedValue || null
        }
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the transaction
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: validUpdates,
      include: {
        statement: {
          include: {
            card: true
          }
        }
      }
    })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('Failed to update transaction:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await context.params

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        statement: {
          include: {
            card: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.statement.card.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to get transaction:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to get transaction' }, { status: 500 })
  }
}