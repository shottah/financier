'use client'

import { useState, useEffect } from 'react'
import { Trash2, User, CreditCard, FileText, Bell, Shield, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [deletionStatus, setDeletionStatus] = useState<string>('')
  const [stats, setStats] = useState<any>(null)
  const [isReprocessing, setIsReprocessing] = useState(false)
  const [reprocessModalOpen, setReprocessModalOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Fetch user stats on mount
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleDelete = async (type: string) => {
    setDeleteType(type)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    setDeleteProgress(0)
    setDeletionStatus('Initializing deletion...')
    
    try {
      // Simulate progress steps for better UX
      const progressSteps = [
        { progress: 20, status: 'Analyzing data to delete...' },
        { progress: 40, status: 'Removing transactions...' },
        { progress: 60, status: 'Removing statements...' },
        { progress: 80, status: 'Finalizing deletion...' }
      ]
      
      // Start the deletion request
      const deletePromise = fetch(`/api/user/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteType }),
      })
      
      // Simulate progress updates
      for (const step of progressSteps) {
        setDeleteProgress(step.progress)
        setDeletionStatus(step.status)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Wait for the actual deletion to complete
      const response = await deletePromise
      
      if (!response.ok) throw new Error('Delete failed')
      
      // Complete the progress
      setDeleteProgress(100)
      setDeletionStatus('Deletion completed!')
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Show success notification
      toast({
        title: "Success",
        description: `Successfully deleted ${getDeleteTypeFormatted(deleteType)}`,
        variant: "default",
      })
      
      // Refresh stats
      fetchStats()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteProgress(0)
      setDeletionStatus('')
      setDeleteModalOpen(false)
    }
  }

  const handleReprocessAll = async () => {
    setReprocessModalOpen(true)
  }

  const confirmReprocess = async () => {
    setIsReprocessing(true)
    
    try {
      const response = await fetch('/api/statements/reprocess-all', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Reprocess failed')
      
      const result = await response.json()
      
      // Show success notification
      toast({
        title: "Success",
        description: `Successfully reprocessed ${result.processed} statements`,
        variant: "default",
      })
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Reprocess error:', error)
      toast({
        title: "Error",
        description: "Failed to reprocess statements. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReprocessing(false)
      setReprocessModalOpen(false)
    }
  }

  const getDeleteDescription = (type: string): string => {
    switch (type) {
      case 'all-cards':
        return 'all cards and their associated statements and transactions'
      case 'all-statements':
        return 'all statements and their transactions'
      case 'all-notifications':
        return 'all notifications'
      case 'all-data':
        return 'ALL data including cards, statements, transactions, and notifications'
      default:
        return type.replace('-', ' ')
    }
  }
  
  const getDeleteTypeFormatted = (type: string): string => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account and data</p>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  View and update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-muted-foreground">user@example.com</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-muted-foreground">John Doe</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Member Since</label>
                  <p className="text-muted-foreground">January 2024</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Deleting data is permanent and cannot be undone. Please be careful.
              </AlertDescription>
            </Alert>
            
            {/* Data Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Data Overview</CardTitle>
                <CardDescription>
                  Current data in your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cards</p>
                      <p className="text-2xl font-bold">{stats.cards}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Statements</p>
                      <p className="text-2xl font-bold">{stats.statements}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">{stats.transactions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Notifications</p>
                      <p className="text-2xl font-bold">{stats.notifications}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading stats...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reprocess Statements</CardTitle>
                <CardDescription>
                  Reprocess all your bank statements with AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Reprocess All Statements</p>
                      <p className="text-sm text-muted-foreground">
                        This will re-analyze all statements with the AI
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReprocessAll}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reprocess
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delete Cards</CardTitle>
                <CardDescription>
                  Remove all cards and their associated statements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">All Cards</p>
                      <p className="text-sm text-muted-foreground">
                        This will delete all cards, statements, and transactions
                      </p>
                    </div>
                  </div>
                  <DeleteButton onClick={() => handleDelete('all-cards')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delete Statements</CardTitle>
                <CardDescription>
                  Remove all statements and their transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">All Statements</p>
                      <p className="text-sm text-muted-foreground">
                        This will delete all statements and transactions
                      </p>
                    </div>
                  </div>
                  <DeleteButton onClick={() => handleDelete('all-statements')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delete Notifications</CardTitle>
                <CardDescription>
                  Clear all notification history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">All Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        This will clear your notification history
                      </p>
                    </div>
                  </div>
                  <DeleteButton onClick={() => handleDelete('all-notifications')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delete Everything</CardTitle>
                <CardDescription>
                  Remove all data associated with your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Delete All Data</p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <DeleteButton 
                    onClick={() => handleDelete('all-data')} 
                    variant="destructive"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Notification settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Security settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {getDeleteDescription(deleteType)}? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {/* Progress section - only shown during deletion */}
            {isDeleting && (
              <div className="space-y-3 py-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {deletionStatus}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(deleteProgress)}%
                  </span>
                </div>
                <Progress 
                  value={deleteProgress} 
                  className="h-2"
                />
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reprocess Confirmation Dialog */}
        <Dialog open={reprocessModalOpen} onOpenChange={setReprocessModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Reprocessing</DialogTitle>
              <DialogDescription>
                Are you sure you want to reprocess all statements? This will re-analyze all your bank statements with AI and may take a few minutes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReprocessModalOpen(false)}
                disabled={isReprocessing}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReprocess}
                disabled={isReprocessing}
              >
                {isReprocessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Reprocessing...
                  </>
                ) : (
                  'Reprocess'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function DeleteButton({ 
  onClick, 
  variant = "outline" 
}: { 
  onClick: () => void
  variant?: "outline" | "destructive"
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  )
}