import { CreditCard, Plus, Eye, Edit2, Trash2 } from 'lucide-react'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { PrismaClient } from '@prisma/client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CardActions } from '@/components/Cards/CardActions'
import { CreateCardDialog } from '@/components/Cards/CreateCardDialog'

const prisma = new PrismaClient()

async function getCards() {
  const cards = await prisma.card.findMany({
    include: {
      _count: {
        select: { statements: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  return cards
}

export default async function CardsPage() {
  const cards = await getCards()

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Cards</h1>
          <p className="text-muted-foreground">Manage your credit and debit cards</p>
        </div>
        <CreateCardDialog />
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cards added yet</h3>
            <p className="text-muted-foreground mb-4">Add your first card to start tracking statements</p>
            <CreateCardDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const cardIcon = card.type === 'credit' ? (
              <CreditCard className="h-6 w-6" />
            ) : (
              <FileText className="h-6 w-6" />
            )

            return (
              <Card key={card.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-3 rounded-lg text-white"
                        style={{ backgroundColor: card.color }}
                      >
                        {cardIcon}
                      </div>
                      <div>
                        <CardTitle>{card.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="secondary">{card.type}</Badge>
                          {card.lastFour && (
                            <span className="text-xs">•••• {card.lastFour}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <CardActions card={card} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Statements</span>
                    <span className="font-medium">{card._count.statements}</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50">
                  <Link href={`/cards/${card.id}`} className="w-full">
                    <Button variant="ghost" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}