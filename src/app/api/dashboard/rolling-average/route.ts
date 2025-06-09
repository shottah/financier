import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { DashboardService } from '@/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || undefined
    
    const rollingAverageData = await DashboardService.getRollingAverageExpenses(user.id, category)
    
    return NextResponse.json({
      data: rollingAverageData
    })
  } catch (error) {
    console.error('Error fetching rolling average data:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch rolling average data' },
      { status: 500 }
    )
  }
}