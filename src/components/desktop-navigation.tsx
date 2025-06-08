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
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
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

export function DesktopNavigation() {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  
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

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
      <div className="flex h-16 items-center px-4 container mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-8">
          <CreditCard className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Bank Analyzer</span>
        </Link>
        
        {/* Main Navigation */}
        <NavigationMenu className="hidden md:flex z-50">
          <NavigationMenuList>
            {/* Dashboard */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  href="/" 
                  className={cn(navigationMenuTriggerStyle(), {
                    'bg-accent text-accent-foreground': pathname === '/',
                  })}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            
            {/* Cards Navigation with Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn({
                'bg-accent text-accent-foreground': pathname.startsWith('/cards'),
              })}>
                <CreditCard className="h-4 w-4 mr-2" />
                Cards
              </NavigationMenuTrigger>
              <NavigationMenuContent className="z-50">
                <div className="w-[400px] p-4">
                  <div className="grid gap-3">
                    <div className="grid gap-1">
                      <h4 className="text-sm font-medium leading-none">Manage Cards</h4>
                      <p className="text-sm text-muted-foreground">
                        View and manage your credit cards
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/cards"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            All Cards
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            View all your cards and their details
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      
                      <NavigationMenuLink asChild>
                        <Link
                          href="/"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Card
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Add a new credit card to track
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                    
                    {cards.length > 0 && (
                      <>
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium leading-none mb-2">Your Cards</h4>
                          <div className="grid gap-1 max-h-[200px] overflow-y-auto">
                            {cards.map((card) => (
                              <NavigationMenuLink key={card.id} asChild>
                                <Link
                                  href={`/cards/${card.id}`}
                                  className="block select-none space-y-1 rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-3 h-3 rounded-full flex-shrink-0" 
                                      style={{ backgroundColor: card.color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {card.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {card.type} {card.lastFour && `•••• ${card.lastFour}`}
                                        {card._count?.statements && ` • ${card._count.statements} statements`}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            {/* Analytics Navigation with Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn({
                'bg-accent text-accent-foreground': pathname.startsWith('/analytics'),
              })}>
                <BarChart className="h-4 w-4 mr-2" />
                Analytics
              </NavigationMenuTrigger>
              <NavigationMenuContent className="z-50">
                <div className="w-[350px] p-4">
                  <div className="grid gap-3">
                    <div className="grid gap-1">
                      <h4 className="text-sm font-medium leading-none">Financial Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Analyze your spending patterns and trends
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/analytics"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Overview
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Financial overview and key metrics
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      
                      <NavigationMenuLink asChild>
                        <Link
                          href="/analytics?tab=spending"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none flex items-center">
                            <BarChart className="h-4 w-4 mr-2" />
                            Spending Analysis
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Monthly spending trends and patterns
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      
                      <NavigationMenuLink asChild>
                        <Link
                          href="/analytics/merchants"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none flex items-center">
                            <Folder className="h-4 w-4 mr-2" />
                            Merchants
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Top merchants and spending breakdown
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            {/* Transactions */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  href="/transactions" 
                  className={cn(navigationMenuTriggerStyle(), {
                    'bg-accent text-accent-foreground': pathname === '/transactions',
                  })}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Transactions
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            
            {/* Settings */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link 
                  href="/settings" 
                  className={cn(navigationMenuTriggerStyle(), {
                    'bg-accent text-accent-foreground': pathname === '/settings',
                  })}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Right side items */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Notification Dropdown */}
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
          
          <Button asChild>
            <Link href="/">
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Link>
          </Button>
          
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </div>
  )
}