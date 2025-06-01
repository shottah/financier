'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function SSOCallbackPage() {
  const router = useRouter()
  const { isLoaded, userId } = useAuth()

  useEffect(() => {
    if (isLoaded) {
      if (userId) {
        // User is authenticated, redirect to home
        router.push('/')
      } else {
        // Authentication failed, redirect to sign-in
        router.push('/sign-in')
      }
    }
  }, [isLoaded, userId, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}