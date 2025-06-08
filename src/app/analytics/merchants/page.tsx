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
      merchant: true, // Include merchant relationship
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

  // Group by merchant (using merchant relationship or fallback to description)
  const merchantMap = new Map<string, {
    id: string
    merchant: string
    billingName: string
    totalSpent: number
    transactionCount: number
    categories: Set<string>
    primaryCategory: string | null
    transactions: typeof transactions
  }>()

  transactions.forEach(transaction => {
    // Use merchant data if available, otherwise fall back to description
    const merchant = (transaction as any).merchant // TypeScript doesn't recognize the include yet
    const merchantKey = merchant?.id || `desc_${transaction.description.trim()}`
    const merchantName = merchant?.name || transaction.description.trim()
    const billingName = merchant?.billingName || transaction.description.trim()
    const merchantCategory = merchant?.category
    
    if (!merchantMap.has(merchantKey)) {
      merchantMap.set(merchantKey, {
        id: merchantKey,
        merchant: merchantName,
        billingName: billingName,
        totalSpent: 0,
        transactionCount: 0,
        categories: new Set(),
        primaryCategory: merchantCategory || null,
        transactions: []
      })
    }

    const merchantData = merchantMap.get(merchantKey)!
    merchantData.totalSpent += transaction.amount
    merchantData.transactionCount += 1
    
    // Collect categories from transactions (for merchants without set categories)
    if (transaction.category) {
      merchantData.categories.add(transaction.category)
    }
    
    merchantData.transactions.push(transaction)
  })

  // Convert to array and format for frontend
  const merchants = Array.from(merchantMap.values()).map(data => ({
    id: data.id,
    merchant: data.merchant,
    billingName: data.billingName,
    totalSpent: data.totalSpent,
    transactionCount: data.transactionCount,
    categories: Array.from(data.categories),
    primaryCategory: data.primaryCategory || (data.categories.size > 0 ? Array.from(data.categories)[0] : null),
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