'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AnalyticsTabsProps {
  selectedTab: string
  children: React.ReactNode
}

export function AnalyticsTabs({ selectedTab, children }: AnalyticsTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', value)
    router.push(`/analytics?${params.toString()}`)
  }
  
  return (
    <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="spending">Inflows & Outflows</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}