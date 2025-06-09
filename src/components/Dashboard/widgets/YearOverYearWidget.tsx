'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { YearlyMultiLineChart } from '@/components/Dashboard/YearlyMultiLineChart'

interface MonthlyData {
  month: string
  monthNumber: number
  amount: number
}

interface CategoryTrend {
  category: string
  currentYear: MonthlyData[]
  lastYear: MonthlyData[]
  totalCurrentYear: number
  totalLastYear: number
  yearChange: number
}

interface YearOverYearWidgetProps {
  userId: string
}

export function YearOverYearWidget({ userId }: YearOverYearWidgetProps) {
  const [trends, setTrends] = useState<CategoryTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [userId])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/analytics')
      const data = await response.json()
      setTrends(data.categoryTrends || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setTrends([])
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < -5) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-green-600'
    if (change < -5) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <Card className="h-full overflow-auto widget-card shadow-none border">
        <CardHeader className="pb-2 px-4 py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-2 w-40" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-2 w-12" />
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-2 w-8" />
                  <Skeleton className="h-2 w-8" />
                </div>
                {i < 3 && <hr className="border-muted my-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-auto widget-card shadow-none border">
      {trends.length === 0 ? (
        <CardContent className="text-center py-6 h-full flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold mb-1">No data available</h3>
          <p className="text-xs text-muted-foreground">Upload statements to see trends</p>
        </CardContent>
      ) : (
        <>
          <CardHeader className="pb-2 px-4 py-3">
            <CardTitle className="text-base">Year over Year</CardTitle>
            <CardDescription className="text-xs">
              Monthly spending trends for top 3 categories
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-3">
              {trends.slice(0, 3).map((trend, index) => (
                <div key={trend.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{trend.category}</h3>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium">YoY Change</h4>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(trend.yearChange)}
                      <span className={`text-xs ${getTrendColor(trend.yearChange)}`}>
                        {trend.yearChange > 0 ? '+' : ''}{trend.yearChange.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <YearlyMultiLineChart
                    currentYear={trend.currentYear}
                    lastYear={trend.lastYear}
                    height={80}
                    colors={['#10B981', '#94A3B8']}
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Last Year: ${(trend.totalLastYear/1000).toFixed(0)}k</span>
                    <span>Current Year: ${(trend.totalCurrentYear/1000).toFixed(0)}k</span>
                  </div>
                  
                  {index < 2 && <hr className="border-muted my-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}