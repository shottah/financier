'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, Edit, Check, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Merchant {
  id: string
  merchant: string
  totalSpent: number
  transactionCount: number
  categories: string[]
  primaryCategory: string | null
  transactions: Array<{
    id: string
    date: string
    amount: number
    category: string | null
    cardName: string
  }>
}

interface MerchantsContentProps {
  initialMerchants: Merchant[]
}

export default function MerchantsContent({ initialMerchants }: MerchantsContentProps) {
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [editingMerchant, setEditingMerchant] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string>('')
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const { toast } = useToast()

  // Get all unique categories for dropdown with colors
  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    merchants.forEach(merchant => {
      merchant.categories.forEach(cat => categories.add(cat))
    })
    return Array.from(categories).sort()
  }, [merchants])

  // Category colors mapping
  const categoryColors = useMemo(() => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#F7464A',
      '#8B5CF6', '#06D6A0', '#F72585', '#7209B7', '#F72585'
    ]
    const colorMap: Record<string, string> = {}
    allCategories.forEach((category, index) => {
      colorMap[category] = colors[index % colors.length]
    })
    return colorMap
  }, [allCategories])

  // Handle range selection with shift-click
  const handleRowSelection = (rowIndex: number, isSelected: boolean, isShiftClick: boolean) => {
    if (isShiftClick && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, rowIndex)
      const end = Math.max(lastSelectedIndex, rowIndex)
      const newSelection = { ...rowSelection }
      
      for (let i = start; i <= end; i++) {
        const row = table.getRowModel().rows[i]
        if (row) {
          newSelection[row.id] = true
        }
      }
      
      setRowSelection(newSelection)
    } else {
      // Normal selection
      setRowSelection(prev => ({
        ...prev,
        [table.getRowModel().rows[rowIndex]?.id]: isSelected
      }))
    }
    
    setLastSelectedIndex(rowIndex)
  }

  const handleCategoryEdit = async (merchantId: string, newCategory: string) => {
    try {
      const response = await fetch('/api/merchants/update-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          merchantName: merchantId, 
          category: newCategory 
        }),
      })

      if (!response.ok) throw new Error('Failed to update category')

      // Update local state
      setMerchants(prev => prev.map(merchant => 
        merchant.id === merchantId 
          ? { 
              ...merchant, 
              primaryCategory: newCategory,
              categories: Array.from(new Set([...merchant.categories, newCategory]))
            }
          : merchant
      ))

      toast({
        title: "Category Updated",
        description: `Successfully updated category for ${merchantId}`,
      })
      
      setEditingMerchant(null)
      setEditingCategory('')
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Merchant>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(value) => table.toggleAllPageRowsSelected(!!value.target.checked)}
          className="rounded border border-input"
        />
      ),
      cell: ({ row }) => {
        const rowIndex = table.getRowModel().rows.findIndex(r => r.id === row.id)
        return (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(event) => {
              const isSelected = event.target.checked
              const isShiftClick = (event.nativeEvent as MouseEvent).shiftKey
              handleRowSelection(rowIndex, isSelected, isShiftClick)
            }}
            className="rounded border border-input"
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "merchant",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Merchant
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate" title={row.getValue("merchant")}>
            {row.getValue("merchant")}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Total Spent
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalSpent"))
        return <div className="font-medium">${amount.toFixed(2)}</div>
      },
    },
    {
      accessorKey: "transactionCount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Transactions
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div>{row.getValue("transactionCount")}</div>
      ),
    },
    {
      accessorKey: "primaryCategory",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Primary Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const merchant = row.original
        const isEditing = editingMerchant === merchant.id

        if (isEditing) {
          return (
            <div className="flex items-center gap-2">
              <select
                value={editingCategory}
                onChange={(e) => setEditingCategory(e.target.value)}
                className="px-2 py-1 border rounded text-sm min-w-[120px]"
              >
                <option value="">Select category</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCategoryEdit(merchant.id, editingCategory)}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingMerchant(null)
                  setEditingCategory('')
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )
        }

        return (
          <div className="flex items-center gap-2">
            {merchant.primaryCategory ? (
              <Badge 
                variant="secondary" 
                className="border-2"
                style={{ 
                  borderColor: categoryColors[merchant.primaryCategory],
                  backgroundColor: `${categoryColors[merchant.primaryCategory]}15`
                }}
              >
                {merchant.primaryCategory}
              </Badge>
            ) : (
              <span className="text-muted-foreground">No category</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingMerchant(merchant.id)
                setEditingCategory(merchant.primaryCategory || '')
              }}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "categories",
      header: "All Categories",
      cell: ({ row }) => {
        const categories = row.getValue("categories") as string[]
        return (
          <div className="flex flex-wrap gap-1">
            {categories.length > 0 ? (
              categories.slice(0, 3).map((cat, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs border-2"
                  style={{
                    borderColor: categoryColors[cat],
                    backgroundColor: `${categoryColors[cat]}10`,
                    color: categoryColors[cat]
                  }}
                >
                  {cat}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
            {categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{categories.length - 3}
              </Badge>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: merchants,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
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
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedMerchants = selectedRows.map(row => row.original)

  return (
    <div className="container mx-auto p-8">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/analytics">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">All Merchants</h1>
          <p className="text-muted-foreground">
            Manage merchant categories and view spending details
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${merchants.reduce((sum, m) => sum + m.totalSpent, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedRows.length}</div>
            {selectedRows.length > 0 && (
              <p className="text-sm text-muted-foreground">
                ${selectedMerchants.reduce((sum, m) => sum + m.totalSpent, 0).toFixed(2)} total
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table Controls */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter merchants..."
          value={(table.getColumn("merchant")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("merchant")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
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
                  data-state={row.getIsSelected() && "selected"}
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
                  No merchants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} merchant(s) selected.
        </div>
      </div>
    </div>
  )
}