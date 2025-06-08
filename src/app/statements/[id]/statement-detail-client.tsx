'use client'

import { FileText, CreditCard, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface StatementDetailClientProps {
  statement: any // Using any since we have the complex Prisma type
}

export default function StatementDetailClient({ statement }: StatementDetailClientProps) {
  const transactions = statement.transactions || []
  const totalDebits = transactions
    .filter((t: any) => t.type === 'DEBIT')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  const totalCredits = transactions
    .filter((t: any) => t.type === 'CREDIT')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const exportTransactions = () => {
    const exportData = transactions.map((transaction: any) => ({
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category || 'Uncategorized',
    }))

    const csv = [
      ['Date', 'Description', 'Amount', 'Type', 'Category'],
      ...exportData.map(row => [
        row.date,
        row.description,
        row.amount,
        row.type,
        row.category,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statement_${statement.fileName.replace(/\.[^/.]+$/, '')}_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

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
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: statement.card?.color || '#6B7280' }}
            />
            <span className="text-sm text-muted-foreground">
              {statement.card?.name || 'Unknown Card'}
            </span>
            {statement.card?.lastFour && (
              <span className="text-sm text-muted-foreground">
                •••• {statement.card.lastFour}
              </span>
            )}
          </div>
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
              ${(statement.endBalance ?? statement.endingBalance ?? 0).toFixed(2)}
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

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Card Information */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: statement.card?.color || '#6B7280' }}
                >
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{statement.card?.name || 'Unknown Card'}</p>
                  <p className="text-xs text-muted-foreground">
                    {statement.card?.type} Card {statement.card?.lastFour && `•••• ${statement.card.lastFour}`}
                  </p>
                  {statement.card?.issuer && (
                    <p className="text-xs text-muted-foreground">{statement.card.issuer}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statement Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-3">Statement Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
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
                  ${(statement.endBalance ?? statement.endingBalance ?? 0).toFixed(2)}
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportTransactions}
              disabled={transactions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs h-9">Date</TableHead>
                    <TableHead className="text-xs h-9">Description</TableHead>
                    <TableHead className="text-xs h-9">Category</TableHead>
                    <TableHead className="text-xs h-9 text-right">Amount</TableHead>
                    <TableHead className="text-xs h-9">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: any) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell className="py-2 text-sm">
                        {format(new Date(transaction.date), 'MMM dd')}
                      </TableCell>
                      <TableCell className="py-2 text-sm max-w-[300px] truncate">
                        <span className="truncate block">{transaction.description}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-xs">
                          {transaction.category || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`py-2 text-sm text-right font-medium ${
                        transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'CREDIT' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={transaction.type === 'CREDIT' ? 'default' : 'secondary'} className="text-xs">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}