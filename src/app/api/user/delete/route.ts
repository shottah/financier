import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireUser } from '@/lib/auth'
import { del } from '@vercel/blob'

const prisma = new PrismaClient()

// Helper function to delete blob files for statements
async function deleteBlobFiles(statements: { filePath: string; blobUrl: string | null }[]) {
  const deletePromises = statements.map(async (statement) => {
    try {
      // Try to delete using blobUrl first, fallback to filePath
      const urlToDelete = statement.blobUrl || statement.filePath
      if (urlToDelete) {
        await del(urlToDelete)
        console.log(`Deleted blob file: ${urlToDelete}`)
      }
    } catch (error) {
      console.error(`Failed to delete blob file for statement ${statement.filePath}:`, error)
      // Continue with other deletions even if one fails
    }
  })
  
  await Promise.allSettled(deletePromises)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const { deleteType } = await request.json()
    
    let result
    switch (deleteType) {
      case 'all-cards':
        // Get statements to delete their blob files first
        const cardsStatements = await prisma.statement.findMany({
          where: {
            card: { userId: user.id }
          },
          select: { filePath: true, blobUrl: true }
        })
        
        // Delete blob files
        await deleteBlobFiles(cardsStatements)
        
        // Delete user's cards (statements and transactions will cascade)
        result = await prisma.card.deleteMany({
          where: { userId: user.id }
        })
        break
        
      case 'all-statements':
        // Get statements to delete their blob files first
        const userStatements = await prisma.statement.findMany({
          where: {
            card: { userId: user.id }
          },
          select: { filePath: true, blobUrl: true }
        })
        
        // Delete blob files
        await deleteBlobFiles(userStatements)
        
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
        // Get statements to delete their blob files first
        const allStatements = await prisma.statement.findMany({
          where: {
            card: { userId: user.id }
          },
          select: { filePath: true, blobUrl: true }
        })
        
        // Delete blob files before deleting database records
        await deleteBlobFiles(allStatements)
        
        // Delete all user's data in the correct order
        // Note: We could use TransactionService here, but for bulk deletion
        // direct Prisma calls are more efficient
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
        await prisma.merchant.deleteMany({
          where: { userId: user.id }
        })
        await prisma.notification.deleteMany({
          where: { userId: user.id }
        })
        result = { message: 'All user data and blob files deleted' }
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