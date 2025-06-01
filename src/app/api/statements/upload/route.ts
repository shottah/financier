import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'
import { notifyStatementUploaded } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const contentType = request.headers.get('content-type')
    
    let cardId: string
    let fileName: string
    let blobUrl: string
    let fileSize: number | undefined
    let mimeType: string | undefined
    
    if (contentType?.includes('application/json')) {
      // Handle JSON request (for creating statement records without file upload)
      const body = await request.json()
      cardId = body.cardId
      fileName = body.fileName
      blobUrl = body.blobUrl || body.filePath // Support both for backwards compatibility
      fileSize = body.fileSize
      mimeType = body.mimeType
      
      if (!cardId || !fileName || !blobUrl) {
        return NextResponse.json({ 
          error: 'cardId, fileName, and blobUrl are required' 
        }, { status: 400 })
      }
    } else {
      // Handle multipart form data
      const formData = await request.formData()
      cardId = formData.get('cardId') as string
      const file = formData.get('file') as File
      
      if (!cardId || !file) {
        return NextResponse.json({ 
          error: 'Card ID and file are required' 
        }, { status: 400 })
      }
      
      // Prepare file for Vercel Blob upload
      fileName = file.name
      fileSize = file.size
      mimeType = file.type || 'application/pdf'
      
      const timestamp = Date.now()
      const ext = fileName.split('.').pop() || 'pdf'
      const blobFileName = `statements/${user.id}/${cardId}/${timestamp}.${ext}`
      
      // Upload to Vercel Blob
      const blob = await put(blobFileName, file, {
        access: 'public',
        addRandomSuffix: false,
        contentType: mimeType,
      })
      
      blobUrl = blob.url
    }

    // Verify the card belongs to the user
    const card = await db.card.findFirst({
      where: {
        id: cardId,
        userId: user.id
      }
    })

    if (!card) {
      return NextResponse.json({ 
        error: 'Card not found or unauthorized' 
      }, { status: 404 })
    }

    // Create statement record
    const statement = await db.statement.create({
      data: {
        cardId,
        fileName,
        filePath: blobUrl, // Store the blob URL in filePath field
        blobUrl: blobUrl,  // Also store in dedicated blob field
        fileSize,
        mimeType,
        status: 'UPLOADED',
      },
      include: {
        card: true,
      },
    })
    
    // Send notification about upload
    await notifyStatementUploaded({
      statementId: statement.id,
      cardName: statement.card.name,
      cardLastFour: statement.card.lastFour || undefined,
      userId: user.id,
    })

    return NextResponse.json(statement, { status: 201 })
  } catch (error) {
    console.error('Upload failed:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}