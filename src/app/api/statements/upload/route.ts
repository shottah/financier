import { writeFile } from 'fs/promises'
import path from 'path'

import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { notifyStatementUploaded } from '@/lib/notifications'

const prisma = new PrismaClient()
const uploadDir = path.join(process.cwd(), 'public', 'uploads')

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    
    let cardId: string
    let fileName: string
    let filePath: string
    let fileData: Buffer | null = null
    
    if (contentType?.includes('application/json')) {
      // Handle JSON request (for creating statement records without file upload)
      const body = await request.json()
      cardId = body.cardId
      fileName = body.fileName
      filePath = body.filePath
      
      if (!cardId || !fileName || !filePath) {
        return NextResponse.json({ 
          error: 'cardId, fileName, and filePath are required' 
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
      
      // Create a unique filename
      const timestamp = Date.now()
      const ext = path.extname(file.name)
      fileName = file.name
      const filename = `${cardId}_${timestamp}${ext}`
      filePath = `/uploads/${filename}`
      
      // Get file data for saving
      const bytes = await file.arrayBuffer()
      fileData = Buffer.from(bytes)
      
      // Save file
      const fullPath = path.join(uploadDir, filename)
      await writeFile(fullPath, fileData)
    }

    // Create statement record
    const statement = await prisma.statement.create({
      data: {
        cardId,
        fileName,
        filePath,
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
    })

    return NextResponse.json(statement, { status: 201 })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}