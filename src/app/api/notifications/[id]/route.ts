import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

const prisma = new PrismaClient()

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PATCH - Update notification (mark as read/unread)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await request.json()
    const { read } = body
    
    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    })
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }
    
    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read },
    })
    
    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error('Failed to update notification:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireUser()
    const { id } = await params
    
    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    })
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }
    
    // Delete the notification
    await prisma.notification.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}