import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function syncUserWithDatabase() {
  const user = await currentUser()
  
  if (!user) {
    return null
  }

  const email = user.primaryEmailAddress?.emailAddress || ''

  // Upsert user - create if doesn't exist, update if does
  const dbUser = await db.user.upsert({
    where: { clerkId: user.id },
    update: {
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    },
    create: {
      clerkId: user.id,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    }
  })

  return dbUser
}