// src/app/page.tsx
'use client';

import TopHeader from '@/components/exchange/TopHeader';
import UserActions from '@/components/exchange/UserActions';
import MarketSection from '@/components/exchange/MarketSection';
import BottomNavBar from '@/components/exchange/BottomNavBar';
import CardBalance from '@/components/exchange/CardBalance';
import SoundsPlayer from '@/components/sounds/SoundsPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter as useNextRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export default function CryptoExchangePage() {
  const { user, loading: authLoading } = useAuth();
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [coinBalance, setCoinBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('Home');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [userDocLoading, setUserDocLoading] = useState(true); // For Firestore data


  useEffect(() => {
    if (!authLoading && !user) {
      // Auth state determined, no user, redirect to sign-in
      nextRouter.push('/auth/signin');
    } else if (!authLoading && user) {
      // User is authenticated, proceed to fetch user-specific data
      setUserDocLoading(true); // Start loading user doc data
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setCoinBalance(docSnap.data().coins || 0);
        } else {
          setCoinBalance(0);
          console.warn("User document not found for balance updates. This might be okay if user is new and backend will create it upon payment verification or AuthProvider initializes it.");
        }
        setUserDocLoading(false); // Finished loading user doc data
      }, (error) => {
        console.error("Error listening to user balance:", error);
        toast({ title: "Error", description: "Could not load your coin balance.", variant: "destructive" });
        setUserDocLoading(false); // Finished loading user doc data (with error)
      });
      return () => unsubscribe();
    } else {
      // authLoading is true, or some other initial state.
      // Reset user-specific states if auth is not ready or user is null
      setUserDocLoading(false); 
      setCoinBalance(0);
    }
  }, [user, authLoading, nextRouter, toast]);


  // Handle Paystack callback verification
  const handleVerifyPayment = useCallback(async (paymentReference: string) => {
    if (isVerifyingPayment) return;
    setIsVerifyingPayment(true);
    console.log('Detected payment reference for verification:', paymentReference);

    const backendVerifyUrl = `${process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL || 'http://localhost:5000'}/paystack/verify/${paymentReference}`;

    try {
      const response = await fetch(backendVerifyUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.status && data.data && data.data.status === 'success') {
        toast({
          title: 'Payment Successful!',
          description: `Your purchase was successful. Your balance will update shortly.`,
          variant: 'default',
          duration: 7000,
        });
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
        description: error.message || 'An unexpected error occurred while verifying your payment. Ensure the backend server is running.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingPayment(false);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('trxref');
      newUrl.searchParams.delete('reference');
      nextRouter.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, nextRouter]); 

  useEffect(() => {
    const paymentReference = searchParams.get('trxref') || searchParams.get('reference');
    if (paymentReference && user && !authLoading && !isVerifyingPayment) {
      const verificationKey = `verified_${paymentReference}`;
      if (sessionStorage.getItem(verificationKey) !== 'true') {
        sessionStorage.setItem(verificationKey, 'true');
        handleVerifyPayment(paymentReference);
      } else {
        const newUrl = new URL(window.location.href);
        if (newUrl.searchParams.get('trxref') || newUrl.searchParams.get('reference')) {
            newUrl.searchParams.delete('trxref');
            newUrl.searchParams.delete('reference');
            nextRouter.replace(newUrl.pathname + newUrl.search, { scroll: false });
        }
      }
    }
  }, [searchParams, user, authLoading, isVerifyingPayment, handleVerifyPayment, nextRouter]);


  if (authLoading) {
    // Primary auth check still in progress
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading authentication...</p>
      </div>
    );
  }

  // At this point, authLoading is false.
  // If !user, the useEffect for redirection should have initiated a redirect.
  // Show a loader while that redirect is in progress or if user is null.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting to sign-in...</p>
      </div>
    );
  }

  // User is authenticated (user is not null). Now check if user-specific document data is loading.
  if (userDocLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  // All checks passed, user authenticated and their specific data (like balance) is loaded or attempted.
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
