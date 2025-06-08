import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { TransactionService } from '@/services/transaction-service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const searchParams = request.nextUrl.searchParams
    const cardId = searchParams.get('cardId')
    const merchantId = searchParams.get('merchantId')
    const category = searchParams.get('category')
    const type = searchParams.get('type') as 'DEBIT' | 'CREDIT' | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    
    // Build filters object
    const filters: any = {}
    
    if (cardId) {
      filters.cardId = cardId
    }
    
    if (merchantId) {
      filters.merchantId = merchantId
    }
    
    if (category) {
      filters.category = category === 'uncategorized' ? null : category
    }
    
    if (type) {
      filters.type = type
    }
    
    if (startDate) {
      filters.startDate = new Date(startDate)
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate)
    }
    
    if (limit) {
      filters.limit = parseInt(limit)
    }
    
    if (offset) {
      filters.offset = parseInt(offset)
    }
    
    const transactions = await TransactionService.getTransactionsWithCardDetails(user.id, filters)
    
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser()
    const { transactionId, category, merchantId } = await request.json()
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }
    
    const updatedTransaction = await TransactionService.updateTransaction(
      user.id,
      transactionId,
      { category, merchantId }
    )
    
    if (!updatedTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found or unauthorized' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }
    
    const success = await TransactionService.deleteTransaction(user.id, transactionId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Transaction not found or failed to delete' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}