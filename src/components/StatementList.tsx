'use client'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { FileText, DollarSign, CalendarDays, Loader2, MoreVertical, Eye, Pencil, Trash, ArrowUpDown, ChevronDown, RefreshCw, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Statement } from '@/types'

interface StatementListProps {
  statements: Statement[]
}

export function StatementList({ statements }: StatementListProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const handleProcess = async (statementId: string, isReprocess: boolean = false) => {
    setProcessingIds(prev => new Set(prev).add(statementId))
    
    try {
      const response = await fetch(`/api/statements/${statementId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useAI: true, reprocess: isReprocess }),
      })
      
      if (response.ok) {
        router.refresh()
      } else {
        console.error('Failed to process statement:', await response.text())
      }
    } catch (error) {
      console.error('Failed to process statement:', error)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(statementId)
        return newSet
      })
    }
  }

  const handleDelete = async (statementId: string) => {
    if (!confirm('Are you sure you want to delete this statement?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/statements/${statementId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete statement:', error)
    }
  }

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(index => statements[parseInt(index)].id)
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} statements?`)) {
      return
    }
    
    try {
      // Delete statements one by one
      for (const id of selectedIds) {
        await fetch(`/api/statements/${id}`, {
          method: 'DELETE',
        })
      }
      
      router.refresh()
    } catch (error) {
      console.error('Failed to delete statements:', error)
    }
  }

  const handleBulkProcess = async () => {
    const selectedIds = Object.keys(rowSelection).map(index => statements[parseInt(index)].id)
    const selectedStatements = Object.keys(rowSelection).map(index => statements[parseInt(index)])
    
    try {
      // Process statements one by one
      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i]
        const statement = selectedStatements[i]
        const isReprocess = statement.status === 'PROCESSED'
        
        await fetch(`/api/statements/${id}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ useAI: true, reprocess: isReprocess }),
        })
      }
      
      router.refresh()
    } catch (error) {
      console.error('Failed to process statements:', error)
    }
  }

  const getStatusVariant = (status: Statement['status']) => {
    switch (status) {
      case 'UPLOADED':
        return 'secondary'
      case 'PROCESSING':
        return 'default'
      case 'PROCESSED':
        return 'default'
      case 'FAILED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const columns: ColumnDef<Statement>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'fileName',
      header: 'Statement',
      cell: ({ row }) => {
        const statement = row.original
        return (
          <Link href={`/statements/${statement.id}`} className="flex items-center gap-2 hover:underline">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{row.getValue('fileName')}</span>
          </Link>
        )
      },
      filterFn: 'includesString',
    },
    {
      accessorKey: 'uploadDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Upload Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3 text-gray-500" />
          {format(new Date(row.getValue('uploadDate')), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Statement['status']
        return (
          <Badge variant={getStatusVariant(status)} className="text-xs">
            {status === 'PROCESSING' && (
              <Loader2 className="h-2 w-2 mr-1 animate-spin" />
            )}
            {status}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value === row.getValue(id)
      },
    },
    {
      id: 'period',
      header: 'Period',
      cell: ({ row }) => {
        const statement = row.original
        if (statement.year && statement.month) {
          return `${statement.month}/${statement.year}`
        }
        return '-'
      },
      filterFn: (row, id, value) => {
        const statement = row.original
        if (statement.year && statement.month) {
          return `${statement.month}/${statement.year}` === value
        }
        return false
      },
    },
    {
      id: 'amount',
      header: 'Amount Owing',
      cell: ({ row }) => {
        const statement = row.original
        if (statement.status === 'PROCESSED' && (statement.endBalance !== undefined || statement.endingBalance !== undefined)) {
          const balance = statement.endBalance ?? statement.endingBalance ?? 0
          return (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-gray-500" />
              ${balance.toFixed(2)}
            </div>
          )
        }
        return '-'
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const statement = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            {statement.status === 'UPLOADED' && (
              <Button
                onClick={() => handleProcess(statement.id)}
                size="sm"
                variant="outline"
              >
                Process
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/statements/${statement.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>
                {statement.status === 'PROCESSED' && (
                  <DropdownMenuItem 
                    onClick={() => handleProcess(statement.id, true)}
                    disabled={processingIds.has(statement.id)}
                  >
                    {processingIds.has(statement.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Re-processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Re-process
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleDelete(statement.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: statements,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  if (statements.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No statements uploaded yet</p>
      </div>
    )
  }

  const selectedCount = Object.keys(rowSelection).length

  // Check if any filters are active
  const isFiltered = columnFilters.length > 0

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by filename..."
                value={(table.getColumn('fileName')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn('fileName')?.setFilterValue(event.target.value)
                }
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) =>
              table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="UPLOADED">Uploaded</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="PROCESSED">Processed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={(table.getColumn('period')?.getFilterValue() as string) ?? ''}
            onValueChange={(value) =>
              table.getColumn('period')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {Array.from(new Set(statements
                .filter(s => s.year && s.month)
                .map(s => `${s.month}/${s.year}`)))
                .sort()
                .reverse()
                .map(period => (
                  <SelectItem key={period} value={period}>{period}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
          {isFiltered && (
            <Button
              variant="outline"
              onClick={() => setColumnFilters([])}
              className="h-10 px-3"
            >
              Clear filters
            </Button>
          )}
        </div>
        {isFiltered && (
          <div className="text-sm text-muted-foreground">
            Showing {table.getFilteredRowModel().rows.length} of {statements.length} statements
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">
            {selectedCount} statement{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkProcess}
            >
              Process Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b bg-gray-50/50">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-2 text-left text-sm font-medium text-gray-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="border-b hover:bg-gray-50/50 transition-colors"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}