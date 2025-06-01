import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireUser } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const { deleteType } = await request.json()
    
    let result
    switch (deleteType) {
      case 'all-cards':
        // Delete user's cards (statements and transactions will cascade)
        result = await prisma.card.deleteMany({
          where: { userId: user.id }
        })
        break
        
      case 'all-statements':
        // Delete user's statements (transactions will cascade)
        result = await prisma.statement.deleteMany({
          where: {
            card: { userId: user.id }
          }
        })
        break
        
      case 'all-notifications':
        // Delete user's notifications
        result = await prisma.notification.deleteMany({
          where: { userId: user.id }
        })
        break
        
      case 'all-data':
        // Delete all user's data in the correct order
        await prisma.transaction.deleteMany({
          where: {
            statement: {
              card: { userId: user.id }
            }
          }
        })
        await prisma.statement.deleteMany({
          where: {
            card: { userId: user.id }
          }
        })
        await prisma.card.deleteMany({
          where: { userId: user.id }
        })
        await prisma.notification.deleteMany({
          where: { userId: user.id }
        })
        result = { message: 'All user data deleted' }
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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    )
  }
}