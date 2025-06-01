import { FileText, Upload, Calendar, Hash, CreditCard as CreditCardIcon, Activity, DollarSign, TrendingUp, Percent } from 'lucide-react'
import { notFound } from 'next/navigation'

import { RefreshableFileUpload } from '@/components/RefreshableFileUpload'
import { StatementList } from '@/components/StatementList'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Card as CardType } from '@/types'

interface Props {
  params: Promise<{
    id: string
  }>
}

async function getCard(id: string): Promise<CardType | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/cards/${id}`, {
      cache: 'no-store', // Ensure fresh data on each request
    })
    
    if (!response.ok) {
      return null
    }
    
    return response.json()
  } catch (error) {
    console.error('Failed to fetch card:', error)
    return null
  }
}

export default async function CardDetail({ params }: Props) {
  const { id } = await params
  const card = await getCard(id)

  if (!card) {
    notFound()
  }

  // Calculate total spending from all statements
  const totalSpending = card.statements?.reduce((sum, statement) => 
    sum + (statement.totalDebit || 0), 0) || 0
  
  // Calculate average monthly spending
  const monthlyAverage = card.statements && card.statements.length > 0 
    ? totalSpending / card.statements.length 
    : 0

  // Get the most recent processed statement for current balance
  const latestProcessedStatement = card.statements?.find(s => s.status === 'PROCESSED')
  const currentBalance = latestProcessedStatement?.endingBalance || 0

  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Compact Card Details - Left Aligned */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {/* Card Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-1 rounded" style={{ backgroundColor: card.color }} />
                <h1 className="text-xl font-semibold">{card.name}</h1>
                <Badge variant="outline" className="text-xs">
                  {card.type}
                </Badge>
              </div>
              {card.lastFour && (
                <p className="text-sm text-muted-foreground ml-3">
                  •••• {card.lastFour}
                </p>
              )}
            </div>

            {/* Card Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-sm">
                <p className="text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Statements
                </p>
                <p className="font-medium">{card.statements?.length || 0}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Last Upload
                </p>
                <p className="font-medium">
                  {card.statements && card.statements.length > 0 
                    ? new Date(card.statements[0].uploadDate).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Total Spent
                </p>
                <p className="font-medium">${totalSpending.toFixed(2)}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Monthly Avg
                </p>
                <p className="font-medium">${monthlyAverage.toFixed(2)}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Current Balance
                </p>
                <p className="font-medium">${currentBalance.toFixed(2)}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3" /> APR
                </p>
                <p className="font-medium">{card.apr || 'N/A'}</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 pt-2 border-t">
              <div className="text-sm">
                <p className="text-muted-foreground">Credit Limit</p>
                <p className="font-medium">${card.creditLimit?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Card Issuer</p>
                <p className="font-medium">{card.issuer || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Statement - Right Aligned */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Upload className="h-4 w-4 mr-2" />
              Upload Statement
            </CardTitle>
            <CardDescription>
              Upload your bank statements to analyze spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RefreshableFileUpload cardId={card.id} />
          </CardContent>
        </Card>
      </div>

      {/* Statements List - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Statements
          </CardTitle>
          <CardDescription>
            View and manage your uploaded statements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatementList statements={card.statements || []} />
        </CardContent>
      </Card>
    </div>
  )
}