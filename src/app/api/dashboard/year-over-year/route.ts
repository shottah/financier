import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { DashboardService } from '@/services/dashboard-service'

export async function GET() {
  try {
    const user = await requireUser()
    
    const categoryTrends = await DashboardService.getYearOverYearTrends(user.id)
    
    return NextResponse.json({
      categoryTrends
    })
  } catch (error) {
    console.error('Error fetching year-over-year analytics:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch year-over-year analytics' },
      { status: 500 }
    )
  }
}