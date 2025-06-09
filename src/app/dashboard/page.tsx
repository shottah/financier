import { requireUser } from '@/lib/auth'
import DashboardContent from './dashboard-content'

export default async function DashboardPage() {
  const user = await requireUser()
  
  return <DashboardContent userId={user.id} />
}