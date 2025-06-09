'use client'

import { DashboardGrid } from '@/components/Dashboard/DashboardGrid'

interface DashboardContentProps {
  userId: string
}

export default function DashboardContent({ userId }: DashboardContentProps) {
  return (
    <div className="container mx-auto p-4">
      <DashboardGrid userId={userId} />
    </div>
  )
}