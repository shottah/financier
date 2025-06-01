import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireUser } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    
    // Get counts for user's data only
    const [cards, statements, transactions, notifications] = await Promise.all([
      prisma.card.count({ where: { userId: user.id } }),
      prisma.statement.count({ 
        where: { card: { userId: user.id } }
      }), 
      prisma.transaction.count({
        where: { statement: { card: { userId: user.id } } }
      }),
      prisma.notification.count({ where: { userId: user.id } }),
    ])
    
    // Get size estimates for user's statements
    const userStatements = await prisma.statement.findMany({
      where: { card: { userId: user.id } },
      select: { fileSize: true }
    })
    
    // Calculate actual file sizes if available, otherwise estimate
    const totalSize = userStatements.reduce((total, statement) => {
      return total + (statement.fileSize || 500 * 1024) // Use actual size or 500KB estimate
    }, 0)
    
    return NextResponse.json({
      cards,
      statements,
      transactions,
      notifications,
      totalItems: cards + statements + transactions + notifications,
      totalSize,
      estimatedSize: totalSize,
    })
  } catch (error) {
    console.error('Stats error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}