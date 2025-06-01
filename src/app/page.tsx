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

export default function Home() {
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
        form.reset()
        setDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to create card:', error)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchCards()
      }
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }

  const handleUpdateCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCard) {
      return
    }
    
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
        form.reset()
        setEditDialogOpen(false)
        setEditingCard(null)
      }
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Your Cards</h1>
        <p className="text-muted-foreground">
          Manage your credit and debit cards, upload statements, and track your spending.
        </p>
      </div>
      
      <div className="mb-8">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Card</DialogTitle>
              <DialogDescription>
                Enter your card details below. You can upload statements after adding the card.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCard}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Card Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Chase Sapphire"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Card Type</Label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select card type</option>
                    <option value="CREDIT">Credit Card</option>
                    <option value="DEBIT">Debit Card</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastFour">Last 4 Digits</Label>
                  <Input
                    id="lastFour"
                    name="lastFour"
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Card Color</Label>
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue="#3B82F6"
                    className="w-24"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Card</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Card</DialogTitle>
              <DialogDescription>
                Update your card details below.
              </DialogDescription>
            </DialogHeader>
            {editingCard && (
              <form onSubmit={handleUpdateCard}>
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
                    <select
                      id="edit-type"
                      name="type"
                      defaultValue={editingCard.type}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="CREDIT">Credit Card</option>
                      <option value="DEBIT">Debit Card</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lastFour">Last 4 Digits</Label>
                    <Input
                      id="edit-lastFour"
                      name="lastFour"
                      defaultValue={editingCard.lastFour || ''}
                      maxLength={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-color">Card Color</Label>
                    <Input
                      id="edit-color"
                      name="color"
                      type="color"
                      defaultValue={editingCard.color}
                      className="w-24"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Update Card</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <Card key={card.id} className="overflow-hidden group hover:shadow-lg hover:scale-[1.02] transition-all relative cursor-pointer">
            <div className="h-1.5" style={{ backgroundColor: card.color }} />
            <CardContent className="p-4">
              <Link href={`/cards/${card.id}`} className="absolute inset-0 z-0">
                <span className="sr-only">View {card.name}</span>
              </Link>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-sm">{card.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {card.lastFour && `•••• ${card.lastFour}`}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 relative z-10">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/cards/${card.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setEditingCard(card)
                      setEditDialogOpen(true)
                    }}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {card.type}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <FileText className="h-3 w-3 mr-1" />
                  {card._count?.statements || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {cards.length === 0 && (
          <div className="col-span-full text-center py-12">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No cards added yet. Add your first card to get started.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Card
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}