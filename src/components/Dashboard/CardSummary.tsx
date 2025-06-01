import { CreditCard, FileText, TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Card as CardType, Statement } from '@/types'

interface CardSummaryProps {
  card: CardType
}

export function CardSummary({ card }: CardSummaryProps) {
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCard()
  }, [card.id])

  const fetchCard = async () => {
    try {
      const response = await fetch(`/api/cards/${card.id}`)
      const data = await response.json()
      setStatements(data.statements || [])
    } catch (error) {
      console.error('Failed to fetch card details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const processedStatements = statements.filter(s => s.status === 'PROCESSED')
  const totalCredit = processedStatements.reduce((sum, s) => sum + (s.totalCredit || 0), 0)
  const totalDebit = processedStatements.reduce((sum, s) => sum + (s.totalDebit || 0), 0)
  const avgMonthlySpending = processedStatements.length > 0 ? totalDebit / processedStatements.length : 0

  const stats = [
    {
      label: 'Card Type',
      value: card.type,
      icon: CreditCard,
      color: 'text-primary',
    },
    {
      label: 'Total Statements',
      value: statements.length,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      label: 'Total Credits',
      value: `$${totalCredit.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Total Debits',
      value: `$${totalDebit.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-red-600',
    },
    {
      label: 'Avg Monthly Spending',
      value: `$${avgMonthlySpending.toFixed(2)}`,
      icon: Calculator,
      color: 'text-purple-600',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Summary</CardTitle>
        <CardDescription>
          Overview of {card.name} activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
                <p className={`text-lg font-semibold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
