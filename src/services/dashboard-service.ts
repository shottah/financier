import { db } from '@/db'
import { 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear, 
  subQuarters, 
  subYears,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek
} from 'date-fns'

interface WeeklyData {
  week: string
  weekNumber: number
  amount: number
}

interface MonthlyData {
  month: string
  monthNumber: number
  amount: number
}

interface CategoryTrend {
  category: string
  currentQuarter: WeeklyData[]
  lastQuarter: WeeklyData[]
  currentYear: MonthlyData[]
  lastYear: MonthlyData[]
  totalCurrentQuarter: number
  totalLastQuarter: number
  totalCurrentYear: number
  totalLastYear: number
  quarterChange: number
  yearChange: number
}

export class DashboardService {
  /**
   * Parse quarter string (e.g., "2024-Q1") into date objects
   */
  private static parseQuarter(quarterStr: string | null | undefined) {
    if (!quarterStr) {
      const now = new Date()
      return {
        currentQuarterStart: startOfQuarter(now),
        currentQuarterEnd: endOfQuarter(now),
        lastQuarterStart: startOfQuarter(subQuarters(now, 1)),
        lastQuarterEnd: endOfQuarter(subQuarters(now, 1))
      }
    }

    const [year, quarter] = quarterStr.split('-Q')
    const yearNum = parseInt(year, 10)
    const quarterNum = parseInt(quarter, 10)
    
    // Calculate the selected quarter start/end
    const quarterStartMonth = (quarterNum - 1) * 3
    const selectedQuarterStart = new Date(yearNum, quarterStartMonth, 1)
    const selectedQuarterEnd = endOfQuarter(selectedQuarterStart)
    
    // Calculate previous quarter
    const previousQuarterStart = startOfQuarter(subQuarters(selectedQuarterStart, 1))
    const previousQuarterEnd = endOfQuarter(subQuarters(selectedQuarterStart, 1))
    
    return {
      currentQuarterStart: selectedQuarterStart,
      currentQuarterEnd: selectedQuarterEnd,
      lastQuarterStart: previousQuarterStart,
      lastQuarterEnd: previousQuarterEnd
    }
  }

  /**
   * Get category trends with quarter-over-quarter and year-over-year comparisons
   */
  static async getCategoryTrends(userId: string, quarter?: string | null, category?: string | null | undefined): Promise<CategoryTrend[]> {
    const { currentQuarterStart, currentQuarterEnd, lastQuarterStart, lastQuarterEnd } = this.parseQuarter(quarter)
    
    const categoryTrends: CategoryTrend[] = []

    // Determine category to use (specific category or all expenses)
    const categoryFilter = category || ''
    const categoryName = category || 'All Expenses'

    // Get expenses data for the specified category (or all if empty)
    const currentQuarterData = await this.getWeeklySpending(
      userId, 
      categoryFilter,
      currentQuarterStart, 
      currentQuarterEnd
    )
    const lastQuarterData = await this.getWeeklySpending(
      userId, 
      categoryFilter,
      lastQuarterStart, 
      lastQuarterEnd
    )

    // Calculate totals
    const totalCurrentQuarter = currentQuarterData.reduce((sum, week) => sum + week.amount, 0)
    const totalLastQuarter = lastQuarterData.reduce((sum, week) => sum + week.amount, 0)

    // Calculate percentage changes
    const quarterChange = totalLastQuarter > 0 
      ? ((totalCurrentQuarter - totalLastQuarter) / totalLastQuarter) * 100 
      : 0

    categoryTrends.push({
      category: categoryName,
      currentQuarter: currentQuarterData,
      lastQuarter: lastQuarterData,
      currentYear: [], // Not needed for this view
      lastYear: [], // Not needed for this view
      totalCurrentQuarter,
      totalLastQuarter,
      totalCurrentYear: 0, // Not needed for this view
      totalLastYear: 0, // Not needed for this view
      quarterChange,
      yearChange: 0 // Not needed for this view
    })

    return categoryTrends.sort((a, b) => b.totalCurrentYear - a.totalCurrentYear)
  }

  /**
   * Parse year string into date objects
   */
  private static parseYear(yearStr: string | null | undefined) {
    if (!yearStr) {
      const now = new Date()
      return {
        currentYearStart: startOfYear(now),
        currentYearEnd: endOfYear(now),
        lastYearStart: startOfYear(subYears(now, 1)),
        lastYearEnd: endOfYear(subYears(now, 1))
      }
    }

    const yearNum = parseInt(yearStr, 10)
    const selectedYearStart = new Date(yearNum, 0, 1)
    const selectedYearEnd = endOfYear(selectedYearStart)
    const previousYearStart = startOfYear(subYears(selectedYearStart, 1))
    const previousYearEnd = endOfYear(subYears(selectedYearStart, 1))
    
    return {
      currentYearStart: selectedYearStart,
      currentYearEnd: selectedYearEnd,
      lastYearStart: previousYearStart,
      lastYearEnd: previousYearEnd
    }
  }

  /**
   * Get year-over-year category trends 
   */
  static async getYearOverYearTrends(userId: string, year?: string | null, category?: string | null | undefined): Promise<CategoryTrend[]> {
    const { currentYearStart, currentYearEnd, lastYearStart, lastYearEnd } = this.parseYear(year)
    
    const categoryTrends: CategoryTrend[] = []

    // Determine category to use (specific category or all expenses)
    const categoryFilter = category || ''
    const categoryName = category || 'All Expenses'

    // Get monthly yearly data for the specified category (or all if empty)
    const currentYearData = await this.getMonthlySpendingStructured(
      userId, 
      categoryFilter,
      currentYearStart, 
      currentYearEnd
    )
    const lastYearData = await this.getMonthlySpendingStructured(
      userId, 
      categoryFilter,
      lastYearStart, 
      lastYearEnd
    )

    // Calculate totals
    const totalCurrentYear = currentYearData.reduce((sum, month) => sum + month.amount, 0)
    const totalLastYear = lastYearData.reduce((sum, month) => sum + month.amount, 0)

    // Calculate percentage changes
    const yearChange = totalLastYear > 0 
      ? ((totalCurrentYear - totalLastYear) / totalLastYear) * 100 
      : 0

    categoryTrends.push({
      category: categoryName,
      currentQuarter: [], // Not needed for this view
      lastQuarter: [], // Not needed for this view
      currentYear: currentYearData,
      lastYear: lastYearData,
      totalCurrentQuarter: 0, // Not needed for this view
      totalLastQuarter: 0, // Not needed for this view
      totalCurrentYear,
      totalLastYear,
      quarterChange: 0, // Not needed for this view
      yearChange
    })

    return categoryTrends.sort((a, b) => b.totalCurrentYear - a.totalCurrentYear)
  }

  /**
   * Get top spending categories for a date range
   */
  private static async getTopCategories(
    userId: string, 
    startDate: Date, 
    endDate: Date, 
    limit: number = 3
  ): Promise<string[]> {
    const result = await db.transaction.groupBy({
      by: ['category'],
      where: {
        statement: {
          card: {
            userId
          }
        },
        type: 'DEBIT',
        date: {
          gte: startDate,
          lte: endDate
        },
        category: {
          not: null
        }
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: limit
    })

    return result
      .map(r => (r as any).category)
      .filter((category): category is string => category !== null)
  }

  /**
   * Get weekly spending data for a category within a date range
   */
  private static async getWeeklySpending(
    userId: string,
    category: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeeklyData[]> {
    // Get all weeks in the range
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 }) // Monday start
    
    const weeklyData: WeeklyData[] = []

    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i]
      const weekStart = startOfWeek(week, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(week, { weekStartsOn: 1 })

      const whereClause: any = {
        statement: {
          card: {
            userId
          }
        },
        type: 'DEBIT',
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      }

      // Only add category filter if category is provided and not empty
      if (category && category.trim() !== '') {
        whereClause.category = category
      }

      const result = await db.transaction.aggregate({
        where: whereClause,
        _sum: {
          amount: true
        }
      })

      weeklyData.push({
        week: format(weekStart, 'MMMM dd'),
        weekNumber: i + 1,
        amount: (result._sum as any)?.amount || 0
      })
    }

    return weeklyData
  }

  /**
   * Get monthly spending data for a category within a date range (structured)
   */
  private static async getMonthlySpendingStructured(
    userId: string,
    category: string,
    startDate: Date,
    endDate: Date
  ): Promise<MonthlyData[]> {
    // Get all months in the range
    const months = eachMonthOfInterval({ start: startDate, end: endDate })
    
    const monthlyData: MonthlyData[] = []

    for (let i = 0; i < months.length; i++) {
      const month = months[i]
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const whereClause: any = {
        statement: {
          card: {
            userId
          }
        },
        type: 'DEBIT',
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      }

      // Only add category filter if category is provided and not empty
      if (category && category.trim() !== '') {
        whereClause.category = category
      }

      const result = await db.transaction.aggregate({
        where: whereClause,
        _sum: {
          amount: true
        }
      })

      monthlyData.push({
        month: format(month, 'MMMM'),
        monthNumber: i + 1,
        amount: (result._sum as any)?.amount || 0
      })
    }

    return monthlyData
  }

  /**
   * Get monthly spending data for a category within a date range
   */
  private static async getMonthlySpending(
    userId: string,
    category: string,
    startDate: Date,
    endDate: Date
  ): Promise<number[]> {
    // Get all months in the range
    const months = eachMonthOfInterval({ start: startDate, end: endDate })
    
    const monthlyData: number[] = []

    for (const month of months) {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const result = await db.transaction.aggregate({
        where: {
          statement: {
            card: {
              userId
            }
          },
          type: 'DEBIT',
          category,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          amount: true
        }
      })

      monthlyData.push((result._sum as any)?.amount || 0)
    }

    return monthlyData
  }

  /**
   * Get overall dashboard summary stats
   */
  static async getDashboardSummary(userId: string) {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subQuarters(now, 1))
    const lastMonthEnd = endOfMonth(subQuarters(now, 1))

    // Current month spending
    const currentMonthSpending = await db.transaction.aggregate({
      where: {
        statement: {
          card: {
            userId
          }
        },
        type: 'DEBIT',
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      _sum: {
        amount: true
      }
    })

    // Last month spending
    const lastMonthSpending = await db.transaction.aggregate({
      where: {
        statement: {
          card: {
            userId
          }
        },
        type: 'DEBIT',
        date: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      },
      _sum: {
        amount: true
      }
    })

    // Total cards
    const totalCards = await db.card.count({
      where: { userId }
    })

    // Total transactions this month
    const totalTransactions = await db.transaction.count({
      where: {
        statement: {
          card: {
            userId
          }
        },
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      }
    })

    const currentTotal = (currentMonthSpending._sum as any)?.amount || 0
    const lastTotal = (lastMonthSpending._sum as any)?.amount || 0
    const monthlyChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0

    return {
      currentMonthSpending: currentTotal,
      lastMonthSpending: lastTotal,
      monthlyChange,
      totalCards,
      totalTransactions
    }
  }

  /**
   * Get 3-month rolling average of expenses for the current year
   */
  static async getRollingAverageExpenses(userId: string, category?: string) {
    const now = new Date()
    const yearStart = startOfYear(now)
    const yearEnd = endOfYear(now)
    
    // Get all months in the current year
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })
    
    const monthlyData = []
    
    for (const month of months) {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      // Skip future months
      if (monthStart > now) continue
      
      // Build where clause with optional category filter
      const whereClause: any = {
        statement: {
          card: {
            userId
          }
        },
        type: 'DEBIT',
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      }
      
      // Add category filter if specified
      if (category) {
        whereClause.category = category
      }
      
      // Get total expenses for this month
      const monthExpenses = await db.transaction.aggregate({
        where: whereClause,
        _sum: {
          amount: true
        }
      })
      
      const expenses = (monthExpenses._sum as any)?.amount || 0
      
      monthlyData.push({
        month: format(month, 'MMMM'),
        monthNumber: month.getMonth() + 1,
        year: month.getFullYear(),
        expenses,
        rollingAverage: null as number | null
      })
    }
    
    // Calculate 3-month rolling average
    for (let i = 0; i < monthlyData.length; i++) {
      if (i >= 2) {
        // Calculate average of current month and previous 2 months
        const sum = monthlyData[i].expenses + 
                   monthlyData[i - 1].expenses + 
                   monthlyData[i - 2].expenses
        monthlyData[i].rollingAverage = sum / 3
      }
    }
    
    return monthlyData
  }
  
  /**
   * Get all unique categories for a user
   */
  static async getUserCategories(userId: string) {
    const categories = await db.transaction.findMany({
      where: {
        statement: {
          card: {
            userId
          }
        },
        category: {
          not: null
        }
      },
      select: {
        category: true
      },
      distinct: ['category']
    })
    
    const uniqueCategories = Array.from(new Set(categories.map(c => c.category).filter(Boolean) as string[]))
    return uniqueCategories.sort()
  }
}