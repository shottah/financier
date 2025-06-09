'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Plus, X } from 'lucide-react'
import { MultiLineChart } from '@/components/Dashboard/MultiLineChart'

interface WeeklyData {
  week: string
  weekNumber: number
  amount: number
}

interface CategoryTrend {
  category: string
  currentQuarter: WeeklyData[]
  lastQuarter: WeeklyData[]
  totalCurrentQuarter: number
  totalLastQuarter: number
  quarterChange: number
}

interface QuarterOverQuarterWidgetProps {
  userId: string
}

// Quarter utility functions
const generateQuarterOptions = () => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const quarters = []
  
  // Generate quarters for last 2 years and current year
  for (let year = currentYear - 2; year <= currentYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterKey = `${year}-Q${quarter}`
      const quarterLabel = `Q${quarter} ${year}`
      quarters.push({ key: quarterKey, label: quarterLabel, year, quarter })
    }
  }
  
  return quarters.reverse() // Most recent first
}

const getCurrentQuarter = () => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)
  return `${currentYear}-Q${currentQuarter}`
}

export function QuarterOverQuarterWidget({ userId }: QuarterOverQuarterWidgetProps) {
  const [trends, setTrends] = useState<CategoryTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter())
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const quarterOptions = generateQuarterOptions()

  useEffect(() => {
    fetchDashboardData()
    fetchAvailableCategories()
  }, [userId, selectedQuarter])

  useEffect(() => {
    if (selectedCategories.length > 0) {
      fetchCategoryTrends()
    } else {
      setCategoryTrends([])
    }
  }, [selectedCategories, selectedQuarter])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/analytics?quarter=${selectedQuarter}`)
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
          const response = await fetch(`/api/dashboard/analytics?quarter=${selectedQuarter}&category=${encodeURIComponent(category)}`)
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
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-48" />
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
                <Skeleton className="h-16 w-full" />
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
                <CardTitle className="text-base">Quarter over Quarter</CardTitle>
                <CardDescription className="text-xs">
                  Weekly spending trends for top 3 categories
                </CardDescription>
              </div>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue placeholder="Quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarterOptions.map((option) => (
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
                      {getTrendIcon(trends[0].quarterChange)}
                      <span className={`text-xs ${getTrendColor(trends[0].quarterChange)}`}>
                        {trends[0].quarterChange > 0 ? '+' : ''}{trends[0].quarterChange.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <MultiLineChart
                    currentQuarter={trends[0].currentQuarter}
                    lastQuarter={trends[0].lastQuarter}
                    height={120}
                    colors={['#3B82F6', '#94A3B8']}
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Last Q: ${(trends[0].totalLastQuarter/1000).toFixed(1)}k</span>
                    <span>Current Q: ${(trends[0].totalCurrentQuarter/1000).toFixed(1)}k</span>
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
                      {getTrendIcon(trend.quarterChange)}
                      <span className={`text-xs ${getTrendColor(trend.quarterChange)}`}>
                        {trend.quarterChange > 0 ? '+' : ''}{trend.quarterChange.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <MultiLineChart
                    currentQuarter={trend.currentQuarter}
                    lastQuarter={trend.lastQuarter}
                    height={80}
                    colors={['#3B82F6', '#94A3B8']}
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Last Q: ${(trend.totalLastQuarter/1000).toFixed(1)}k</span>
                    <span>Current Q: ${(trend.totalCurrentQuarter/1000).toFixed(1)}k</span>
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