import { ShoppingCart, Car, Home, DollarSign, Utensils, Package } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Statement, Transaction } from '@/types'

interface CategoryBreakdownProps {
  cardId: string
}

export function CategoryBreakdown({ cardId }: CategoryBreakdownProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatements()
  }, [cardId])

  const fetchStatements = async () => {
    try {
      const response = await fetch(`/api/cards/${cardId}`)
      const data = await response.json()
      const statements: Statement[] = data.statements || []
      
      // For this demo, we'll create some sample transactions since we don't have actual transaction fetching
      const sampleTransactions: Transaction[] = []
      statements.forEach(statement => {
        if (statement.status === 'PROCESSED' && statement.totalDebit) {
          // Create sample transactions for demonstration
          sampleTransactions.push(
            {
              id: `${statement.id}-1`,
              statementId: statement.id,
              date: new Date().toISOString(),
              description: 'Groceries',
              amount: statement.totalDebit * 0.3,
              type: 'DEBIT',
              category: 'Food & Dining',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: `${statement.id}-2`,
              statementId: statement.id,
              date: new Date().toISOString(),
              description: 'Gas Station',
              amount: statement.totalDebit * 0.2,
              type: 'DEBIT',
              category: 'Transportation',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: `${statement.id}-3`,
              statementId: statement.id,
              date: new Date().toISOString(),
              description: 'Online Shopping',
              amount: statement.totalDebit * 0.25,
              type: 'DEBIT',
              category: 'Shopping',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: `${statement.id}-4`,
              statementId: statement.id,
              date: new Date().toISOString(),
              description: 'Utilities',
              amount: statement.totalDebit * 0.15,
              type: 'DEBIT',
              category: 'Bills & Utilities',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: `${statement.id}-5`,
              statementId: statement.id,
              date: new Date().toISOString(),
              description: 'Entertainment',
              amount: statement.totalDebit * 0.1,
              type: 'DEBIT',
              category: 'Entertainment',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          )
        }
      })
      
      setTransactions(sampleTransactions)
    } catch (error) {
      console.error('Failed to fetch statements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group transactions by category
  const categoryData = transactions.reduce((acc, transaction) => {
    if (transaction.category && transaction.type === 'DEBIT') {
      if (!acc[transaction.category]) {
        acc[transaction.category] = { total: 0, count: 0 }
      }
      acc[transaction.category].total += transaction.amount
      acc[transaction.category].count += 1
    }
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b.total - a.total)
  
  const totalSpending = sortedCategories.reduce((sum, [, data]) => sum + data.total, 0)
  
  const categoryIcons: Record<string, React.ComponentType<{className?: string}>> = {
    'Food & Dining': Utensils,
    'Transportation': Car,
    'Shopping': ShoppingCart,
    'Housing': Home,
    'Entertainment': Package,
    'Other': DollarSign,
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          Spending distribution by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedCategories.length > 0 ? (
          <div className="space-y-6">
            {sortedCategories.map(([category, data]) => {
              const percentage = (data.total / totalSpending) * 100
              const Icon = categoryIcons[category] || DollarSign
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${data.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={percentage} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No transaction data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
