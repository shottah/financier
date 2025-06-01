import { CreditCard } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export default function CardNotFound() {
  return (
    <div className="container mx-auto p-8">
      <Card className="text-center py-12">
        <CardContent>
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Card not found</p>
        </CardContent>
      </Card>
    </div>
  )
}