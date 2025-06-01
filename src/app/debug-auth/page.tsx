'use client'

import { useUser, useAuth, useClerk } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DebugAuthPage() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser()
  const { userId, sessionId, isLoaded: authLoaded } = useAuth()
  const { signOut } = useClerk()
  const router = useRouter()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Info</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                userLoaded,
                isSignedIn,
                userId: user?.id,
                email: user?.primaryEmailAddress?.emailAddress,
                firstName: user?.firstName,
                lastName: user?.lastName,
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                authLoaded,
                userId,
                sessionId,
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push('/')}>
              Go to Home
            </Button>
            <Button onClick={() => router.push('/sign-in')}>
              Go to Sign In
            </Button>
            <Button 
              variant="destructive"
              onClick={() => signOut(() => router.push('/sign-in'))}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}