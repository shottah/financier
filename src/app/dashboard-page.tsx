'use client'

import { CreditCard, Plus, FileText, Eye, Edit2, Trash2 } from 'lucide-react'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Card as CardType } from '@/types'

export default function DashboardPage() {
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards')
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, Clerk will handle redirect
          return
        }
        throw new Error('Failed to fetch cards')
      }
      const data = await response.json()
      setCards(data)
    } catch (error) {
      console.error('Failed to fetch cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          type: formData.get('type'),
          lastFour: formData.get('lastFour'),
          color: formData.get('color'),
        }),
      })
      
      if (response.ok) {
        await fetchCards()
        setDialogOpen(false)
        form.reset()
      }
    } catch (error) {
      console.error('Failed to create card:', error)
    }
  }

  const handleUpdateCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCard) return
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    try {
      const response = await fetch(`/api/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          type: formData.get('type'),
          lastFour: formData.get('lastFour'),
          color: formData.get('color'),
        }),
      })
      
      if (response.ok) {
        await fetchCards()
        setEditDialogOpen(false)
        setEditingCard(null)
      }
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return
    
    try {
      const response = await fetch(`/api/cards/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchCards()
      }
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }

  const cardTypeOptions = [
    { value: 'credit', label: 'Credit Card' },
    { value: 'debit', label: 'Debit Card' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'current', label: 'Current Account' },
  ]

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', className: 'bg-blue-500' },
    { value: '#10B981', label: 'Green', className: 'bg-green-500' },
    { value: '#8B5CF6', label: 'Purple', className: 'bg-purple-500' },
    { value: '#F59E0B', label: 'Amber', className: 'bg-amber-500' },
    { value: '#EF4444', label: 'Red', className: 'bg-red-500' },
    { value: '#6B7280', label: 'Gray', className: 'bg-gray-500' },
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Cards</h1>
        <p className="text-muted-foreground">Manage your bank cards and view statement analysis</p>
      </div>

      {cards.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No cards yet</CardTitle>
            <CardDescription>Add your first card to start tracking bank statements</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <CreditCard className="h-24 w-24 text-muted-foreground" />
          </CardContent>
          <CardFooter>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateCard}>
                  <DialogHeader>
                    <DialogTitle>Add New Card</DialogTitle>
                    <DialogDescription>
                      Enter your card details to start tracking statements
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Card Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Chase Freedom"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Card Type</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select card type" />
                        </SelectTrigger>
                        <SelectContent>
                          {cardTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastFour">Last 4 Digits (Optional)</Label>
                      <Input
                        id="lastFour"
                        name="lastFour"
                        placeholder="1234"
                        maxLength={4}
                        pattern="[0-9]{4}"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="color">Card Color</Label>
                      <Select name="color" defaultValue="#3B82F6">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded ${option.className}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Card</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {cards.map((card) => (
              <Card key={card.id} className="relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundColor: card.color }}
                />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{card.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{card.type}</Badge>
                        {card.lastFour && (
                          <span className="text-xs">•••• {card.lastFour}</span>
                        )}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/cards/${card.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingCard(card)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Card
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Card
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{card._count?.statements || 0} statements</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/cards/${card.id}`}>
                      View Statements
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Add New Card</CardTitle>
                <CardDescription>Track another bank account</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <Plus className="h-24 w-24 text-muted-foreground" />
              </CardContent>
              <CardFooter>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateCard}>
                      <DialogHeader>
                        <DialogTitle>Add New Card</DialogTitle>
                        <DialogDescription>
                          Enter your card details to start tracking statements
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Card Name</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="e.g., Chase Freedom"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="type">Card Type</Label>
                          <Select name="type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select card type" />
                            </SelectTrigger>
                            <SelectContent>
                              {cardTypeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastFour">Last 4 Digits (Optional)</Label>
                          <Input
                            id="lastFour"
                            name="lastFour"
                            placeholder="1234"
                            maxLength={4}
                            pattern="[0-9]{4}"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="color">Card Color</Label>
                          <Select name="color" defaultValue="#3B82F6">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`h-4 w-4 rounded ${option.className}`} />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Add Card</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
          
          {/* Edit Dialog */}
          {editingCard && (
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <form onSubmit={handleUpdateCard}>
                  <DialogHeader>
                    <DialogTitle>Edit Card</DialogTitle>
                    <DialogDescription>
                      Update your card details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Card Name</Label>
                      <Input
                        id="edit-name"
                        name="name"
                        defaultValue={editingCard.name}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-type">Card Type</Label>
                      <Select name="type" defaultValue={editingCard.type} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cardTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-lastFour">Last 4 Digits (Optional)</Label>
                      <Input
                        id="edit-lastFour"
                        name="lastFour"
                        defaultValue={editingCard.lastFour || ''}
                        maxLength={4}
                        pattern="[0-9]{4}"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-color">Card Color</Label>
                      <Select name="color" defaultValue={editingCard.color}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded ${option.className}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  )
}