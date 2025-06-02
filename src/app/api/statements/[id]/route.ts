import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'
import { getStatementFileInfo } from '@/lib/statements'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await context.params

    // Get the statement with full details
    const statement = await db.statement.findUnique({
      where: { id },
      include: {
        card: {
          select: {
            id: true,
            name: true,
            userId: true,
            type: true,
            lastFour: true,
          }
        },
        transactions: {
          orderBy: { date: 'desc' }
        },
        _count: {
          select: { transactions: true }
        }
      }
    })

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    // Verify user owns this statement
    if (statement.card?.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Add file info
    const fileInfo = getStatementFileInfo(statement)

    return NextResponse.json({
      ...statement,
      fileInfo
    })
  } catch (error) {
    console.error('Failed to get statement:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to get statement' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await context.params

    // Get the statement to verify ownership
    const statement = await db.statement.findUnique({
      where: { id },
      include: {
        card: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    if (statement.card.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the statement (transactions will cascade delete)
    await db.statement.delete({
      where: { id }
    })

    // Note: We're not deleting the blob file here
    // Vercel Blob files can be cleaned up separately if needed
    // or kept for audit purposes

    return NextResponse.json({ message: 'Statement deleted successfully' })
  } catch (error) {
    console.error('Failed to delete statement:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete statement' }, { status: 500 })
  }
}