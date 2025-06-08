import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireUser } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    
    // Get user's statements only
    const statements = await prisma.statement.findMany({
      where: {
        card: { userId: user.id }
      },
      select: {
        id: true,
        filePath: true,
        fileName: true,
      },
    })

    let processed = 0
    const errors = []

    // Process each statement by calling the process endpoint
    for (const statement of statements) {
      try {
        // Get the base URL for internal API calls
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        
        // Prepare headers for internal API call
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        
        // Forward authentication headers
        const authHeader = request.headers.get('Authorization')
        const cookieHeader = request.headers.get('Cookie')
        
        if (authHeader) {
          headers['Authorization'] = authHeader
        }
        if (cookieHeader) {
          headers['Cookie'] = cookieHeader
        }
        
        // Call the process endpoint for each statement
        const response = await fetch(`${baseUrl}/api/statements/${statement.id}/process`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            useAI: true,
            aiProvider: 'openai',
            reprocess: true, // Force reprocess
          }),
        })

        if (response.ok) {
          processed++
        } else {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            // Failed to parse error response as JSON
          }
          
          errors.push({
            statementId: statement.id,
            error: errorMessage,
          })
        }
      } catch (error) {
        errors.push({
          statementId: statement.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: statements.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error reprocessing statements:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to reprocess statements' },
      { status: 500 }
    )
  }
}