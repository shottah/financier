import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// PATCH - Mark all notifications as read
export async function PATCH(_request: NextRequest) {
  try {
    // Get userId from cookie
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value || 'default-user'
    
    // Update all unread notifications for the user
    await prisma.notification.updateMany({
      where: { 
        userId,
        read: false, 
      },
      data: { read: true },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}