'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionTable } from '@/components/TransactionTable'
import { useToast } from '@/hooks/use-toast'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionUpdate = async (id: string, updates: any) => {
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
      
      // Update the local state instead of refetching all transactions
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      )
      
      return updatedTransaction
    } catch (error) {
      console.error('Transaction update error:', error)
      throw error
    }
  }

  const exportTransactions = () => {
    // This will be implemented when we can access the filtered data from the table
    console.log('Export functionality to be implemented')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-8">
          <p>Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Transactions</h1>
        <p className="text-muted-foreground">View and manage all your bank transactions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                {transactions.length} transactions found
              </CardDescription>
            </div>
            <Button onClick={exportTransactions} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            showCard={true}
            showStatement={true}
            enableQuickEdit={true}
            enableEdit={true}
            pageSize={25}
            onTransactionUpdate={handleTransactionUpdate}
          />
        </CardContent>
      </Card>
    </div>
  )
}