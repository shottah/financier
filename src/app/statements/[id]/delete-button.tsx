'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DeleteButtonProps {
  statementId: string
  cardId: string
}

export default function DeleteButton({ statementId, cardId }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/statements/${statementId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Statement deleted',
          description: 'The statement and all associated transactions have been removed.',
        })
        setIsOpen(false)
        router.push(`/cards/${cardId}`)
      } else {
        const error = await response.json()
        toast({
          title: 'Delete failed',
          description: error.error || 'Failed to delete statement',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the statement',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isDeleting}
          className="px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Statement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this statement? This action cannot be undone and will permanently remove the statement and all associated transactions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}