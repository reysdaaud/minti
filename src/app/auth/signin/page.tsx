'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; // Ensure this correctly imports signInWithFacebook
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AuthError } from 'firebase/auth';

// A simple Facebook icon component
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);


export default function SignInPage() {
  const { user, loading: authLoading, signInWithGoogle, signInWithFacebook } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);


  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Google.',
      });
       // Redirection is handled by the useEffect hook or can be forced here
      router.push('/');
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

  const handleFacebookSignIn = async () => {
    try {
      await signInWithFacebook();
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Facebook.',
      });
      // Redirection is handled by the useEffect hook or can be forced here
      router.push('/');
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/popup-closed-by-user' || authError.code === 'auth/cancelled-popup-request') {
        console.info('Facebook Sign-in popup closed by user.');
        return;
      }
      // Handle common Facebook errors like email already in use with another provider
      if (authError.code === 'auth/account-exists-with-different-credential') {
        toast({
          title: 'Sign In Failed',
          description: 'An account already exists with the same email address but different sign-in credentials. Try signing in with Google.',
          variant: 'destructive',
          duration: 7000,
        });
      } else {
        console.error('Error signing in with Facebook:', authError);
        toast({
          title: 'Sign In Failed',
          description: authError.message || 'An unexpected error occurred with Facebook sign-in.',
          variant: 'destructive',
        });
      }
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

  if (user && !authLoading) {
     // This case should ideally be handled by the useEffect redirecting.
     // If still on this page, means redirection hasn't happened yet.
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Sign In</CardTitle>
          <CardDescription>
            Access your KeyFind account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"> {/* Changed space-y-6 to space-y-4 for tighter packing */}
          <Button onClick={handleGoogleSignIn} className="w-full">
            <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
          </Button>
          <Button 
            onClick={handleFacebookSignIn} 
            className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
          >
            <FacebookIcon className="mr-2 h-4 w-4" /> Sign In with Facebook
          </Button>
          <p className="text-xs text-center text-muted-foreground pt-2">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
