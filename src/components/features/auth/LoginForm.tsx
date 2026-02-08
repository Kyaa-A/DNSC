'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { getAuthErrorMessage, logAuthError } from '@/lib/auth/error-handling';
// import { getRoleDisplayName } from '@/lib/utils/role-utils';

interface LoginFormProps {
  redirectTo?: string;
  showPasswordReset?: boolean;
}

export function LoginForm({ redirectTo, showPasswordReset = true }: LoginFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginInput) {
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await signIn({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        const errorMessage = getAuthErrorMessage(result.error);
        setError(errorMessage);
        
        // Log the error for monitoring
        logAuthError(result.error, {
          action: 'login_attempt',
          ipAddress: 'client-side',
        });
        
        toast.error('Login Failed', { 
          description: errorMessage
        });
        return;
      }

      // Show success message immediately
      toast.success('Login Successful', { 
        description: 'Redirecting to your dashboard...'
      });

      // For role-based redirect, we'll let the auth callback handle it
      // or redirect to a generic success page that will handle the role check
      const finalRedirect = redirectTo || '/auth/success';
      router.push(finalRedirect);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      
      // Log the error for monitoring
      logAuthError(error, {
        action: 'login_attempt',
        ipAddress: 'client-side',
      });
      
      toast.error('Login Failed', { 
        description: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Only use submitting state for loading - don't wait for auth session check on login page
  const isLoading = submitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="admin@dtp.edu.my"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showPasswordReset && (
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm px-0"
              onClick={() => router.push('/auth/reset-password')}
              disabled={isLoading}
            >
              Forgot your password?
            </Button>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </Form>
  );
}

export default LoginForm; 