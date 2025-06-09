import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/user-sync'

export default async function Home() {
  // Sync user with database on page load
  await syncUserWithDatabase()
  
  redirect('/dashboard')
}