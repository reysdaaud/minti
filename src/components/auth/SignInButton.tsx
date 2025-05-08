'use client';

import { Button } from '@/components/ui/button';
import { auth, GoogleAuthProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

const SignInButton: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Google.',
      });
      router.push('/'); // Redirect to home page after successful sign-in
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: 'Sign In Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
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
