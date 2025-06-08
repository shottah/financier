'use client'

import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

interface ExportButtonProps {
  transactions: any[]
  fileName: string
  disabled?: boolean
}

export default function ExportButton({ transactions, fileName, disabled = false }: ExportButtonProps) {
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
      .map(row => row.join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statement_${fileName.replace(/\.[^/.]+$/, '')}_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={exportTransactions}
      disabled={disabled}
    >
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  )
}