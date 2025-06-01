import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

const prisma = new PrismaClient()

// PATCH - Mark all notifications as read
export async function PATCH(_request: NextRequest) {
  try {
    const user = await requireUser()
    
    // Update all unread notifications for the user
    await prisma.notification.updateMany({
      where: { 
        userId: user.id,
        read: false, 
      },
      data: { read: true },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}