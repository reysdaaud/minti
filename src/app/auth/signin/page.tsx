'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AuthError } from 'firebase/auth';

export default function SignInPage() {
  const { user, loading: authLoading, signInWithGoogle, userProfile } = useAuth(); // Removed signInWithFacebook
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect based on profile status AFTER user object and profile are loaded
      if (userProfile) {
        if (!userProfile.profileComplete) {
          router.replace('/profile/setup');
        } else if (!userProfile.preferredCategories || userProfile.preferredCategories.length === 0) {
          router.replace('/profile/preferences');
        } else {
          router.replace('/');
        }
      }
      // If userProfile is still loading, wait for the AuthProvider's redirect or next effect run
    }
  }, [user, authLoading, userProfile, router]);


  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Google.',
      });
      // Redirection is handled by useEffect or AuthProvider
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/popup-closed-by-user' || authError.code === 'auth/cancelled-popup-request') {
        console.info('Google Sign-in popup closed by user.');
        return;
      }
      console.error('Error signing in with Google:', authError);
      toast({
        title: 'Sign In Failed',
        description: authError.message || 'An unexpected error occurred with Google sign-in.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // If user exists and auth is not loading, useEffect should handle redirection.
  // Show a loader to prevent flash of sign-in form if redirection is pending.
  if (user && !authLoading) {
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
            Access your KeyFind account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGoogleSignIn} className="w-full">
            <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
          </Button>
          {/* Facebook button removed */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
