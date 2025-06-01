import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    // Get all statements
    const statements = await prisma.statement.findMany({
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
        // Call the process endpoint for each statement
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/statements/${statement.id}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            useAI: true,
            aiProvider: 'openai',
            reprocess: true, // Force reprocess
          }),
        })

        if (response.ok) {
          processed++
        } else {
          const errorData = await response.json()
          errors.push({
            statementId: statement.id,
            error: errorData.error || 'Failed to process',
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
    return NextResponse.json(
      { success: false, error: 'Failed to reprocess statements' },
      { status: 500 }
    )
  }
}