'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Plus, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface RollingAverageData {
  month: string
  monthNumber: number
  year: number
  expenses: number
  rollingAverage: number | null
}

interface RollingAverageWidgetProps {
  userId: string
}

export function RollingAverageWidget({ userId }: RollingAverageWidgetProps) {
  const [data, setData] = useState<RollingAverageData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAverage, setCurrentAverage] = useState<number>(0)
  const [previousAverage, setPreviousAverage] = useState<number>(0)
  const [percentChange, setPercentChange] = useState<number>(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [categoryData, setCategoryData] = useState<{ [key: string]: RollingAverageData[] }>({})
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchRollingAverageData() // Fetch all expenses by default
  }, [userId])

  useEffect(() => {
    if (selectedCategories.length > 0) {
      fetchCategoryData()
    } else {
      setCategoryData({})
    }
  }, [selectedCategories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/dashboard/categories')
      const result = await response.json()
      setAvailableCategories(result.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchRollingAverageData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/rolling-average') // All expenses by default
      const result = await response.json()
      setData(result.data || [])
      
      // Get the last two months with rolling averages for comparison
      const monthsWithAverage = result.data.filter((d: RollingAverageData) => d.rollingAverage !== null)
      if (monthsWithAverage.length >= 2) {
        const current = monthsWithAverage[monthsWithAverage.length - 1].rollingAverage
        const previous = monthsWithAverage[monthsWithAverage.length - 2].rollingAverage
        setCurrentAverage(current)
        setPreviousAverage(previous)
        
        if (previous > 0) {
          setPercentChange(((current - previous) / previous) * 100)
        }
      }
    } catch (error) {
      console.error('Failed to fetch rolling average data:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryData = async () => {
    try {
      const newCategoryData: { [key: string]: RollingAverageData[] } = {}
      
      await Promise.all(
        selectedCategories.map(async (category) => {
          const response = await fetch(`/api/dashboard/rolling-average?category=${encodeURIComponent(category)}`)
          const result = await response.json()
          newCategoryData[category] = result.data || []
        })
      )
      
      setCategoryData(newCategoryData)
    } catch (error) {
      console.error('Failed to fetch category data:', error)
      setCategoryData({})
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
    if (change > 5) return <TrendingUp className="h-4 w-4 text-red-600" />
    if (change < -5) return <TrendingDown className="h-4 w-4 text-green-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-red-600'
    if (change < -5) return 'text-green-600'
    return 'text-gray-600'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            Expenses: {formatCurrency(payload[0].value)}
          </p>
          {payload[1]?.value && (
            <p className="text-xs text-primary">
              3-Month Avg: {formatCurrency(payload[1].value)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="h-full widget-card shadow-none border">
        <CardHeader className="pb-2 px-4 py-3 space-y-3">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-48" />
          </div>
          <Skeleton className="h-8 w-full" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full widget-card shadow-none border">
      <CardHeader className="pb-2 px-4 py-3">
        <CardTitle className="text-base">3-Month Rolling Average</CardTitle>
        <CardDescription className="text-xs">
          Monthly expenses with 3-month average trend
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {data.length === 0 ? (
          <div className="text-center py-6 h-full flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold mb-1">No data available</h3>
            <p className="text-xs text-muted-foreground">Upload statements to see trends</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* All Expenses Chart */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    All Expenses - Current Average
                  </p>
                  <p className="text-lg font-semibold">{formatCurrency(currentAverage)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(percentChange)}
                  <span className={`text-sm font-medium ${getTrendColor(percentChange)}`}>
                    {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }}
                      tickMargin={5}
                    />
                    <YAxis 
                      hide 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Monthly expenses line */}
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                    
                    {/* Rolling average line */}
                    <Line
                      type="monotone"
                      dataKey="rollingAverage"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      strokeDasharray="0"
                    />
                    
                    {/* Reference line for current average */}
                    <ReferenceLine 
                      y={currentAverage} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="3 3"
                      opacity={0.5}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-3 h-0.5 bg-muted-foreground"></span>
                  Monthly
                  <span className="inline-block w-3 h-1 bg-primary"></span>
                  3-Month Avg
                </span>
              </div>
            </div>

            {/* Selected Categories */}
            {selectedCategories.map((category) => {
              const catData = categoryData[category] || []
              const monthsWithAverage = catData.filter(d => d.rollingAverage !== null)
              const catCurrentAverage = monthsWithAverage.length > 0 
                ? monthsWithAverage[monthsWithAverage.length - 1].rollingAverage || 0
                : 0
              
              return (
                <div key={category} className="space-y-2 pt-2 border-t border-muted">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{category} - Current Average</p>
                        <p className="text-sm font-semibold">{formatCurrency(catCurrentAverage)}</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="h-5 px-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeCategory(category)}
                      >
                        <X className="h-3 w-3" />
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={catData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 10 }}
                          tickMargin={5}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} />
                        
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={1}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                        
                        <Line
                          type="monotone"
                          dataKey="rollingAverage"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })}

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
        )}
      </CardContent>
    </Card>
  )
}