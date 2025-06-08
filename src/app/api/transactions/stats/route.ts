import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { TransactionService } from '@/services/transaction-service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const searchParams = request.nextUrl.searchParams
    const cardId = searchParams.get('cardId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build filters object
    const filters: any = {}
    
    if (cardId) {
      filters.cardId = cardId
    }
    
    if (startDate) {
      filters.startDate = new Date(startDate)
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate)
    }
    
    const stats = await TransactionService.getTransactionStats(user.id, filters)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching transaction stats:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch transaction stats' },
      { status: 500 }
    )
  }
}