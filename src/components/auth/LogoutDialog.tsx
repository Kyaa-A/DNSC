'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useAuth, useUser } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

export function LogoutDialog({ open, onOpenChange, redirectTo }: LogoutDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();
  const user = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call the signOut function from useAuth
      await signOut();
      
      // Show success message
      toast.success('Successfully logged out');
      
      // Close the dialog
      onOpenChange(false);
      
      // Determine redirect based on user role or custom redirect
      let redirect = redirectTo || '/auth/login';
      
      if (!redirectTo) {
        const userRole = user?.role;
        if (userRole === 'organizer') {
          redirect = '/auth/login'; // Organizers can use the same login page
        } else if (userRole === 'admin') {
          redirect = '/auth/login';
        }
      }
      
      // Redirect to appropriate login page
      router.push(redirect);
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to log out? You will need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-800">Important</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  Any unsaved changes will be lost. Make sure to save your work before logging out.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
