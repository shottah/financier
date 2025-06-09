'use client'

import { TrendingUp, LineChart, BarChart3, Calendar } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface WidgetSidebarProps {
  open: boolean
  onClose: () => void
  onAddWidget: (widgetType: string) => void
}

const AVAILABLE_WIDGETS = [
  {
    id: 'quarter-over-quarter',
    name: 'Quarter over Quarter',
    description: 'Weekly spending trends comparing current quarter vs last quarter for top 3 categories',
    icon: BarChart3,
    defaultSize: { w: 4, h: 8 }
  },
  {
    id: 'year-over-year',
    name: 'Year over Year',
    description: 'Monthly spending trends comparing current year vs last year for top 3 categories',
    icon: Calendar,
    defaultSize: { w: 4, h: 6 }
  },
  {
    id: 'rolling-average',
    name: '3-Month Rolling Average',
    description: 'Track your monthly expenses with a 3-month rolling average trend line',
    icon: LineChart,
    defaultSize: { w: 4, h: 6 }
  }
]

export function WidgetSidebar({ open, onClose, onAddWidget }: WidgetSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Widget</SheetTitle>
          <SheetDescription>
            Choose a widget to add to your dashboard
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {AVAILABLE_WIDGETS.map((widget) => {
            const Icon = widget.icon
            return (
              <div
                key={widget.id}
                className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                onClick={() => onAddWidget(widget.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">{widget.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {widget.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Size: {widget.defaultSize.w} × {widget.defaultSize.h} cells
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}