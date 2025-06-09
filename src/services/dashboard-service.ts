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
   * Get category trends with quarter-over-quarter and year-over-year comparisons
   */
  static async getCategoryTrends(userId: string): Promise<CategoryTrend[]> {
    const now = new Date()
    
    // Define time periods
    const currentQuarterStart = startOfQuarter(now)
    const currentQuarterEnd = endOfQuarter(now)
    const lastQuarterStart = startOfQuarter(subQuarters(now, 1))
    const lastQuarterEnd = endOfQuarter(subQuarters(now, 1))
    
    
    const currentYearStart = startOfYear(now)
    const currentYearEnd = endOfYear(now)
    const lastYearStart = startOfYear(subYears(now, 1))
    const lastYearEnd = endOfYear(subYears(now, 1))

    // Get top categories based on current year spending
    const topCategories = await this.getTopCategories(userId, currentYearStart, currentYearEnd, 3)
    
    const categoryTrends: CategoryTrend[] = []

    for (const categoryName of topCategories) {
      // Get weekly quarterly data
      const currentQuarterData = await this.getWeeklySpending(
        userId, 
        categoryName, 
        currentQuarterStart, 
        currentQuarterEnd
      )
      const lastQuarterData = await this.getWeeklySpending(
        userId, 
        categoryName, 
        lastQuarterStart, 
        lastQuarterEnd
      )

      // Get yearly data (monthly for the year)
      const currentYearData = await this.getMonthlySpendingStructured(
        userId, 
        categoryName, 
        currentYearStart, 
        currentYearEnd
      )
      const lastYearData = await this.getMonthlySpendingStructured(
        userId, 
        categoryName, 
        lastYearStart, 
        lastYearEnd
      )

      // Calculate totals
      const totalCurrentQuarter = currentQuarterData.reduce((sum, week) => sum + week.amount, 0)
      const totalLastQuarter = lastQuarterData.reduce((sum, week) => sum + week.amount, 0)
      const totalCurrentYear = currentYearData.reduce((sum, month) => sum + month.amount, 0)
      const totalLastYear = lastYearData.reduce((sum, month) => sum + month.amount, 0)

      // Calculate percentage changes
      const quarterChange = totalLastQuarter > 0 
        ? ((totalCurrentQuarter - totalLastQuarter) / totalLastQuarter) * 100 
        : 0
      const yearChange = totalLastYear > 0 
        ? ((totalCurrentYear - totalLastYear) / totalLastYear) * 100 
        : 0

      categoryTrends.push({
        category: categoryName,
        currentQuarter: currentQuarterData,
        lastQuarter: lastQuarterData,
        currentYear: currentYearData,
        lastYear: lastYearData,
        totalCurrentQuarter,
        totalLastQuarter,
        totalCurrentYear,
        totalLastYear,
        quarterChange,
        yearChange
      })
    }

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
      .map(r => r.category)
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
            gte: weekStart,
            lte: weekEnd
          }
        },
        _sum: {
          amount: true
        }
      })

      weeklyData.push({
        week: format(weekStart, 'MMM dd'),
        weekNumber: i + 1,
        amount: result._sum.amount || 0
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

      monthlyData.push({
        month: format(month, 'MMM'),
        monthNumber: i + 1,
        amount: result._sum.amount || 0
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

      monthlyData.push(result._sum.amount || 0)
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

    const currentTotal = currentMonthSpending._sum.amount || 0
    const lastTotal = lastMonthSpending._sum.amount || 0
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
      
      const expenses = monthExpenses._sum.amount || 0
      
      monthlyData.push({
        month: format(month, 'MMM'),
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
    
    const uniqueCategories = [...new Set(categories.map(c => c.category).filter(Boolean))]
    return uniqueCategories.sort()
  }
}