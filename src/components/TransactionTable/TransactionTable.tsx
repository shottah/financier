'use client'

import { useState, useMemo } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDown, ChevronDown, Edit, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

interface Transaction {
  id: string
  date: string | Date
  description: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  category?: string | null
  statementId?: string
  statement?: {
    card: {
      name: string
      color: string
    }
    fileName: string
  }
}

interface TransactionTableProps {
  transactions: Transaction[]
  showCard?: boolean
  showStatement?: boolean
  pageSize?: number
  enableQuickEdit?: boolean
  enableEdit?: boolean
  onTransactionUpdate?: (id: string, updates: Partial<Transaction>) => Promise<void>
}

export default function TransactionTable({
  transactions,
  showCard = false,
  showStatement = false,
  pageSize = 25,
  enableQuickEdit = true,
  enableEdit = false,
  onTransactionUpdate
}: TransactionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<Transaction & { type: 'DEBIT' | 'CREDIT' }>>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

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

  const handleQuickEdit = async (transaction: Transaction, field: keyof Transaction, value: any) => {
    if (enableQuickEdit && value !== transaction[field] && onTransactionUpdate) {
      setIsUpdating(true)
      try {
        await onTransactionUpdate(transaction.id, { [field]: value })
        toast({
          title: 'Transaction updated',
          description: `${field} has been updated successfully.`,
        })
      } catch (error: any) {
        toast({
          title: 'Update failed',
          description: `Failed to update ${field}: ${error.message}`,
          variant: 'destructive',
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleEditStart = (transaction: Transaction) => {
    setEditingRow(transaction.id)
    setEditingData({
      description: transaction.description,
      category: transaction.category,
      amount: transaction.amount,
      type: transaction.type,
    })
  }

  const handleEditSave = async () => {
    if (editingRow && onTransactionUpdate) {
      setIsUpdating(true)
      try {
        await onTransactionUpdate(editingRow, editingData)
        setEditingRow(null)
        setEditingData({})
        toast({
          title: 'Transaction updated',
          description: 'Transaction has been updated successfully.',
        })
      } catch (error: any) {
        toast({
          title: 'Update failed',
          description: `Failed to update transaction: ${error.message}`,
          variant: 'destructive',
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleEditCancel = () => {
    setEditingRow(null)
    setEditingData({})
  }

  const columns: ColumnDef<Transaction>[] = useMemo(() => {
    const baseColumns: ColumnDef<Transaction>[] = [
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
        cell: ({ row }) => {
          const date = row.getValue('date') as string | Date
          return (
            <div className="font-medium">
              {format(new Date(date), 'MMM dd, yyyy')}
            </div>
          )
        },
      },
      {
        accessorKey: 'description',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Description
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const transaction = row.original
          const isEditing = editingRow === transaction.id
          
          if (isEditing) {
            return (
              <Input
                value={editingData.description || ''}
                onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                className="max-w-[300px]"
              />
            )
          }
          
          return (
            <div 
              className="max-w-[400px] truncate cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
              onClick={() => enableQuickEdit && onTransactionUpdate && handleQuickEdit(transaction, 'description', prompt('Edit description:', transaction.description) || transaction.description)}
            >
              {row.getValue('description')}
            </div>
          )
        },
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
          const transaction = row.original
          const isEditing = editingRow === transaction.id
          
          if (isEditing) {
            return (
              <Input
                type="number"
                step="0.01"
                value={editingData.amount || 0}
                onChange={(e) => setEditingData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-24"
              />
            )
          }
          
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Type
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const transaction = row.original
          const isEditing = editingRow === transaction.id
          
          if (isEditing) {
            return (
              <Select
                value={editingData.type || transaction.type}
                onValueChange={(value: 'DEBIT' | 'CREDIT') => setEditingData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">DEBIT</SelectItem>
                  <SelectItem value="CREDIT">CREDIT</SelectItem>
                </SelectContent>
              </Select>
            )
          }
          
          const type = row.getValue('type') as 'CREDIT' | 'DEBIT'
          return enableQuickEdit && onTransactionUpdate ? (
            <div 
              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded inline-block"
              onClick={() => {
                const newType = type === 'DEBIT' ? 'CREDIT' : 'DEBIT'
                handleQuickEdit(transaction, 'type', newType)
              }}
            >
              <Badge variant={type === 'CREDIT' ? 'default' : 'secondary'} className="text-xs">
                {type}
              </Badge>
            </div>
          ) : (
            <Badge variant={type === 'CREDIT' ? 'default' : 'secondary'} className="text-xs">
              {type}
            </Badge>
          )
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
          const transaction = row.original
          const isEditing = editingRow === transaction.id
          
          if (isEditing) {
            return (
              <Input
                value={editingData.category || ''}
                onChange={(e) => setEditingData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="w-32"
              />
            )
          }
          
          const category = row.getValue('category') as string | null
          return (
            <div 
              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded inline-block"
              onClick={() => enableQuickEdit && onTransactionUpdate && handleQuickEdit(transaction, 'category', prompt('Edit category:', transaction.category || '') || transaction.category)}
            >
              {category ? (
                <Badge variant="outline">{category}</Badge>
              ) : (
                <Badge variant="secondary">Uncategorized</Badge>
              )}
            </div>
          )
        },
      },
    ]

    // Conditionally add card column
    if (showCard) {
      baseColumns.push({
        accessorKey: 'statement.card.name',
        header: 'Card',
        cell: ({ row }) => {
          const card = row.original.statement?.card
          return card ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
              <span>{card.name}</span>
            </div>
          ) : null
        },
      })
    }

    // Conditionally add statement column
    if (showStatement) {
      baseColumns.push({
        accessorKey: 'statement.fileName',
        header: 'Statement',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.statement?.fileName}
          </div>
        ),
      })
    }

    // Add hidden filter columns
    baseColumns.push(
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
      }
    )

    // Add filter function to type column
    const typeColumnIndex = baseColumns.findIndex(col => 'accessorKey' in col && col.accessorKey === 'type')
    if (typeColumnIndex !== -1) {
      baseColumns[typeColumnIndex] = {
        ...baseColumns[typeColumnIndex],
        filterFn: (row, id, value) => {
          return value === row.getValue(id)
        },
      }
    }

    // Add actions column if editing is enabled
    if (enableEdit) {
      baseColumns.push({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const transaction = row.original
          const isEditing = editingRow === transaction.id
          
          return (
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleEditSave}>
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleEditCancel}>
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => handleEditStart(transaction)}>
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        },
      })
    }

    return baseColumns
  }, [showCard, showStatement, enableEdit, enableQuickEdit, editingRow, editingData, onTransactionUpdate])

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  })


  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Filter transactions..."
          value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('description')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
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
        <Select
          value={(table.getColumn('type')?.getFilterValue() as string) ?? ''}
          onValueChange={(value) =>
            table.getColumn('type')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="DEBIT">Debit</SelectItem>
            <SelectItem value="CREDIT">Credit</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
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
                  {isUpdating ? 'Updating...' : 'No results.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
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
      </div>
    </div>
  )
}