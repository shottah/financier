'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Wallet, Receipt, ArrowUpDown, Download } from 'lucide-react'
import { format } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts'

import { AnalyticsTabs } from '@/components/Analytics/AnalyticsTabs'
import { CardSelector } from '@/components/Analytics/CardSelector'
import { TransactionTable } from '@/components/Analytics/TransactionTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card as CardType, Statement, Transaction } from '@/types'

interface PopulatedCard extends CardType {
  statements: Statement[]
}

interface AnalyticsContentProps {
  initialCards: PopulatedCard[]
  initialMetrics: any
  initialMonthlyData: any[]
  initialCategoryData: any[]
  initialTransactions: any[]
  initialStatementData: any[]
  selectedCard?: string
  selectedTab?: string
}

export default function AnalyticsContent({
  initialCards,
  initialMetrics,
  initialMonthlyData,
  initialCategoryData,
  initialTransactions,
  initialStatementData,
  selectedCard,
  selectedTab
}: AnalyticsContentProps) {
  const searchParams = useSearchParams()
  const selectedCardId = searchParams.get('card') || selectedCard || 'all'
  const selectedTabValue = searchParams.get('tab') || selectedTab || 'overview'
  
  // Use initial data from server
  const cards = initialCards
  
  // Filter data based on selected card and use memoization
  const filteredCards = useMemo(() => 
    selectedCardId === 'all' 
      ? cards 
      : cards.filter(card => card.id === selectedCardId)
  , [cards, selectedCardId])
  
  // Use server-calculated data when showing all cards, recalculate only when filtered
  const metrics = useMemo(() => 
    selectedCardId === 'all' ? initialMetrics : calculateMetrics(filteredCards)
  , [selectedCardId, initialMetrics, filteredCards])
  
  const monthlyData = useMemo(() => 
    selectedCardId === 'all' ? initialMonthlyData : getMonthlyData(filteredCards)
  , [selectedCardId, initialMonthlyData, filteredCards])
  
  const categoryData = useMemo(() => 
    selectedCardId === 'all' ? initialCategoryData : getCategoryData(filteredCards)
  , [selectedCardId, initialCategoryData, filteredCards])
  
  const recentTransactions = useMemo(() => 
    selectedCardId === 'all' ? initialTransactions : getRecentTransactions(filteredCards)
  , [selectedCardId, initialTransactions, filteredCards])
  
  const statementData = useMemo(() => 
    selectedCardId === 'all' ? initialStatementData : getStatementData(filteredCards)
  , [selectedCardId, initialStatementData, filteredCards])
  
  // Export function for overview data
  const exportOverviewData = () => {
    // Prepare the data for export
    const overviewData = {
      summary: {
        totalSpending: metrics.totalSpending,
        totalIncome: metrics.totalIncome,
        netCashFlow: metrics.netCashFlow,
        transactionCount: metrics.transactionCount,
        selectedCard: selectedCardId === 'all' ? 'All Cards' : filteredCards[0]?.name || 'Unknown'
      },
      monthlyData: monthlyData,
      categoryBreakdown: categoryData.map(cat => ({
        category: cat.name,
        amount: cat.amount,
        percentage: cat.percentage,
        transactionCount: cat.count
      }))
    }
    
    // Convert to JSON for download
    const jsonContent = JSON.stringify(overviewData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics_overview_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="container mx-auto p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track spending patterns and financial insights</p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          {/* Export Button - Only show on overview tab */}
          {selectedTabValue === 'overview' && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportOverviewData}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Overview
            </Button>
          )}
          
          {/* Card Selector */}
          <div className="w-full md:w-64">
            <CardSelector cards={cards} selectedCardId={selectedCardId} />
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Borrowed"
          value={`$${metrics.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend={metrics.spendingTrend}
          trendLabel="vs last month"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <MetricCard
          title="Total Payments"
          value={`$${metrics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trend={metrics.incomeTrend}
          trendLabel="vs last month"
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <MetricCard
          title="Net Balance Change"
          value={`$${metrics.netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          valueColor={metrics.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <MetricCard
          title="Transactions"
          value={metrics.transactionCount.toString()}
          icon={Receipt}
          subtext={`${metrics.avgTransactionsPerDay.toFixed(1)} per day`}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <AnalyticsTabs selectedTab={selectedTabValue}>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyTrendChart data={monthlyData} />
            <CategoryPieChart data={categoryData} />
          </div>
          
          <TopMerchantsCard transactions={recentTransactions} />
        </TabsContent>
        
        <TabsContent value="spending" className="space-y-6">
          <StatementInflowsOutflowsChart data={statementData} />
          <CategoryBreakdownTable data={categoryData} />
        </TabsContent>
        
        <TabsContent value="transactions">
          <TransactionTable transactions={recentTransactions} />
        </TabsContent>
      </AnalyticsTabs>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel, 
  subtext,
  iconBg,
  iconColor,
  valueColor,
}: { 
  title: string
  value: string
  icon: React.ComponentType<{className?: string}>
  trend?: number
  trendLabel?: string
  subtext?: string
  iconBg: string
  iconColor: string
  valueColor?: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${valueColor || ''}`}>{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(trend)}%
                </span>
                <span className="text-sm text-muted-foreground">{trendLabel}</span>
              </div>
            )}
            {subtext && (
              <p className="text-sm text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MonthlyTrendChart({ data }: { data: Array<{month: string, income: number, spending: number, endBalance: number}> }) {
  // Transform data for Recharts
  const chartData = data.slice(0, 6).map(d => ({
    month: d.month,
    Charges: Math.round(d.spending),
    Payments: Math.round(d.income),
    'Amount Owing': Math.round(d.endBalance)
  }))
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              <span className="font-medium">${entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Activity</CardTitle>
        <CardDescription>Charges vs payments over time with amount owing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
              />
              <Bar dataKey="Charges" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Payments" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Amount Owing" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryPieChart({ data }: { data: Array<{name: string, amount: number, count: number, percentage: number, color: string}> }) {
  const total = data.reduce((sum, cat) => sum + cat.amount, 0)
  
  // Transform data for Recharts
  const chartData = data.map(cat => ({
    name: cat.name,
    value: cat.amount,
    percentage: cat.percentage
  }))
  
  // Custom label renderer for the center
  const renderCenterLabel = () => {
    return (
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-2xl font-bold fill-foreground"
      >
        ${total.toFixed(0)}
      </text>
    )
  }
  
  const renderSubLabel = () => {
    return (
      <text
        x="50%"
        y="54%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-sm fill-muted-foreground"
      >
        Total Charges
      </text>
    )
  }
  
  // Custom tooltip
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
        <CardTitle>Borrowing by Category</CardTitle>
        <CardDescription>Breakdown of your credit card charges</CardDescription>
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
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={data[index].color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                {renderCenterLabel()}
                {renderSubLabel()}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.slice(0, 8).map((category, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: category.color }} 
              />
              <span className="text-xs text-muted-foreground truncate">
                {category.name} (${category.amount.toFixed(0)})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StatementInflowsOutflowsChart({ data }: { data: Array<{
  id: string
  cardName: string
  month: string
  inflows: number
  outflows: number
  period: string
}> }) {
  const [startMonth, setStartMonth] = useState<string>('')
  const [endMonth, setEndMonth] = useState<string>('')
  
  // Extract unique months from data and sort them
  const allMonths = Array.from(new Set(data.map(d => d.month)))
    .sort((a, b) => {
      const dateA = new Date(Date.parse(a + ' 1'))
      const dateB = new Date(Date.parse(b + ' 1'))
      return dateA.getTime() - dateB.getTime()
    })
  
  // Initialize start and end months if not set - default to most recent 6 months
  useEffect(() => {
    if (!startMonth && allMonths.length > 0) {
      // If we have 6 or more months, show the most recent 6
      // Otherwise show all available months
      const startIndex = Math.max(0, allMonths.length - 6)
      setStartMonth(allMonths[startIndex])
    }
    if (!endMonth && allMonths.length > 0) {
      setEndMonth(allMonths[allMonths.length - 1])
    }
  }, [allMonths, startMonth, endMonth])
  
  // Filter data based on selected date range
  const filteredData = data.filter(statement => {
    const statementDate = new Date(Date.parse(statement.month + ' 1'))
    const startDate = startMonth ? new Date(Date.parse(startMonth + ' 1')) : null
    const endDate = endMonth ? new Date(Date.parse(endMonth + ' 1')) : null
    
    return (!startDate || statementDate >= startDate) && 
           (!endDate || statementDate <= endDate)
  })
  
  // Sort filtered data chronologically
  const sortedData = filteredData.sort((a, b) => {
    const dateA = new Date(Date.parse(a.month + ' 1'))
    const dateB = new Date(Date.parse(b.month + ' 1'))
    return dateA.getTime() - dateB.getTime()
  })
  
  // Group data by month (combining all cards)
  const monthlyGrouped = sortedData.reduce((acc, statement) => {
    if (!acc[statement.month]) {
      acc[statement.month] = { inflows: 0, outflows: 0 }
    }
    acc[statement.month].inflows += statement.inflows
    acc[statement.month].outflows += statement.outflows
    return acc
  }, {} as Record<string, { inflows: number, outflows: number }>)
  
  // Transform grouped data for Recharts
  const chartData = Object.entries(monthlyGrouped)
    .sort(([monthA], [monthB]) => {
      const dateA = new Date(Date.parse(monthA + ' 1'))
      const dateB = new Date(Date.parse(monthB + ' 1'))
      return dateA.getTime() - dateB.getTime()
    })
    .map(([month, data]) => ({
      month,
      Inflows: Math.round(data.inflows),
      Outflows: Math.round(data.outflows)
    }))
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find all statements for this month
      const monthStatements = sortedData.filter(s => s.month === label)
      return (
        <div className="bg-background p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium mb-1">{label}</p>
          {monthStatements.length > 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              {monthStatements.map(s => s.cardName).join(', ')}
            </p>
          )}
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              <span className="font-medium">${entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Monthly Inflows & Outflows</CardTitle>
            <CardDescription>Combined credit and debit totals by month</CardDescription>
          </div>
          
          {/* Date Range Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">From:</span>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Start month" />
                </SelectTrigger>
                <SelectContent>
                  {allMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">To:</span>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="End month" />
                </SelectTrigger>
                <SelectContent>
                  {allMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setStartMonth(allMonths[0] || '')
                setEndMonth(allMonths[allMonths.length - 1] || '')
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
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
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="square"
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
                <Bar dataKey="Inflows" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outflows" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            {filteredData.length === 0 && data.length > 0 
              ? "No statements found in the selected date range" 
              : "No processed statements available"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryBreakdownTable({ data }: { data: Array<{name: string, amount: number, count: number, percentage: number, color: string}> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Details</CardTitle>
        <CardDescription>Detailed breakdown by spending category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.count} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${category.amount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{category.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface EnhancedTransaction extends Transaction {
  cardName: string
  cardColor: string
}

function TopMerchantsCard({ transactions }: { transactions: EnhancedTransaction[] }) {
  // Group transactions by merchant (description)
  const merchantGroups = transactions.reduce((acc, tx) => {
    if (tx.type === 'DEBIT') {
      const merchant = tx.description
      if (!acc[merchant]) {
        acc[merchant] = { total: 0, count: 0 }
      }
      acc[merchant].total += tx.amount
      acc[merchant].count += 1
    }
    return acc
  }, {} as Record<string, { total: number, count: number }>)
  
  // Convert to array and sort by total
  const topMerchants = Object.entries(merchantGroups)
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Merchants</CardTitle>
        <CardDescription>Where you spend the most</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topMerchants.length > 0 ? (
            topMerchants.map((merchant, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium line-clamp-1">{merchant.merchant}</p>
                  <p className="text-sm text-muted-foreground">{merchant.count} transactions</p>
                </div>
                <p className="font-medium">${merchant.total.toFixed(2)}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center">No transaction data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


// Helper functions with real data
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
      
      // Calculate days in statement period
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
  // Group transactions by month
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
  
  // Convert to array and sort by date
  const sortedMonths = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const date = new Date(month + '-01')
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        ...data
      }
    })
  
  // Return last 6 months or available data
  return sortedMonths.slice(-6)
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
  
  // Sort by date (oldest first for chronological order)
  return statementData.sort((a, b) => a.month.localeCompare(b.month))
}

function getCategoryData(cards: PopulatedCard[]) {
  // Use categories from database
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
  
  // Convert to array with colors
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


function getRecentTransactions(cards: PopulatedCard[]): EnhancedTransaction[] {
  const transactions: EnhancedTransaction[] = []
  
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