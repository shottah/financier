'use client'

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'

interface WeeklyData {
  week: string
  weekNumber: number
  amount: number
}

interface MultiLineChartProps {
  currentQuarter: WeeklyData[]
  lastQuarter: WeeklyData[]
  height?: number
  colors?: [string, string]
}

export function MultiLineChart({ 
  currentQuarter, 
  lastQuarter, 
  height = 120,
  colors = ['#3B82F6', '#EF4444']
}: MultiLineChartProps) {
  if (!currentQuarter.length && !lastQuarter.length) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded" 
        style={{ height }}
      >
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    )
  }

  // Combine data for both quarters
  const maxLength = Math.max(currentQuarter.length, lastQuarter.length)
  const chartData = []
  
  for (let i = 0; i < maxLength; i++) {
    const dataPoint: any = {
      week: i + 1,
      weekLabel: `W${i + 1}`
    }
    
    if (i < currentQuarter.length) {
      dataPoint.currentQuarter = currentQuarter[i].amount
    }
    
    if (i < lastQuarter.length) {
      dataPoint.lastQuarter = lastQuarter[i].amount
    }
    
    chartData.push(dataPoint)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-2 shadow-lg">
          <p className="text-xs font-medium">{`Week ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.dataKey === 'currentQuarter' ? 'Current Q' : 'Last Q'}: ${entry.value?.toLocaleString() || 0}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis 
            dataKey="weekLabel" 
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="lastQuarter"
            stroke={colors[1]}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            activeDot={{ r: 3 }}
            strokeDasharray="3 3"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="currentQuarter"
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}