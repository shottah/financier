import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get counts for different data types
    const [cards, statements, transactions, notifications] = await Promise.all([
      prisma.card.count(),
      prisma.statement.count(), 
      prisma.transaction.count(),
      prisma.notification.count(),
    ])
    
    // Get size estimates (in a real app, you might calculate actual file sizes)
    const statementSizes = await prisma.statement.findMany({
      select: { filePath: true }
    })
    
    return NextResponse.json({
      cards,
      statements,
      transactions,
      notifications,
      totalItems: cards + statements + transactions + notifications,
      // You could calculate actual size from files if needed
      estimatedSize: statementSizes.length * 1024 * 500, // Rough estimate: 500KB per statement
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}