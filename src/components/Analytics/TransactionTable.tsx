'use client'

import { TransactionTable as GenericTransactionTable } from '@/components/TransactionTable'

interface EnhancedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  category?: string
  cardName: string
  cardColor: string
}

interface TransactionTableProps {
  transactions: EnhancedTransaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  // Transform enhanced transactions to match the generic table format
  const transformedTransactions = transactions.map(tx => ({
    ...tx,
    statement: {
      card: {
        name: tx.cardName,
        color: tx.cardColor
      },
      fileName: 'Analytics View'
    }
  }))

  return (
    <GenericTransactionTable
      transactions={transformedTransactions}
      showCard={true}
      enableQuickEdit={false}
      enableEdit={false}
      pageSize={10}
    />
  )
}