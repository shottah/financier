'use client'

import { format } from 'date-fns'
import { 
  CreditCard, 
  FileText, 
  BarChart, 
  Plus, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Menu,
  Settings,
  Home,
  TrendingUp,
  Receipt,
  Folder
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DesktopNavigation } from '@/components/desktop-navigation'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  description: string
  timestamp: Date
  read: boolean
}

interface Card {
  id: string
  name: string
  type: string
  lastFour?: string
  color: string
  _count?: {
    statements: number
  }
}

const mainNavItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/cards', label: 'Cards', icon: CreditCard },
  { href: '/analytics', label: 'Analytics', icon: BarChart },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const analyticsSubItems = [
  { href: '/analytics', label: 'Overview', icon: TrendingUp },
  { href: '/analytics?tab=spending', label: 'Spending Analysis', icon: BarChart },
  { href: '/analytics/merchants', label: 'Merchants', icon: Folder },
]

export function NavigationWithDrawer() {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  
  // Fetch notifications and cards on mount and periodically
  useEffect(() => {
    fetchNotifications()
    fetchCards()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        const transformedNotifications = data.map((notif: any) => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          description: notif.description,
          timestamp: new Date(notif.createdAt),
          read: notif.read,
        }))
        setNotifications(transformedNotifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards')
      if (response.ok) {
        const data = await response.json()
        setCards(data)
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error)
    }
  }
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }
  
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        )
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const NotificationDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className="p-4 cursor-pointer focus:bg-accent"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className={cn('font-medium', notification.read && 'text-muted-foreground')}>
                        {notification.title}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <p className={cn(
                      'text-sm mt-1',
                      notification.read ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(notification.timestamp, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopNavigation />
      </div>
      
      {/* Mobile Navigation - Hidden on desktop */}
      <div className="lg:hidden border-b">
        <div className="flex h-16 items-center px-4 container mx-auto">
          {/* Hamburger Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px]">
              <SheetHeader className="pb-6 border-b">
                <SheetTitle>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <span>Bank Analyzer</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              
              {/* Mobile Navigation Content */}
              <nav className="flex flex-col gap-2 mt-6">
                {/* Main Navigation Items */}
                {mainNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                        pathname === item.href && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
                
                {/* Analytics Sub-items */}
                <div className="ml-4 mt-2 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground px-3 py-1">
                    Analytics
                  </div>
                  {analyticsSubItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                          pathname === item.href && 'bg-accent text-accent-foreground'
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
                
                {/* Cards Section */}
                {cards.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="text-xs font-medium text-muted-foreground px-3 py-1 mb-2">
                      Your Cards
                    </div>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {cards.map((card) => (
                        <Link
                          key={card.id}
                          href={`/cards/${card.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: card.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">
                              {card.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {card.type} {card.lastFour && `•••• ${card.lastFour}`}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add Card Button */}
                <div className="border-t pt-4 mt-4">
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add Card
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 ml-2">
            <CreditCard className="h-6 w-6" />
            <span className="text-lg font-bold">Bank Analyzer</span>
          </Link>
          
          {/* Right side items */}
          <div className="ml-auto flex items-center space-x-4">
            <NotificationDropdown />
            
            <Button asChild size="sm">
              <Link href="/">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add Card</span>
              </Link>
            </Button>
            
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
    </>
  )
}