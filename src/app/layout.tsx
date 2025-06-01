import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { NavigationWithDrawer } from '@/components/navigation-with-drawer'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bank Statement Analyzer',
  description: 'Analyze your bank statements and get insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavigationWithDrawer />
        <main>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}