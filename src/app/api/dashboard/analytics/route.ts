import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { DashboardService } from '@/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const searchParams = request.nextUrl.searchParams
    const quarter = searchParams.get('quarter')
    const category = searchParams.get('category')
    
    const [categoryTrends, summary] = await Promise.all([
      DashboardService.getCategoryTrends(user.id, quarter, category),
      DashboardService.getDashboardSummary(user.id)
    ])
    
    return NextResponse.json({
      categoryTrends,
      summary
    })
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    )
  }
}