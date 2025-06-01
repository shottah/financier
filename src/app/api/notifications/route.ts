import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET all notifications for a user
export async function GET(_request: NextRequest) {
  try {
    // In a real app, get userId from auth session
    // For now, we'll use a cookie or default value
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value || 'default-user'
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, description, userId, metadata } = body
    
    // If no userId provided, use from cookie or default
    const cookieStore = await cookies()
    const finalUserId = userId || cookieStore.get('userId')?.value || 'default-user'
    
    const notification = await prisma.notification.create({
      data: {
        userId: finalUserId,
        type,
        title,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
    
    return NextResponse.json(notification)
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}