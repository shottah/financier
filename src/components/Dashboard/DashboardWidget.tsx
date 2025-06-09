'use client'

import { X, GripHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RollingAverageWidget } from './widgets/RollingAverageWidget'
import { QuarterOverQuarterWidget } from './widgets/QuarterOverQuarterWidget'
import { YearOverYearWidget } from './widgets/YearOverYearWidget'
import { WidgetConfig } from './DashboardGrid'

interface DashboardWidgetProps {
  widget: WidgetConfig
  userId: string
  onRemove: () => void
}

export function DashboardWidget({ widget, userId, onRemove }: DashboardWidgetProps) {
  const renderWidget = () => {
    switch (widget.type) {
      case 'quarter-over-quarter':
        return <QuarterOverQuarterWidget userId={userId} />
      case 'year-over-year':
        return <YearOverYearWidget userId={userId} />
      case 'rolling-average':
        return <RollingAverageWidget userId={userId} />
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Unknown widget type: {widget.type}
          </div>
        )
    }
  }

  return (
    <div className="relative h-full group widget-container">
      {/* Drag handle and controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        {/* Empty div for spacing */}
        <div className="w-6"></div>
        
        {/* Drag handle in the center */}
        <div className="drag-handle pointer-events-auto cursor-move px-4 py-1 rounded bg-muted/80 backdrop-blur-sm">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Remove button on the right */}
        <Button
          onClick={onRemove}
          size="icon"
          variant="ghost"
          className="pointer-events-auto h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {renderWidget()}
    </div>
  )
}