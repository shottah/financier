import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Statement } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface MonthlyChartProps {
  cardId: string
}

export function MonthlyChart({ cardId }: MonthlyChartProps) {
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCard()
  }, [cardId])

  const fetchCard = async () => {
    try {
      const response = await fetch(`/api/cards/${cardId}`)
      const data = await response.json()
      setStatements(data.statements || [])
    } catch (error) {
      console.error('Failed to fetch card details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    )
  }

  const processedStatements = statements.filter(s => s.status === 'PROCESSED')
  
  // Group by month/year
  const monthlyData = processedStatements.reduce((acc, statement) => {
    if (statement.year && statement.month) {
      const key = `${statement.year}-${statement.month.toString().padStart(2, '0')}`
      if (!acc[key]) {
        acc[key] = { credits: 0, debits: 0 }
      }
      acc[key].credits += statement.totalCredit || 0
      acc[key].debits += statement.totalDebit || 0
    }
    return acc
  }, {} as Record<string, { credits: number; debits: number }>)

  const sortedMonths = Object.keys(monthlyData).sort()
  const labels = sortedMonths.map(key => {
    const [year, month] = key.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  })

  const data = {
    labels,
    datasets: [
      {
        label: 'Credits',
        data: sortedMonths.map(key => monthlyData[key].credits),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Debits',
        data: sortedMonths.map(key => monthlyData[key].debits),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
        <CardDescription>
          Credits and debits by month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedMonths.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No processed statements available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
