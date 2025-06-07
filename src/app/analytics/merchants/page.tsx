import { Suspense } from 'react'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'
import MerchantsContent from './merchants-content'

async function getMerchantsData() {
  const user = await requireUser()
  
  // Get all transactions with merchant data
  const transactions = await db.transaction.findMany({
    where: {
      type: 'DEBIT', // Only debit transactions for merchants
      statement: {
        card: {
          userId: user.id
        }
      }
    },
    include: {
      statement: {
        include: {
          card: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Group by merchant (description) and calculate totals
  const merchantMap = new Map<string, {
    merchant: string
    totalSpent: number
    transactionCount: number
    categories: Set<string>
    transactions: typeof transactions
  }>()

  transactions.forEach(transaction => {
    const merchant = transaction.description.trim()
    
    if (!merchantMap.has(merchant)) {
      merchantMap.set(merchant, {
        merchant,
        totalSpent: 0,
        transactionCount: 0,
        categories: new Set(),
        transactions: []
      })
    }

    const merchantData = merchantMap.get(merchant)!
    merchantData.totalSpent += transaction.amount
    merchantData.transactionCount += 1
    if (transaction.category) {
      merchantData.categories.add(transaction.category)
    }
    merchantData.transactions.push(transaction)
  })

  // Convert to array and format for frontend
  const merchants = Array.from(merchantMap.values()).map(data => ({
    id: data.merchant, // Use merchant name as ID for uniqueness
    merchant: data.merchant,
    totalSpent: data.totalSpent,
    transactionCount: data.transactionCount,
    categories: Array.from(data.categories),
    primaryCategory: data.categories.size > 0 ? Array.from(data.categories)[0] : null,
    transactions: data.transactions.map(tx => ({
      id: tx.id,
      date: tx.date.toISOString(),
      amount: tx.amount,
      category: tx.category,
      cardName: (tx as any).statement.card.name
    }))
  }))

  return merchants.sort((a, b) => b.totalSpent - a.totalSpent)
}

export default async function MerchantsPage() {
  const merchants = await getMerchantsData()

  return (
    <Suspense fallback={
      <div className="container mx-auto p-8">
        <div className="text-center">Loading merchants...</div>
      </div>
    }>
      <MerchantsContent initialMerchants={merchants} />
    </Suspense>
  )
}