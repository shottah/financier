'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card as CardType } from '@/types'

interface CardSelectorProps {
  cards: CardType[]
  selectedCardId: string
}

export function CardSelector({ cards, selectedCardId }: CardSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const handleCardChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('card')
    } else {
      params.set('card', value)
    }
    router.push(`/analytics?${params.toString()}`)
  }
  
  return (
    <Select value={selectedCardId} onValueChange={handleCardChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a card" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            All Cards
          </div>
        </SelectItem>
        {cards.map(card => (
          <SelectItem key={card.id} value={card.id}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
              {card.name} {card.lastFour && `(•••• ${card.lastFour})`}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}