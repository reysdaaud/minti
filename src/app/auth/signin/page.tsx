'use client';

import SignInButton from '@/components/auth/SignInButton';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      // User is loaded and exists, redirect to dashboard
      router.replace('/'); // Use replace to avoid sign-in page in history
    }
    // If !authLoading && !user, we stay on this page to show the sign-in form.
    // If authLoading, we show the loader below.
  }, [user, authLoading, router]);

  if (authLoading) {
    // Still determining auth state
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (user) {
    // User is authenticated, useEffect is handling redirection.
    // Show a loader to prevent brief flash of sign-in form.
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // Not loading and no user, show the sign-in form.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Sign In</CardTitle>
          <CardDescription>
            Access your NeoWallet account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SignInButton />
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
