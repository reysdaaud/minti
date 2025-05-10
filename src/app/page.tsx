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
          setCoinBalance(0); 
          console.warn("User document not found for balance updates. This might be okay if user is new and backend will create it upon payment verification.");
        }
        setUserDocLoading(false);
      }, (error) => {
        console.error("Error listening to user balance:", error);
        toast({ title: "Error", description: "Could not load your coin balance.", variant: "destructive" });
        setUserDocLoading(false);
      });
      return () => unsubscribe(); 
    } else {
      setCoinBalance(0); 
      setUserDocLoading(false);
    }
  }, [user, toast]);


  // Handle Paystack callback verification
  const handleVerifyPayment = useCallback(async (paymentReference: string) => {
    if (isVerifyingPayment) return; // Prevent multiple simultaneous verifications
    setIsVerifyingPayment(true);
    console.log('Detected payment reference for verification:', paymentReference);
    
    // Use the environment variable for the backend URL, or a default for local dev
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
        // Balance updates via Firestore listener, no need to setCoinBalance here directly
        // The backend server.js now handles updating Firestore.
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
      // Clean the URL to prevent re-processing on refresh
      const currentPath = window.location.pathname;
      // Create a new URL object to safely remove search params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('trxref');
      newUrl.searchParams.delete('reference');
      nextRouter.replace(newUrl.pathname + newUrl.search, { scroll: false }); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [toast, nextRouter]); // Removed isVerifyingPayment from deps to avoid re-triggering if it changes during execution

  useEffect(() => {
    const paymentReference = searchParams.get('trxref') || searchParams.get('reference');
    // Only verify if user is loaded, reference exists, and not already verifying
    if (paymentReference && user && !authLoading && !isVerifyingPayment) {
      // Simple session flag to prevent re-verification on fast refresh / strict mode double call
      const verificationKey = `verified_${paymentReference}`;
      if (sessionStorage.getItem(verificationKey) !== 'true') {
        sessionStorage.setItem(verificationKey, 'true');
        handleVerifyPayment(paymentReference);
      } else {
        // If already processed this session, clear URL faster.
        const currentPath = window.location.pathname;
        const newUrl = new URL(window.location.href);
        if (newUrl.searchParams.get('trxref') || newUrl.searchParams.get('reference')) { 
            newUrl.searchParams.delete('trxref');
            newUrl.searchParams.delete('reference');
            nextRouter.replace(newUrl.pathname + newUrl.search, { scroll: false });
        }
      }
    }
  }, [searchParams, user, authLoading, isVerifyingPayment, handleVerifyPayment, nextRouter]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      if (typeof window !== "undefined") { // Ensure this runs only on client
        nextRouter.push('/auth/signin');
      }
    }
  }, [user, authLoading, nextRouter]);


  if (authLoading || userDocLoading) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is null and auth is not loading, useEffect above will handle redirection.
  // Return null or a loader here to prevent rendering the page content before redirection.
  if (!user && !authLoading) { 
     return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
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

    
