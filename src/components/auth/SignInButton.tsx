'use client';

import { Button } from '@/components/ui/button';
import { auth, GoogleAuthProvider } from '@/lib/firebase';
import { signInWithPopup, type AuthError } from 'firebase/auth';
// import { useRouter } from 'next/navigation'; // No longer needed here
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

const SignInButton: React.FC = () => {
  // const router = useRouter(); // No longer needed here
  const { toast } = useToast();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Google.',
      });
      // router.push('/'); // Removed: SignInPage will handle redirection
    } catch (error) {
      const authError = error as AuthError;
      // Don't show error toast if user closed the popup
      if (authError.code === 'auth/popup-closed-by-user' || authError.code === 'auth/cancelled-popup-request') {
        console.info('Sign-in popup closed by user.');
        return;
      }
      
      console.error('Error signing in with Google:', authError);
      toast({
        title: 'Sign In Failed',
        description: authError.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button onClick={handleSignIn} className="w-full">
      <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
    </Button>
  );
};

export default SignInButton;
