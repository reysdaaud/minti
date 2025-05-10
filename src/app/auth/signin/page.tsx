'use client';

import SignInButton from '@/components/auth/SignInButton';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state is determined (not loading) and user exists, redirect to home
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // If auth state is still loading, show a loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If auth state is determined (not loading) and user exists,
  // useEffect will handle redirection. Show a loader/blank screen in the meantime
  // to prevent the sign-in form from flashing briefly for an already logged-in user.
  if (user) { // No need to check !loading here, it's covered by the previous `if (loading)` block
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not loading and no user, show the sign-in form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Sign In</CardTitle>
          <CardDescription>
            Access your Crypto Exchange account.
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
