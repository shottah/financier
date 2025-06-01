import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await context.params

    // Get the statement and verify ownership
    const statement = await db.statement.findUnique({
      where: { id },
      include: {
        card: {
          select: {
            userId: true,
            name: true,
          }
        }
      }
    })

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 })
    }

    if (statement.card.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the blob URL (prefer blobUrl field, fallback to filePath)
    const fileUrl = statement.blobUrl || statement.filePath

    // If it's a blob URL, we can redirect to it
    if (fileUrl.startsWith('http')) {
      // For blob URLs, we can either:
      // 1. Redirect to the blob URL (simple, uses Vercel's CDN)
      return NextResponse.redirect(fileUrl)
      
      // 2. Or proxy the file (more control, can add headers)
      // const response = await fetch(fileUrl)
      // const blob = await response.blob()
      // 
      // return new NextResponse(blob, {
      //   headers: {
      //     'Content-Type': statement.mimeType || 'application/pdf',
      //     'Content-Disposition': `attachment; filename="${statement.fileName}"`,
      //     'Content-Length': statement.fileSize?.toString() || '',
      //   }
      // })
    }

    // For local files (backwards compatibility)
    if (fileUrl.startsWith('/uploads/')) {
      // In production, these should not exist
      // This is only for backwards compatibility
      return NextResponse.json({ 
        error: 'Local file storage is deprecated. Please re-upload the file.' 
      }, { status: 410 })
    }

    return NextResponse.json({ error: 'Invalid file URL' }, { status: 500 })

  } catch (error) {
    console.error('Download failed:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to download statement' }, { status: 500 })
  }
}