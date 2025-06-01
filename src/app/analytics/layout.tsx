export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every 60 seconds

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}