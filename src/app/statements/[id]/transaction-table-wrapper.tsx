'use client'

import { useState } from 'react'
import { TransactionTable } from '@/components/TransactionTable'
import { useToast } from '@/hooks/use-toast'

interface Transaction {
  id: string
  date: string | Date
  description: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  category?: string | null
  statementId?: string
  statement?: {
    card: {
      name: string
      color: string
    }
    fileName: string
  }
}

interface TransactionTableWrapperProps {
  transactions: Transaction[]
  enableQuickEdit?: boolean
  enableEdit?: boolean
  pageSize?: number
}

export default function TransactionTableWrapper({
  transactions: initialTransactions,
  enableQuickEdit = true,
  enableEdit = false,
  pageSize = 10
}: TransactionTableWrapperProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const { toast } = useToast()

  const handleTransactionUpdate = async (id: string, updates: Partial<Transaction>) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update transaction')
      }

      const updatedTransaction = await response.json()

      // Update the local state
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      )

      return updatedTransaction
    } catch (error) {
      console.error('Transaction update error:', error)
      throw error
    }
  }

  return (
    <TransactionTable
      transactions={transactions}
      enableQuickEdit={enableQuickEdit}
      enableEdit={enableEdit}
      pageSize={pageSize}
      onTransactionUpdate={handleTransactionUpdate}
    />
  )
}