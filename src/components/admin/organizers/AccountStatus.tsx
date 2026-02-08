'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  UserCheck, 
  UserX, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface AccountStatusProps {
  organizer: {
    id: string
    email: string
    fullName: string | null
    role: string
    isActive: boolean
    createdAt: Date
    lastLoginAt: Date | null
  }
  onStatusChange?: (updatedOrganizer: {
    id: string
    email: string
    fullName: string | null
    role: string
    isActive: boolean
    createdAt: Date
    lastLoginAt: Date | null
  }) => void
  className?: string
}

export function AccountStatus({ organizer, onStatusChange, className }: AccountStatusProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleStatusToggle = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/organizers/${organizer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !organizer.isActive,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update organizer status')
      }

      const action = organizer.isActive ? 'deactivated' : 'activated'
      toast.success(`Organizer ${action} successfully`)

      if (onStatusChange) {
        onStatusChange(result.organizer)
      }

      setIsDialogOpen(false)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (organizer.isActive) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      )
    }
  }

  const getStatusIcon = () => {
    return organizer.isActive ? (
      <UserCheck className="h-5 w-5 text-green-600" />
    ) : (
      <UserX className="h-5 w-5 text-red-600" />
    )
  }

  const getActionButton = () => {
    const isActivating = !organizer.isActive
    const buttonText = isActivating ? 'Activate Account' : 'Deactivate Account'
    const buttonVariant = isActivating ? 'default' : 'destructive'

    return (
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        disabled={isLoading}
        className="min-w-[140px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isActivating ? 'Activating...' : 'Deactivating...'}
          </>
        ) : (
          <>
            {isActivating ? (
              <UserCheck className="h-4 w-4 mr-2" />
            ) : (
              <UserX className="h-4 w-4 mr-2" />
            )}
            {buttonText}
          </>
        )}
      </Button>
    )
  }

  const getConfirmationDialog = () => {
    const isActivating = !organizer.isActive
    const action = isActivating ? 'activate' : 'deactivate'
    const actionCapitalized = isActivating ? 'Activate' : 'Deactivate'

    return (
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isActivating ? (
                <UserCheck className="h-5 w-5 text-green-600" />
              ) : (
                <UserX className="h-5 w-5 text-red-600" />
              )}
              {actionCapitalized} Organizer Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to {action} the account for{' '}
                <span className="font-semibold">
                  {organizer.fullName || organizer.email}
                </span>?
              </p>
              
              {isActivating ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">This will:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Allow the organizer to access the system</li>
                        <li>Enable login and session management</li>
                        <li>Grant access to assigned events</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">This will:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Prevent the organizer from logging in</li>
                        <li>Revoke access to all assigned events</li>
                        <li>Disable session management capabilities</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusToggle}
              disabled={isLoading}
              className={isActivating ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {actionCapitalized}ing...
                </>
              ) : (
                <>
                  {isActivating ? (
                    <UserCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  {actionCapitalized} Account
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          Account Status
        </CardTitle>
        <CardDescription>
          Manage organizer account access and permissions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Status Display */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium text-sm">Current Status</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge()}
                <span className="text-xs text-muted-foreground">
                  {organizer.isActive 
                    ? 'Account is active and accessible'
                    : 'Account is disabled and inaccessible'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{organizer.email}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Role:</span>
            <Badge variant="outline" className="capitalize">
              {organizer.role}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(organizer.createdAt).toLocaleDateString()}</span>
          </div>
          
          {organizer.lastLoginAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Login:</span>
              <span>{new Date(organizer.lastLoginAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          {getActionButton()}
        </div>

        {/* Information Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {organizer.isActive 
              ? 'Active organizers can log in, manage assigned events, and scan attendance.'
              : 'Inactive organizers cannot access the system or perform any actions.'
            }
          </AlertDescription>
        </Alert>
      </CardContent>

      {/* Confirmation Dialog */}
      {getConfirmationDialog()}
    </Card>
  )
}
