import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const { merchantName, category } = await request.json()

    if (!merchantName || !category) {
      return NextResponse.json(
        { error: 'Merchant name and category are required' },
        { status: 400 }
      )
    }

    // Update all transactions for this merchant across all user's cards
    const result = await db.transaction.updateMany({
      where: {
        description: merchantName,
        statement: {
          card: {
            userId: user.id
          }
        }
      },
      data: {
        category: category
      }
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Updated ${result.count} transactions for merchant: ${merchantName}`
    })

  } catch (error) {
    console.error('Error updating merchant category:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update merchant category' },
      { status: 500 }
    )
  }
}