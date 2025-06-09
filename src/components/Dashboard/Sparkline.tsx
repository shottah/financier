'use client'

import { LineChart, Line, ResponsiveContainer, ReferenceLine } from 'recharts'

interface SparklineProps {
  data: number[]
  height?: number
  color?: string
  showComparison?: boolean
  comparisonIndex?: number
}

export function Sparkline({ 
  data, 
  height = 60, 
  color = '#3B82F6',
  showComparison = false,
  comparisonIndex 
}: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded" 
        style={{ height }}
      >
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    )
  }

  const chartData = data.map((value, index) => ({
    index,
    value,
    isPastPeriod: showComparison && comparisonIndex ? index < comparisonIndex : false
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          {showComparison && comparisonIndex && (
            <ReferenceLine 
              x={comparisonIndex - 0.5} 
              stroke="#E5E7EB" 
              strokeDasharray="2 2"
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}