import { Skeleton } from '@/components/ui/skeleton'

export default function CardDetailLoading() {
  return (
    <div className="container mx-auto p-8">
      <Skeleton className="h-32 mb-8" />
      <Skeleton className="h-48 mb-8" />
      <Skeleton className="h-96" />
    </div>
  )
}