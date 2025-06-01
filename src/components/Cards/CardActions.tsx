'use client'

import { useState } from 'react'
import { Edit2, Trash2, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { EditCardDialog } from './EditCardDialog'
import { Card } from '@/types'

interface CardActionsProps {
  card: Card
}

export function CardActions({ card }: CardActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this card? All associated statements will also be deleted.')) {
      try {
        const response = await fetch(`/api/cards/${card.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Failed to delete card')

        toast({
          title: 'Card deleted',
          description: 'The card has been deleted successfully.',
        })

        router.refresh()
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete card. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-destructive" 
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCardDialog 
        card={card}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  )
}