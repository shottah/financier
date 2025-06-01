import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  // Try to find user in database
  let user = await db.user.findUnique({
    where: { clerkId: userId }
  })

  // In development, sync user if not found (since webhooks don't work locally)
  if (!user && process.env.NODE_ENV === 'development') {
    const clerkUser = await clerkCurrentUser()
    if (clerkUser) {
      user = await db.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        }
      })
    }
  }

  return user
}

export async function requireUser() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}