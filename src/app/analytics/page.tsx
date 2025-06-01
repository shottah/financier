import { Suspense } from 'react'
import { PrismaClient } from '@prisma/client'
import AnalyticsContent from './analytics-content'
import { Statement, Transaction } from '@/types'

const prisma = new PrismaClient()

interface PopulatedCard {
  id: string
  name: string
  type: string
  lastFour: string | null
  color: string
  createdAt: Date
  updatedAt: Date
  statements: Array<Statement & { transactions: Transaction[] }>
}

// Server-side calculation functions
function calculateMetrics(cards: PopulatedCard[]) {
  let totalSpending = 0
  let totalIncome = 0
  let transactionCount = 0
  let totalDays = 0
  
  cards.forEach(card => {
    card.statements?.forEach(statement => {
      totalSpending += statement.totalDebit || 0
      totalIncome += statement.totalCredit || 0
      transactionCount += statement.transactions?.length || 0
      
      if (statement.statementDate) {
        totalDays += 30 // Approximate for now
      }
    })
  })
  
  const netCashFlow = totalIncome - totalSpending
  const avgTransactionsPerDay = totalDays > 0 ? transactionCount / totalDays : 0
  
  // Calculate trends (mock for now, could be based on actual month-over-month data)
  const spendingTrend = -5.2
  const incomeTrend = 8.5
  
  return {
    totalSpending,
    totalIncome,
    netCashFlow,
    transactionCount,
    avgTransactionsPerDay,
    spendingTrend,
    incomeTrend,
  }
}

function getMonthlyData(cards: PopulatedCard[]) {
  const monthlyData: Record<string, { income: number, spending: number, endBalance: number }> = {}
  
  cards.forEach(card => {
    card.statements?.forEach(statement => {
      if (statement.year && statement.month) {
        const monthKey = `${statement.year}-${statement.month.toString().padStart(2, '0')}`
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, spending: 0, endBalance: 0 }
        }
        monthlyData[monthKey].income += statement.totalCredit || 0
        monthlyData[monthKey].spending += statement.totalDebit || 0
        monthlyData[monthKey].endBalance += statement.endBalance || 0
      }
    })
  })
  
  const sortedMonths = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const date = new Date(month + '-01')
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        ...data
      }
    })
  
  return sortedMonths.slice(-6)
}

function getCategoryData(cards: PopulatedCard[]) {
  const categories: Record<string, { amount: number, count: number }> = {}
  
  cards.forEach(card => {
    card.statements?.forEach(statement => {
      statement.transactions?.forEach(transaction => {
        if (transaction.type === 'DEBIT') {
          const category = transaction.category || 'Other'
          if (!categories[category]) {
            categories[category] = { amount: 0, count: 0 }
          }
          categories[category].amount += transaction.amount
          categories[category].count += 1
        }
      })
    })
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

function getRecentTransactions(cards: PopulatedCard[]) {
  const transactions: any[] = []
  
  cards.forEach(card => {
    card.statements?.forEach(statement => {
      statement.transactions?.forEach(transaction => {
        transactions.push({
          ...transaction,
          cardName: card.name,
          cardColor: card.color,
        })
      })
    })
  })
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function getStatementData(cards: PopulatedCard[]) {
  const statementData: Array<{
    id: string
    cardName: string
    month: string
    inflows: number
    outflows: number
    period: string
  }> = []
  
  cards.forEach(card => {
    card.statements?.forEach(statement => {
      if (statement.year && statement.month && statement.status === 'PROCESSED') {
        const date = new Date(statement.year, statement.month - 1)
        statementData.push({
          id: statement.id,
          cardName: card.name,
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          inflows: statement.totalCredit || 0,
          outflows: statement.totalDebit || 0,
          period: statement.fileName
        })
      }
    })
  })
  
  return statementData.sort((a, b) => a.month.localeCompare(b.month))
}

async function getAnalyticsData() {
  const cards = await prisma.card.findMany({
    include: {
      statements: {
        include: {
          transactions: true
        },
        orderBy: { statementDate: 'desc' }
      }
    }
  })

  return cards as PopulatedCard[]
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string, tab?: string }>
}) {
  const cards = await getAnalyticsData()
  const params = await searchParams
  
  // Pre-calculate all data on the server
  const allCardsMetrics = calculateMetrics(cards)
  const allCardsMonthlyData = getMonthlyData(cards)
  const allCardsCategoryData = getCategoryData(cards)
  const allCardsTransactions = getRecentTransactions(cards)
  const allCardsStatementData = getStatementData(cards)
  
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8">
        <div className="text-center">Loading analytics...</div>
      </div>
    }>
      <AnalyticsContent 
        initialCards={cards}
        initialMetrics={allCardsMetrics}
        initialMonthlyData={allCardsMonthlyData}
        initialCategoryData={allCardsCategoryData}
        initialTransactions={allCardsTransactions}
        initialStatementData={allCardsStatementData}
        selectedCard={params.card}
        selectedTab={params.tab}
      />
    </Suspense>
  )
}