// src/app/page.tsx
'use client';

import TopHeader from '@/components/exchange/TopHeader';
import UserActions from '@/components/exchange/UserActions';
import MarketSection from '@/components/exchange/MarketSection';
import BottomNavBar from '@/components/exchange/BottomNavBar';
import CardBalance from '@/components/exchange/CardBalance';
import SoundsPlayer from '@/components/sounds/SoundsPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter as useNextRouter } from 'next/navigation'; // Changed to useNextRouter to avoid conflict
import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export default function CryptoExchangePage() {
  const { user, loading: authLoading } = useAuth();
  const nextRouter = useNextRouter(); // Renamed to avoid conflict with internal router variable
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [coinBalance, setCoinBalance] = useState(0); 
  const [activeTab, setActiveTab] = useState('Home');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [userDocLoading, setUserDocLoading] = useState(true);


  // Fetch initial coin balance and listen for real-time updates
  useEffect(() => {
    if (user) {
      setUserDocLoading(true);
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setCoinBalance(docSnap.data().coins || 0);
        } else {
          // This case should ideally be handled during user creation/login
          setCoinBalance(0); 
          console.warn("User document not found for balance updates.");
        }
        setUserDocLoading(false);
      }, (error) => {
        console.error("Error listening to user balance:", error);
        toast({ title: "Error", description: "Could not load your coin balance.", variant: "destructive" });
        setUserDocLoading(false);
      });
      return () => unsubscribe(); // Cleanup listener on unmount
    } else {
      setCoinBalance(0); // Reset balance if no user
      setUserDocLoading(false);
    }
  }, [user, toast]);


  // Handle Paystack callback verification
  const handleVerifyPayment = useCallback(async (paymentReference: string) => {
    setIsVerifyingPayment(true);
    console.log('Detected payment reference for verification:', paymentReference);
    const backendVerifyUrl = process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL_VERIFY || `http://localhost:5000/paystack/verify/${paymentReference}`;

    try {
      const response = await fetch(backendVerifyUrl, { // Use correct backend URL
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.status && data.data && data.data.status === 'success') {
        toast({
          title: 'Payment Successful!',
          description: `Your purchase of ${data.data.metadata?.packageName || 'coins'} was successful. Your balance has been updated.`,
          variant: 'default',
          duration: 7000,
        });
        // Balance updates via Firestore listener, no need to setCoinBalance here directly
      } else {
        toast({
          title: 'Payment Verification Failed',
          description: data.message || 'There was an issue verifying your payment. Please contact support if debited.',
          variant: 'destructive',
          duration: 7000,
        });
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Payment Verification Error',
        description: error.message || 'An unexpected error occurred while verifying your payment.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingPayment(false);
      // Clean the URL to prevent re-processing on refresh
      const currentPath = window.location.pathname;
      nextRouter.replace(currentPath, { scroll: false }); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [toast, nextRouter]); // Removed router from deps as nextRouter is stable, add specific deps if needed

  useEffect(() => {
    const paymentReference = searchParams.get('trxref') || searchParams.get('reference');
    if (paymentReference && user && !isVerifyingPayment) {
      // Check if already processed in this session to avoid multiple calls from strict mode double effect run
      if (sessionStorage.getItem('lastVerifiedRef') !== paymentReference) {
        sessionStorage.setItem('lastVerifiedRef', paymentReference);
        handleVerifyPayment(paymentReference);
      } else {
         // Optional: If already processed this session, clear URL faster.
         const currentPath = window.location.pathname;
         if (searchParams.get('trxref') || searchParams.get('reference')) { // Check if params still exist
            nextRouter.replace(currentPath, { scroll: false });
         }
      }
    }
  }, [searchParams, user, isVerifyingPayment, handleVerifyPayment, nextRouter]);


  if (authLoading || (!user && !authLoading) || userDocLoading) { // Show loader if auth is loading, or user not loaded and not in error, or user doc loading
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user && !authLoading) { // If not loading and no user, redirect to sign-in
     // This should ideally be handled by a protected route HOC or middleware
     // For now, a simple client-side redirect if user is null after loading.
     if (typeof window !== "undefined") {
      nextRouter.push('/auth/signin');
     }
     return null; // Render nothing while redirecting
  }


  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <>
            <Card className="mb-4 bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Your Sondar Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-foreground">
                  Coin Balance: {coinBalance.toLocaleString()} Coins
                </p>
                 <p className="text-sm text-muted-foreground mt-1">
                  Manage your digital assets with ease.
                </p>
              </CardContent>
            </Card>
            <CardBalance />
            <UserActions setCoinBalance={setCoinBalance} /> 
            <MarketSection />
          </>
        );
      case 'Sounds':
        return <SoundsPlayer />;
      case 'Markets':
        return <MarketSection />
      default:
        return (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Content for {activeTab} tab.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopHeader />
      <main className="flex-grow overflow-y-auto pb-16 md:pb-0 px-4 pt-3">
        {renderContent()}
      </main>
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
