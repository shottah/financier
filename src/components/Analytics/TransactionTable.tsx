'use client'

import { useMemo, useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDown, Search, Filter, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface EnhancedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  category?: string
  cardName: string
  cardColor: string
}

interface TransactionTableProps {
  transactions: EnhancedTransaction[]
}

const categoryColors: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  'Groceries': '#fb923c',
  'Restaurants': '#f97316',
  'Shopping': '#06b6d4',
  'Clothing & Accessories': '#22d3ee',
  'Electronics': '#0891b2',
  'Home & Garden': '#059669',
  'Transportation': '#a855f7',
  'Gas & Fuel': '#c084fc',
  'Public Transit': '#9333ea',
  'Ride Sharing': '#7c3aed',
  'Vehicle Maintenance': '#8b5cf6',
  'Entertainment': '#ec4899',
  'Streaming Services': '#f43f5e',
  'Movies & Shows': '#e11d48',
  'Gaming': '#db2777',
  'Utilities': '#84cc16',
  'Electricity': '#65a30d',
  'Water': '#4ade80',
  'Internet & Phone': '#16a34a',
  'Rent & Mortgage': '#15803d',
  'Property Management': '#166534',
  'Transfers': '#3b82f6',
  'Banking & Fees': '#1e40af',
  'ATM Withdrawals': '#2563eb',
  'Travel': '#8b5cf6',
  'Hotels & Lodging': '#9333ea',
  'Flights': '#a855f7',
  'Car Rentals': '#7c3aed',
  'Insurance': '#64748b',
  'Healthcare': '#f87171',
  'Pharmacy': '#ef4444',
  'Medical Services': '#dc2626',
  'Fitness & Sports': '#14b8a6',
  'Gym Memberships': '#0d9488',
  'Sports Equipment': '#0891b2',
  'Education': '#fbbf24',
  'Subscriptions': '#60a5fa',
  'Personal Care': '#c084fc',
  'Pets': '#f472b6',
  'Gifts & Donations': '#facc15',
  'Government & Taxes': '#78716c',
  'Investments': '#34d399',
  'Business Expenses': '#94a3b8',
  'Other': '#9ca3af',
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const { toast } = useToast()
  
  // Get unique categories from transactions
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()
    transactions.forEach(tx => {
      if (tx.category) categories.add(tx.category)
    })
    return Array.from(categories).sort()
  }, [transactions])

  // Get unique years and months from transactions
  const { uniqueYears, uniqueMonths } = useMemo(() => {
    const years = new Set<string>()
    const months = new Set<string>()
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    transactions.forEach(tx => {
      const date = new Date(tx.date)
      years.add(date.getFullYear().toString())
      const monthIndex = date.getMonth()
      months.add(`${monthIndex}:${monthNames[monthIndex]}`)
    })
    
    return {
      uniqueYears: Array.from(years).sort((a, b) => b.localeCompare(a)),
      uniqueMonths: Array.from(months).sort((a, b) => {
        const [aIndex] = a.split(':')
        const [bIndex] = b.split(':')
        return parseInt(aIndex) - parseInt(bIndex)
      })
    }
  }, [transactions])

  const columns: ColumnDef<EnhancedTransaction>[] = useMemo(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="font-medium">
            {format(new Date(row.getValue('date')), 'MMM dd, yyyy')}
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate">{row.getValue('description')}</div>
        ),
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue('amount'))
          const type = row.original.type
          return (
            <div className={`font-medium ${type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
              {type === 'CREDIT' ? '+' : '-'}${amount.toFixed(2)}
            </div>
          )
        },
      },
      {
        accessorKey: 'type',
        enableHiding: false,
        filterFn: (row, id, value) => {
          return value === row.getValue(id)
        },
      },
      {
        id: 'year',
        accessorFn: (row) => new Date(row.date).getFullYear().toString(),
        filterFn: (row, id, value) => {
          const rowYear = new Date(row.original.date).getFullYear().toString()
          return value === rowYear
        },
      },
      {
        id: 'month',
        accessorFn: (row) => new Date(row.date).getMonth().toString(),
        filterFn: (row, id, value) => {
          const rowMonth = new Date(row.original.date).getMonth().toString()
          return value === rowMonth
        },
      },
      {
        accessorKey: 'category',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Category
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const category = row.getValue('category') as string | undefined
          const color = category ? categoryColors[category] || '#9ca3af' : '#6b7280'
          return category ? (
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: color,
                color: color,
                backgroundColor: `${color}10`
              }}
            >
              {category}
            </Badge>
          ) : (
            <Badge variant="secondary">Uncategorized</Badge>
          )
        },
        filterFn: (row, id, value) => {
          return value === row.getValue(id)
        },
      },
      {
        accessorKey: 'cardName',
        header: 'Card',
        cell: ({ row }) => {
          const { cardName, cardColor } = row.original
          return (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cardColor }} />
              <span>{cardName}</span>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
      sorting: [
        {
          id: 'date',
          desc: true,
        },
      ],
    },
  })

  // Check if any filters are active
  const isFiltered = columnFilters.length > 0

  // Export function
  const exportToCSV = () => {
    try {
      // Get filtered data
      const filteredData = table.getFilteredRowModel().rows
      
      // Define CSV headers
      const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Card']
      
      // Convert data to CSV format
      const csvData = filteredData.map(row => [
        format(new Date(row.original.date), 'yyyy-MM-dd'),
        row.original.description,
        row.original.amount.toFixed(2),
        row.original.type,
        row.original.category || 'Uncategorized',
        row.original.cardName
      ])
      
      // Combine headers and data
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Success",
        description: `Exported ${filteredData.length} transactions to CSV`,
        variant: "default",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Error",
        description: "Failed to export transactions. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Complete transaction history</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
                  onChange={(event) =>
                    table.getColumn('description')?.setFilterValue(event.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={(table.getColumn('category')?.getFilterValue() as string) ?? ''}
              onValueChange={(value) =>
                table.getColumn('category')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColors[category] || '#9ca3af' }}
                      />
                      {category}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(table.getColumn('type')?.getFilterValue() as string) ?? ''}
              onValueChange={(value) =>
                table.getColumn('type')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEBIT">Debit</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(table.getColumn('year')?.getFilterValue() as string) ?? ''}
              onValueChange={(value) =>
                table.getColumn('year')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(table.getColumn('month')?.getFilterValue() as string) ?? ''}
              onValueChange={(value) =>
                table.getColumn('month')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonths.map(month => {
                  const [monthIndex, monthName] = month.split(':')
                  return (
                    <SelectItem key={monthIndex} value={monthIndex}>
                      {monthName}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {isFiltered && (
              <Button
                variant="outline"
                onClick={() => setColumnFilters([])}
                className="h-10 px-3"
              >
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>
          {isFiltered && (
            <div className="text-sm text-muted-foreground">
              Showing {table.getFilteredRowModel().rows.length} of {transactions.length} transactions
            </div>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}