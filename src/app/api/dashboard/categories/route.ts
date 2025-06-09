import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { DashboardService } from '@/services/dashboard-service'

export async function GET() {
  try {
    const user = await requireUser()
    
    const categories = await DashboardService.getUserCategories(user.id)
    
    return NextResponse.json({
      categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}