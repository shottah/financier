import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { deleteType } = await request.json()
    
    let result
    switch (deleteType) {
      case 'all-cards':
        // Delete all cards (statements and transactions will cascade)
        result = await prisma.card.deleteMany({})
        break
        
      case 'all-statements':
        // Delete all statements (transactions will cascade)
        result = await prisma.statement.deleteMany({})
        break
        
      case 'all-notifications':
        // Delete all notifications
        result = await prisma.notification.deleteMany({})
        break
        
      case 'all-data':
        // Delete everything in the correct order
        await prisma.transaction.deleteMany({})
        await prisma.statement.deleteMany({})
        await prisma.card.deleteMany({})
        await prisma.notification.deleteMany({})
        result = { message: 'All data deleted' }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid delete type' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      deleteType,
      result
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    )
  }
}