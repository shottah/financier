'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, DollarSign, Hash, TrendingUp, Download } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CardSelector } from '@/components/Analytics/CardSelector'
import { Badge } from '@/components/ui/badge'
import { Card as CardType, Statement, Transaction } from '@/types'

interface PopulatedCard extends CardType {
  statements: Statement[]
}

interface CategoryData {
  name: string
  amount: number
  count: number
  percentage: number
  color: string
  transactions: Array<{
    id: string
    date: string
    description: string
    amount: number
    cardName: string
    cardColor: string
  }>
}

export default function CategoriesContent() {
  const searchParams = useSearchParams()
  const selectedCardId = searchParams.get('card') || 'all'
  
  const [cards, setCards] = useState<PopulatedCard[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [selectedCardId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cards${selectedCardId !== 'all' ? `?cardId=${selectedCardId}` : ''}`)
      if (response.ok) {
        const data = await response.json()
        setCards(data)
        setCategoryData(calculateCategoryData(data))
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalSpending = useMemo(() => 
    categoryData.reduce((sum, cat) => sum + cat.amount, 0)
  , [categoryData])

  const totalTransactions = useMemo(() => 
    categoryData.reduce((sum, cat) => sum + cat.count, 0)
  , [categoryData])

  const exportCategoryData = () => {
    const exportData = {
      summary: {
        totalCategories: categoryData.length,
        totalSpending: totalSpending,
        totalTransactions: totalTransactions,
        selectedCard: selectedCardId === 'all' ? 'All Cards' : cards.find(c => c.id === selectedCardId)?.name || 'Unknown',
        generatedAt: new Date().toISOString()
      },
      categories: categoryData.map(cat => ({
        name: cat.name,
        amount: cat.amount,
        count: cat.count,
        percentage: cat.percentage,
        avgTransactionAmount: cat.amount / cat.count,
        transactions: cat.transactions
      }))
    }
    
    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `categories_analysis_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/analytics">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Spending Categories</h1>
            <p className="text-muted-foreground">Detailed breakdown of your spending by category</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCategoryData}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          
          <div className="w-full md:w-64">
            <CardSelector cards={cards} selectedCardId={selectedCardId} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-bold">{categoryData.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Hash className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold">${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
                <p className="text-sm text-muted-foreground">
                  ${totalTransactions > 0 ? (totalSpending / totalTransactions).toFixed(2) : '0.00'} avg per transaction
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CategoryBarChart data={categoryData} />
        <CategoryPieChart data={categoryData} />
      </div>

      {/* Detailed Category List */}
      <CategoryDetailsList data={categoryData} loading={loading} />
    </div>
  )
}

function CategoryBarChart({ data }: { data: CategoryData[] }) {
  const chartData = data.slice(0, 10).map(cat => ({
    name: cat.name.length > 15 ? cat.name.substring(0, 12) + '...' : cat.name,
    fullName: cat.name,
    amount: cat.amount,
    count: cat.count
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-background p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{data.payload.fullName}</p>
          <p className="text-sm">
            Amount: <span className="font-medium">${data.value.toLocaleString()}</span>
          </p>
          <p className="text-sm">
            Transactions: <span className="font-medium">{data.payload.count}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categories by Amount</CardTitle>
        <CardDescription>Your highest spending categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const chartData = data.slice(0, 8).map(cat => ({
    name: cat.name,
    value: cat.amount,
    percentage: cat.percentage,
    color: cat.color
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-background p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm">
            Amount: <span className="font-medium">${data.value.toLocaleString()}</span>
          </p>
          <p className="text-sm">
            Percentage: <span className="font-medium">{data.payload.percentage}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
        <CardDescription>Percentage breakdown of spending</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {chartData.map((category, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: category.color }} 
              />
              <span className="text-xs text-muted-foreground truncate">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryDetailsList({ data, loading }: { data: CategoryData[], loading: boolean }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading category data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Categories</CardTitle>
        <CardDescription>Complete breakdown with transaction details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((category, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.count} transactions • ${(category.amount / category.count).toFixed(2)} avg
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${category.amount.toFixed(2)}</p>
                  <Badge variant="outline" className="text-xs">
                    {category.percentage}%
                  </Badge>
                </div>
              </div>
              
              {expandedCategory === category.name && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Recent Transactions</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {category.transactions.slice(0, 10).map((transaction, txIndex) => (
                      <div key={txIndex} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: transaction.cardColor }} 
                          />
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(transaction.date), 'MMM dd')}
                          </span>
                          <span className="truncate">{transaction.description}</span>
                        </div>
                        <span className="font-medium ml-2">${transaction.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {category.transactions.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        And {category.transactions.length - 10} more transactions...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function calculateCategoryData(cards: PopulatedCard[]): CategoryData[] {
  const categories: Record<string, {
    amount: number
    count: number
    transactions: Array<{
      id: string
      date: string
      description: string
      amount: number
      cardName: string
      cardColor: string
    }>
  }> = {}

  cards.forEach(card => {
    card.statements?.forEach(statement => {
      statement.transactions?.forEach(transaction => {
        if (transaction.type === 'DEBIT') {
          const category = transaction.category || 'Other'
          if (!categories[category]) {
            categories[category] = { amount: 0, count: 0, transactions: [] }
          }
          categories[category].amount += transaction.amount
          categories[category].count += 1
          categories[category].transactions.push({
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            cardName: card.name,
            cardColor: card.color
          })
        }
      })
    })
  })

  // Sort transactions by date (newest first) for each category
  Object.values(categories).forEach(cat => {
    cat.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  const categoryColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#F7464A'
  ]

  const total = Object.values(categories).reduce((sum, cat) => sum + cat.amount, 0)

  return Object.entries(categories)
    .map(([name, data], index) => ({
      name,
      ...data,
      percentage: Math.round((data.amount / total) * 100),
      color: categoryColors[index % categoryColors.length]
    }))
    .sort((a, b) => b.amount - a.amount)
}