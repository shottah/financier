import { syncUserWithDatabase } from '@/lib/user-sync'
import DashboardPage from './dashboard-page'

export default async function Home() {
  // Sync user with database on page load
  await syncUserWithDatabase()
  
  return <DashboardPage />
}