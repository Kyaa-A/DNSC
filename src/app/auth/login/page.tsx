import React from 'react';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { Toaster } from '@/components/ui/sonner';
import { GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login - DNSC Attendance System',
  description: 'Sign in to access the DNSC Attendance system',
};

export default function LoginPage() {
  return (
    <div className="relative fixed inset-0 w-screen h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Elements - More subtle for better contrast */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400/5 dark:bg-primary-400/3 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-400/5 dark:bg-secondary-400/3 rounded-full blur-3xl" />
      
      {/* Subtle overlay to enhance form contrast */}
      <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/20 pointer-events-none" />
      
      <div className="w-full max-w-md px-4 space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
            <GraduationCap className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DNSC Attendance</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Davao del Norte State College</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl hover:shadow-3xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-700 transition-all duration-300">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome Back</CardTitle>
            <CardDescription className="text-base text-gray-600 dark:text-gray-300">
              Sign in to your account to access the attendance system
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 Davao del Norte State College - DNSC</p>
        </div>
      </div>
      <Toaster richColors />
    </div>
  );
}