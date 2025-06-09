'use client'

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

interface MonthlyData {
  month: string
  monthNumber: number
  amount: number
}

interface YearlyMultiLineChartProps {
  currentYear: MonthlyData[]
  lastYear: MonthlyData[]
  height?: number
  colors?: [string, string]
}

export function YearlyMultiLineChart({ 
  currentYear, 
  lastYear, 
  height = 120,
  colors = ['#10B981', '#EF4444']
}: YearlyMultiLineChartProps) {
  if (!currentYear.length && !lastYear.length) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded" 
        style={{ height }}
      >
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    )
  }

  // Combine data for both years
  const maxLength = Math.max(currentYear.length, lastYear.length)
  const chartData = []
  
  for (let i = 0; i < maxLength; i++) {
    const dataPoint: any = {
      month: i + 1,
      monthLabel: i < currentYear.length ? currentYear[i].month : `M${i + 1}`
    }
    
    if (i < currentYear.length) {
      dataPoint.currentYear = currentYear[i].amount
    }
    
    if (i < lastYear.length) {
      dataPoint.lastYear = lastYear[i].amount
    }
    
    chartData.push(dataPoint)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-2 shadow-lg">
          <p className="text-xs font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.dataKey === 'currentYear' ? 'Current Year' : 'Last Year'}: ${entry.value?.toLocaleString() || 0}
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
            dataKey="monthLabel" 
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="lastYear"
            stroke={colors[1]}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            activeDot={{ r: 3 }}
            strokeDasharray="3 3"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="currentYear"
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