import { FileText, CreditCard, ArrowLeft, ExternalLink } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TransactionTableWrapper from './transaction-table-wrapper'
import { db } from '@/db'
import { requireUser } from '@/lib/auth'
import ExportButton from './export-button'
import DeleteButton from './delete-button'

interface Props {
  params: Promise<{
    id: string
  }>
}

async function getStatement(id: string) {
  try {
    const user = await requireUser()
    
    // Get the statement with full details directly from database
    const statement = await db.statement.findUnique({
      where: { id },
      include: {
        card: {
          select: {
            id: true,
            name: true,
            userId: true,
            type: true,
            lastFour: true,
            color: true,
          }
        },
        transactions: {
          orderBy: { date: 'desc' }
        },
      }
    })

    if (!statement) {
      return null
    }

    // Verify user owns this statement
    const statementWithCard = statement as typeof statement & { 
      card: { 
        userId: string
        id: string
        name: string
        type: string
        lastFour: string | null
        color: string
      }
      transactions: Array<{
        id: string
        date: Date
        description: string
        amount: number
        type: 'DEBIT' | 'CREDIT'
        category: string | null
      }>
    }
    if (statementWithCard.card.userId !== user.id) {
      return null
    }

    return statementWithCard
  } catch (error) {
    console.error('Failed to fetch statement:', error)
    return null
  }
}

export default async function StatementDetailPage({ params }: Props) {
  const { id } = await params
  const statement = await getStatement(id)

  if (!statement) {
    notFound()
  }

  const transactions = statement.transactions || []
  const totalDebits = transactions
    .filter((t: any) => t.type === 'DEBIT')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  const totalCredits = transactions
    .filter((t: any) => t.type === 'CREDIT')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Back Button */}
      <div className="mb-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/cards/${statement.cardId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Card
          </Link>
        </Button>
      </div>

      {/* Statement Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{statement.fileName}</h1>
        <div className="flex items-center gap-4 mt-1">
          <Link 
            href={`/cards/${statement.cardId}`}
            className="flex items-center gap-2 hover:bg-muted/50 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: statement.card?.color || '#6B7280' }}
            />
            <span className="text-sm text-muted-foreground hover:text-foreground">
              {statement.card?.name || 'Unknown Card'}
            </span>
            {statement.card?.lastFour && (
              <span className="text-sm text-muted-foreground hover:text-foreground">
                •••• {statement.card.lastFour}
              </span>
            )}
            {statement.card?.type && (
              <Badge variant="outline" className="text-xs ml-1">
                {statement.card.type}
              </Badge>
            )}
          </Link>
        </div>
      </div>

      {/* Statement Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Statement Period</p>
            <div className="text-lg font-bold">
              {statement.month && statement.year 
                ? `${statement.month}/${statement.year}`
                : 'N/A'
              }
            </div>
            {statement.statementDate && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(statement.statementDate), 'MMM dd, yyyy')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Amount Owing</p>
            <div className="text-lg font-bold">
              ${(statement.endBalance ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Closing balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Borrowed</p>
            <div className="text-lg font-bold text-red-600">
              ${totalDebits.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter((t: any) => t.type === 'DEBIT').length} charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Payments</p>
            <div className="text-lg font-bold text-green-600">
              ${totalCredits.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter((t: any) => t.type === 'CREDIT').length} credits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statement Details */}
      <div className="mb-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-3">Statement Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Upload Date</p>
                <p className="font-medium text-sm">
                  {format(new Date(statement.uploadDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={
                  statement.status === 'PROCESSED' ? 'default' :
                  statement.status === 'FAILED' ? 'destructive' :
                  'secondary'
                } className="mt-1">
                  {statement.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Starting Balance</p>
                <p className="font-medium text-sm">
                  ${(statement.startBalance ?? 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ending Balance</p>
                <p className="font-medium text-sm">
                  ${(statement.endBalance ?? 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sum of Debits</p>
                <p className="font-medium text-sm text-red-600">
                  ${totalDebits.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sum of Credits</p>
                <p className="font-medium text-sm text-green-600">
                  ${totalCredits.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Transactions</CardTitle>
              <p className="text-xs text-muted-foreground">
                {transactions.length} transactions extracted
              </p>
            </div>
            <div className="flex gap-2">
              {(statement.blobUrl || statement.filePath) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <Link 
                    href={statement.blobUrl || statement.filePath} 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View PDF
                  </Link>
                </Button>
              )}
              <ExportButton 
                transactions={transactions}
                fileName={statement.fileName}
                disabled={transactions.length === 0}
              />
              <DeleteButton 
                statementId={statement.id}
                cardId={statement.cardId}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionTableWrapper
            transactions={transactions}
            enableQuickEdit={true}
            enableEdit={true}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}