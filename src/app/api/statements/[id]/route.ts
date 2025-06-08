import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'
import { getStatementFileInfo } from '@/lib/statements'
import { del } from '@vercel/blob'

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
            color: true,
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
    const statementWithCard = statement as typeof statement & { card: { userId: string } }
    if (statementWithCard.card.userId !== user.id) {
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

    // Delete the blob file first
    try {
      const urlToDelete = statement.blobUrl || statement.filePath
      if (urlToDelete) {
        await del(urlToDelete)
        console.log(`Deleted blob file: ${urlToDelete}`)
      }
    } catch (error) {
      console.error(`Failed to delete blob file for statement ${id}:`, error)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete the statement (transactions will cascade delete)
    await db.statement.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Statement deleted successfully' })
  } catch (error) {
    console.error('Failed to delete statement:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete statement' }, { status: 500 })
  }
}