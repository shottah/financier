'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Plus, X } from 'lucide-react'
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

// Year utility functions
const generateYearOptions = () => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const years = []
  
  // Generate years for last 3 years and current year
  for (let year = currentYear - 3; year <= currentYear; year++) {
    years.push({ key: year.toString(), label: year.toString(), year })
  }
  
  return years.reverse() // Most recent first
}

const getCurrentYear = () => {
  return new Date().getFullYear().toString()
}

export function YearOverYearWidget({ userId }: YearOverYearWidgetProps) {
  const [trends, setTrends] = useState<CategoryTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(getCurrentYear())
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const yearOptions = generateYearOptions()

  useEffect(() => {
    fetchDashboardData()
    fetchAvailableCategories()
  }, [userId, selectedYear])

  useEffect(() => {
    if (selectedCategories.length > 0) {
      fetchCategoryTrends()
    } else {
      setCategoryTrends([])
    }
  }, [selectedCategories, selectedYear])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/year-over-year?year=${selectedYear}`)
      const data = await response.json()
      setTrends(data.categoryTrends || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setTrends([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCategories = async () => {
    try {
      const response = await fetch('/api/dashboard/categories')
      const data = await response.json()
      setAvailableCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setAvailableCategories([])
    }
  }

  const fetchCategoryTrends = async () => {
    try {
      const trends = await Promise.all(
        selectedCategories.map(async (category) => {
          const response = await fetch(`/api/dashboard/year-over-year?year=${selectedYear}&category=${encodeURIComponent(category)}`)
          const data = await response.json()
          return data.categoryTrends?.[0] || null
        })
      )
      setCategoryTrends(trends.filter(Boolean))
    } catch (error) {
      console.error('Failed to fetch category trends:', error)
      setCategoryTrends([])
    }
  }

  const addCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category])
    }
    setDialogOpen(false)
  }

  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category))
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Year over Year</CardTitle>
                <CardDescription className="text-xs">
                  Monthly spending trends by year
                </CardDescription>
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-4">
              {/* All Expenses Chart */}
              {trends.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{trends[0].category}</h3>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(trends[0].yearChange)}
                      <span className={`text-xs ${getTrendColor(trends[0].yearChange)}`}>
                        {trends[0].yearChange > 0 ? '+' : ''}{trends[0].yearChange.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <YearlyMultiLineChart
                    currentYear={trends[0].currentYear}
                    lastYear={trends[0].lastYear}
                    height={120}
                    colors={['#10B981', '#94A3B8']}
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Last Year: ${(trends[0].totalLastYear/1000).toFixed(1)}k</span>
                    <span>Current Year: ${(trends[0].totalCurrentYear/1000).toFixed(1)}k</span>
                  </div>
                </div>
              )}

              {/* Selected Categories */}
              {categoryTrends.map((trend, index) => (
                <div key={trend.category} className="space-y-2 pt-2 border-t border-muted">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{trend.category}</h3>
                      <Badge 
                        variant="secondary" 
                        className="h-5 px-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeCategory(trend.category)}
                      >
                        <X className="h-3 w-3" />
                      </Badge>
                    </div>
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
                    <span>Last Year: ${(trend.totalLastYear/1000).toFixed(1)}k</span>
                    <span>Current Year: ${(trend.totalCurrentYear/1000).toFixed(1)}k</span>
                  </div>
                </div>
              ))}

              {/* Add Category Button */}
              <div className="pt-2 border-t border-muted">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2 border border-dashed border-muted hover:border-border rounded-md">
                      <Plus className="h-3 w-3 inline mr-1" />
                      Add specific category
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {availableCategories
                        .filter(cat => !selectedCategories.includes(cat))
                        .map((category) => (
                        <Button
                          key={category}
                          variant="ghost"
                          className="justify-start"
                          onClick={() => addCategory(category)}
                        >
                          {category}
                        </Button>
                      ))}
                      {availableCategories.filter(cat => !selectedCategories.includes(cat)).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          All categories have been added
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}