'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import Cookies from 'js-cookie'
import { Plus, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardWidget } from './DashboardWidget'
import { WidgetSidebar } from './WidgetSidebar'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

const COOKIE_KEY = 'dashboard-layout'
const GRID_COLS = { lg: 8, md: 8, sm: 4, xs: 2 }
const GRID_ROWS = 16

const WIDGET_DEFAULTS = {
  'quarter-over-quarter': { w: 4, h: 8, minW: 3, minH: 6, maxH: 12 },
  'year-over-year': { w: 4, h: 6, minW: 3, minH: 4, maxH: 10 },
  'rolling-average': { w: 4, h: 6, minW: 3, minH: 4, maxH: 10 }
} as const

const DEFAULT_WIDGET_CONFIG = { w: 4, h: 6, minW: 2, minH: 4, maxH: 12 }

export interface WidgetConfig {
  i: string
  type: string
  w: number
  h: number
  x: number
  y: number
  minW?: number
  minH?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
}

interface DashboardGridProps {
  userId: string
}

export function DashboardGrid({ userId }: DashboardGridProps) {
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({})
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg')

  // Load layout from cookies on mount
  useEffect(() => {
    const savedLayout = Cookies.get(COOKIE_KEY)
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout)
        const savedWidgets = parsed.widgets || []
        const savedLayouts = parsed.layouts || {}
        
        setWidgets(savedWidgets)
        
        // Ensure layouts have the widget configurations
        const layoutsWithConfig = { ...savedLayouts }
        if (!layoutsWithConfig.lg) {
          layoutsWithConfig.lg = savedWidgets.map((w: WidgetConfig) => ({
            i: w.i,
            x: w.x,
            y: w.y,
            w: w.w,
            h: w.h,
            minW: w.minW,
            minH: w.minH,
            maxH: w.maxH,
            static: false
          }))
        }
        
        setLayouts(layoutsWithConfig)
      } catch (e) {
        console.error('Failed to parse saved layout:', e)
      }
    } else {
      // Default layout with the quarter over quarter widget
      const defaultWidget: WidgetConfig = {
        i: 'quarter-over-quarter-default',
        type: 'quarter-over-quarter',
        x: 0,
        y: 0,
        w: 4,
        h: 8,
        minW: 3,
        minH: 6,
        maxH: 12
      }
      setWidgets([defaultWidget])
      
      const initialLayout = {
        lg: [{
          i: defaultWidget.i,
          x: defaultWidget.x,
          y: defaultWidget.y,
          w: defaultWidget.w,
          h: defaultWidget.h,
          minW: defaultWidget.minW,
          minH: defaultWidget.minH,
          maxH: defaultWidget.maxH,
          static: false
        }],
        md: [{
          i: defaultWidget.i,
          x: defaultWidget.x,
          y: defaultWidget.y,
          w: defaultWidget.w,
          h: defaultWidget.h,
          minW: defaultWidget.minW,
          minH: defaultWidget.minH,
          maxH: defaultWidget.maxH,
          static: false
        }],
        sm: [{
          i: defaultWidget.i,
          x: 0,
          y: 0,
          w: 4,
          h: defaultWidget.h,
          minW: defaultWidget.minW,
          minH: defaultWidget.minH,
          maxH: defaultWidget.maxH,
          static: false
        }],
        xs: [{
          i: defaultWidget.i,
          x: 0,
          y: 0,
          w: 2,
          h: defaultWidget.h,
          minW: 1,
          minH: defaultWidget.minH,
          maxH: defaultWidget.maxH,
          static: false
        }]
      }
      setLayouts(initialLayout)
    }
  }, [])

  // Save layout to cookies when it changes
  const saveLayout = useCallback((newLayouts: { [key: string]: Layout[] }, newWidgets: WidgetConfig[]) => {
    const layoutData = {
      layouts: newLayouts,
      widgets: newWidgets
    }
    Cookies.set(COOKIE_KEY, JSON.stringify(layoutData), { expires: 365 })
  }, [])

  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    // Only update if not currently dragging to prevent conflicts
    if (!isDragging) {
      // Update layouts
      setLayouts(allLayouts)
      
      // Update widget positions based on the current breakpoint layout
      const breakpointLayout = allLayouts[currentBreakpoint] || currentLayout
      const updatedWidgets = widgets.map(widget => {
        const layoutItem = breakpointLayout.find((item: Layout) => item.i === widget.i)
        if (layoutItem) {
          return {
            ...widget,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        }
        return widget
      })
      
      setWidgets(updatedWidgets)
      saveLayout(allLayouts, updatedWidgets)
    }
  }, [isDragging, currentBreakpoint, widgets, saveLayout])
  
  const handleDragStop = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => {
    setIsDragging(false)
    // Get the current layouts and pass them to handleLayoutChange
    const allLayouts = { ...layouts, [currentBreakpoint]: layout }
    handleLayoutChange(layout, allLayouts)
  }, [handleLayoutChange, layouts, currentBreakpoint])

  // Memoized position finding function
  const findAvailablePosition = useMemo(() => {
    return (config: { w: number; h: number }, existingWidgets: WidgetConfig[]) => {
      const occupiedSpaces = new Set<string>()
      
      // Mark all occupied spaces
      existingWidgets.forEach(widget => {
        for (let x = widget.x; x < widget.x + widget.w; x++) {
          for (let y = widget.y; y < widget.y + widget.h; y++) {
            occupiedSpaces.add(`${x},${y}`)
          }
        }
      })
      
      // Find first available space for widget size
      const maxCols = GRID_COLS[currentBreakpoint as keyof typeof GRID_COLS]
      for (let y = 0; y <= GRID_ROWS - config.h; y++) {
        for (let x = 0; x <= maxCols - config.w; x++) {
          let canPlace = true
          for (let dx = 0; dx < config.w; dx++) {
            for (let dy = 0; dy < config.h; dy++) {
              if (occupiedSpaces.has(`${x + dx},${y + dy}`)) {
                canPlace = false
                break
              }
            }
            if (!canPlace) break
          }
          if (canPlace) return { x, y }
        }
      }
      
      // If no space found, place at the bottom
      return { x: 0, y: Math.max(...existingWidgets.map(w => w.y + w.h), 0) }
    }
  }, [currentBreakpoint])

  const addWidget = useCallback((widgetType: string) => {
    const config = WIDGET_DEFAULTS[widgetType as keyof typeof WIDGET_DEFAULTS] || DEFAULT_WIDGET_CONFIG
    
    const position = findAvailablePosition(config, widgets)
    const newWidget: WidgetConfig = {
      i: `${widgetType}-${Date.now()}`,
      type: widgetType,
      x: position.x,
      y: position.y,
      ...config
    }
    
    const newWidgets = [...widgets, newWidget]
    setWidgets(newWidgets)
    saveLayout(layouts, newWidgets)
    setSidebarOpen(false)
  }, [widgets, layouts, saveLayout, findAvailablePosition])

  const removeWidget = useCallback((widgetId: string) => {
    const newWidgets = widgets.filter(w => w.i !== widgetId)
    setWidgets(newWidgets)
    saveLayout(layouts, newWidgets)
  }, [widgets, layouts, saveLayout])

  const compactWidgets = useCallback(() => {
    const currentLayout = layouts[currentBreakpoint] || []
    if (currentLayout.length === 0) return
    
    // Sort items by their current position (top to bottom, left to right)
    const sortedLayout = [...currentLayout].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })

    const cols = GRID_COLS[currentBreakpoint as keyof typeof GRID_COLS]
    const occupiedGrid = new Set<string>()

    // Optimized position finding using Set for O(1) lookups
    const findNextPosition = (item: Layout): { x: number, y: number } => {
      for (let y = 0; y <= GRID_ROWS * 2 - item.h; y++) {
        for (let x = 0; x <= cols - item.w; x++) {
          let canPlace = true
          
          // Check if all required cells are free
          for (let dx = 0; dx < item.w && canPlace; dx++) {
            for (let dy = 0; dy < item.h && canPlace; dy++) {
              if (occupiedGrid.has(`${x + dx},${y + dy}`)) {
                canPlace = false
              }
            }
          }
          
          if (canPlace) {
            // Mark cells as occupied
            for (let dx = 0; dx < item.w; dx++) {
              for (let dy = 0; dy < item.h; dy++) {
                occupiedGrid.add(`${x + dx},${y + dy}`)
              }
            }
            return { x, y }
          }
        }
      }
      
      return { x: 0, y: Math.max(...currentLayout.map(w => w.y + w.h), 0) }
    }

    // Reposition all items efficiently
    const compactedLayout = sortedLayout.map(item => {
      const newPosition = findNextPosition(item)
      return { ...item, x: newPosition.x, y: newPosition.y }
    })

    // Create new layouts object for all breakpoints
    const newLayouts: { [key: string]: Layout[] } = {}
    Object.keys(GRID_COLS).forEach(breakpoint => {
      if (breakpoint === currentBreakpoint) {
        newLayouts[breakpoint] = compactedLayout
      } else {
        newLayouts[breakpoint] = layouts[breakpoint] || []
      }
    })
    
    // Update widgets efficiently using Map for O(1) lookups
    const layoutMap = new Map(compactedLayout.map(item => [item.i, item]))
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layoutMap.get(widget.i)
      return layoutItem ? { ...widget, x: layoutItem.x, y: layoutItem.y } : widget
    })

    // Force React Grid Layout to update by creating new layout object
    setLayouts({})
    setWidgets([])
    
    // Use requestAnimationFrame to ensure DOM updates
    requestAnimationFrame(() => {
      setLayouts(newLayouts)
      setWidgets(updatedWidgets)
      saveLayout(newLayouts, updatedWidgets)
    })
  }, [layouts, currentBreakpoint, widgets, saveLayout])

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold mb-0">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Drag widgets to rearrange your dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              Cookies.remove(COOKIE_KEY)
              window.location.reload()
            }}
            size="sm"
            variant="ghost"
            className="text-xs"
          >
            Reset Layout
          </Button>
          <Button
            onClick={compactWidgets}
            size="sm"
            variant="ghost"
            className="text-xs"
            title="Minimize gaps between widgets"
          >
            <Minimize2 className="h-4 w-4 mr-1" />
            Compact
          </Button>
          <Button
            onClick={() => setSidebarOpen(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Widget
          </Button>
        </div>
      </div>

      <ResponsiveGridLayout
        className={`layout ${isDragging ? 'is-dragging' : ''}`}
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onDragStart={(layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => setIsDragging(true)}
        onDragStop={handleDragStop}
        onBreakpointChange={(newBreakpoint) => setCurrentBreakpoint(newBreakpoint)}
        onDrop={(layout, item, e) => {
          console.log('Dropped item:', item)
          return false // Let the grid handle the drop
        }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={GRID_COLS}
        rowHeight={30}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        compactType={null}
        preventCollision={true}
        isDraggable={true}
        isResizable={true}
        useCSSTransforms={true}
        transformScale={1}
        draggableHandle=".drag-handle"
        isBounded={false}
      >
        {widgets.map((widget) => (
          <div 
            key={widget.i} 
            data-grid={{
              i: widget.i,
              x: widget.x,
              y: widget.y,
              w: widget.w,
              h: widget.h,
              minW: widget.minW,
              minH: widget.minH,
              maxH: widget.maxH,
              static: widget.static || false
            }}
          >
            <DashboardWidget
              widget={widget}
              userId={userId}
              onRemove={() => removeWidget(widget.i)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      <WidgetSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddWidget={addWidget}
      />

      <style jsx global>{`
        .layout {
          position: relative;
          background-image: 
            linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px);
          background-size: calc(100% / 8) 30px;
          background-position: -1px -1px;
          min-height: 800px;
        }
        .react-grid-item {
          /* Removed overflow to fix dragging */
        }
        .react-grid-item:hover {
          cursor: grab;
        }
        .react-grid-item:hover .widget-card {
          border-color: hsl(var(--border) / 0.8);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.15);
          opacity: 0.5;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 0.75rem;
          border: 2px dashed hsl(var(--primary));
        }
        .react-grid-item.resizing {
          opacity: 0.9;
          z-index: 100;
          cursor: nwse-resize !important;
        }
        .react-grid-item.dragging {
          z-index: 100;
          cursor: grabbing !important;
          opacity: 0.8;
        }
        .react-grid-item.dragging .widget-card {
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .react-grid-item.dragging * {
          cursor: grabbing !important;
        }
        .widget-card {
          height: 100%;
          width: 100%;
          transition: all 200ms ease;
        }
        .widget-container {
          height: 100%;
          width: 100%;
          cursor: default;
        }
        .react-grid-item .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          background: transparent;
        }
        .react-grid-item .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid hsl(var(--border));
          border-bottom: 2px solid hsl(var(--border));
        }
        .drag-handle {
          transition: all 200ms ease;
        }
        .drag-handle:hover {
          background: hsl(var(--muted));
          transform: scale(1.05);
        }
        .drag-handle:active {
          transform: scale(0.95);
        }
        /* Fix for widget shifting issue */
        .react-grid-layout {
          position: relative;
        }
        .react-grid-item.static {
          cursor: default;
        }
        /* Smooth transitions for non-dragging items */
        .react-grid-item.cssTransforms {
          transition: transform 200ms ease;
        }
        .react-grid-item.dragging.cssTransforms {
          transition: none;
        }
        .react-grid-item.resizing.cssTransforms {
          transition: opacity 200ms ease;
        }
        .react-grid-item.resizing .widget-card {
          opacity: 0.8;
        }
      `}</style>
    </>
  )
}