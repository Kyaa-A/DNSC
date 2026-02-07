'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/loading';
import { CheckCircle } from 'lucide-react';

export default function AuthSuccessPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Get user role and redirect accordingly
      const userRole = user.role;
      
      let redirectPath = '/admin/dashboard'; // Default fallback
      
      switch (userRole) {
        case 'admin':
          redirectPath = '/admin/dashboard';
          break;
        case 'organizer':
          redirectPath = '/organizer/sessions';
          break;
        default:
          redirectPath = '/admin/dashboard';
      }
      
      // Redirect after a short delay to show the success message
      const timer = setTimeout(() => {
        router.replace(redirectPath);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50/40 via-white to-primary-50/40 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
      <Card className="w-full sm:w-[560px] md:w-[640px] bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Spinner size="md" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Completing login...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const userRole = user.role;
  const roleDisplayName = userRole === 'admin' ? 'Administrator' : 
                         userRole === 'organizer' ? 'Organizer' : 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/40 via-white to-primary-50/40 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
      <Card className="w-full sm:w-[560px] md:w-[640px] bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl text-gray-900 dark:text-gray-100">Login Successful</CardTitle>
          <CardDescription className="text-base text-gray-600 dark:text-gray-400">
            Welcome back, {roleDisplayName}. Redirecting you to your dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <Spinner size="md" label="Redirecting..." />
        </CardContent>
      </Card>
    </div>
  );
}
