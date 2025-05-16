// src/app/page.tsx
'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import TopHeader from '@/components/exchange/TopHeader';
import UserActions from '@/components/exchange/UserActions';
import MarketSection from '@/components/exchange/MarketSection';
import BottomNavBar from '@/components/exchange/BottomNavBar';
import CardBalance from '@/components/exchange/CardBalance';
import SoundsContent from '@/components/sounds/SoundsContent';
import ArticleContent from '@/components/articles/ArticleContent';
import PlayerBar from '@/components/library/PlayerBar';
import FullScreenPlayer from '@/components/player/FullScreenPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useSearchParams, useRouter as useNextRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Loading page...</p>
    </div>
  );
}

function HomePageContent() {
  const { user, loading: authLoading, userProfile, isUserProfileLoading } = useAuth();
  const { currentTrack, isPlayerOpen } = usePlayer();
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [coinBalance, setCoinBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('Home');
  const [userDocLoading, setUserDocLoading] = useState(true);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);


  useEffect(() => {
    if (!authLoading && !user) {
      nextRouter.replace('/auth/signin');
    } else if (!authLoading && user && !isUserProfileLoading) {
      if (userProfile) {
        if (!userProfile.profileComplete) {
          nextRouter.replace('/profile/setup');
          return;
        } else if (!userProfile.preferredCategories || userProfile.preferredCategories.length === 0) {
          nextRouter.replace('/profile/preferences');
          return;
        }
        setUserDocLoading(true);
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setCoinBalance(docSnap.data().coins || 0);
            // Update free content consumed count if it's not set
            if (typeof docSnap.data().freeContentConsumedCount === 'undefined') {
                updateDoc(userRef, { freeContentConsumedCount: 0 });
            }
            if (typeof docSnap.data().consumedContentIds === 'undefined') {
                updateDoc(userRef, { consumedContentIds: [] });
            }
          } else {
            setCoinBalance(0);
          }
          setUserDocLoading(false);
        }, (error) => {
          console.error("Error listening to user balance:", error);
          toast({ title: "Error", description: "Could not load your coin balance.", variant: "destructive" });
          setUserDocLoading(false);
        });
        return () => unsubscribe();
      } else {
        setUserDocLoading(false);
      }
    }
  }, [user, authLoading, userProfile, isUserProfileLoading, nextRouter, toast]);


  const handleVerifyPayment = useCallback(async (paymentReference: string) => {
    if (isVerifyingPayment) return;
    setIsVerifyingPayment(true);
    
    const paystackSecretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY_LIVE;

    if (!paystackSecretKey || !(paystackSecretKey.startsWith("sk_live_") || paystackSecretKey.startsWith("sk_test_"))) {
      console.error("Invalid or missing Paystack LIVE/TEST secret key for verification. Set NEXT_PUBLIC_PAYSTACK_SECRET_KEY_LIVE in .env.local or check hardcoded key.");
      toast({
        title: 'Verification Error',
        description: 'Payment gateway configuration error for verification. Contact support. [PSKNCV]',
        variant: 'destructive',
      });
      setIsVerifyingPayment(false);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('trxref');
      newUrl.searchParams.delete('reference');
      nextRouter.replace(newUrl.pathname + newUrl.search, { scroll: false });
      return;
    }
    

    try {
      const verifyUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;
      const response = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.status && data.data && data.data.status === 'success') {
        const transactionData = data.data;
        const amountPaid = transactionData.amount / 100; 
        
        const paymentMetadata = transactionData.metadata;
        const userIdFromMeta = paymentMetadata?.userId; 
        const coinsToAddStr = paymentMetadata?.coins; 
        const packageName = paymentMetadata?.packageName; 

        if (!userIdFromMeta || typeof coinsToAddStr === 'undefined') {
            console.error('Invalid metadata from Paystack (userId or coins missing):', paymentMetadata);
            throw new Error('Crucial payment metadata missing.');
        }
         if (user && userIdFromMeta !== user.uid) { 
            console.error('User ID mismatch in payment verification:', userIdFromMeta, user.uid);
            throw new Error('Payment verification user mismatch.');
        }
        
        const coinsToAdd = parseInt(coinsToAddStr, 10);
        if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
            console.error('Invalid metadata: coinsToAdd is not a positive number', coinsToAddStr);
            throw new Error('Crucial payment metadata (coins) invalid.');
        }

        const userRef = doc(db, 'users', userIdFromMeta);
        const userDocSnap = await getDoc(userRef);

        const newPaymentRecord = {
          amount: amountPaid,
          coins: coinsToAdd,
          timestamp: new Date(), 
          reference: paymentReference,
          status: 'success',
          packageName: packageName || 'N/A',
          gatewayResponseSummary: { 
            ip_address: transactionData.ip_address,
            currency: transactionData.currency,
            channel: transactionData.channel,
            card_type: transactionData.authorization?.card_type,
            bank: transactionData.authorization?.bank,
            country_code: transactionData.authorization?.country_code,
          }
        };

        if (!userDocSnap.exists()) {
          await setDoc(userRef, {
            email: transactionData.customer.email, 
            name: user?.displayName || 'New User', 
            photoURL: user?.photoURL || null,
            coins: coinsToAdd,
            paymentHistory: arrayUnion(newPaymentRecord),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            subscription: false, 
            profileComplete: false, 
            preferredCategories: [],
            isAdmin: false,
            freeContentConsumedCount: 0,
            consumedContentIds: [],
            likedContentIds: [],
            savedContentIds: []
          });
        } else {
          const currentCoins = userDocSnap.data()?.coins || 0;
          const newBalance = currentCoins + coinsToAdd;
          await updateDoc(userRef, {
            coins: newBalance,
            paymentHistory: arrayUnion(newPaymentRecord),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(), 
          });
        }

        toast({
          title: 'Payment Successful!',
          description: `${coinsToAdd.toLocaleString()} coins added.`,
          variant: 'default',
          duration: 7000,
        });

      } else {
        console.error('Paystack verification failed:', data);
        toast({
          title: 'Payment Verification Failed',
          description: data.message || 'Issue verifying payment. Contact support if debited.',
          variant: 'destructive',
          duration: 7000,
        });
      }
    } catch (error: any) {
      console.error('Error verifying payment client-side:', error);
      toast({
        title: 'Payment Verification Error',
        description: error.message || 'Unexpected error during verification.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingPayment(false);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('trxref');
      newUrl.searchParams.delete('reference');
      nextRouter.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [toast, nextRouter, user, isVerifyingPayment]); 


  useEffect(() => {
    const paymentReference = searchParams.get('trxref') || searchParams.get('reference');
    if (paymentReference && user && !authLoading && !isUserProfileLoading && userProfile?.profileComplete && !isVerifyingPayment) { 
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
  }, [searchParams, user, authLoading, isUserProfileLoading, userProfile, isVerifyingPayment, handleVerifyPayment, nextRouter]);


  if (authLoading || isUserProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting to sign-in...</p>
      </div>
    );
  }
  
  if (!userProfile || !userProfile.profileComplete || !userProfile.preferredCategories || userProfile.preferredCategories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Finalizing profile setup...</p>
      </div>
    );
  }

  if (userDocLoading && userProfile && userProfile.profileComplete) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (isPlayerOpen) return null;

    switch (activeTab) {
      case 'Home':
        return (
          <>
            <Card className="mb-4 bg-card border-border shadow-lg">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-lg text-primary">Your KeyFind Wallet</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-2">
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
        return <SoundsContent />;
      case 'Markets':
        return <MarketSection />
      case 'Articles':
        return <ArticleContent />;
      case 'Trade':
        return (
             <div className="text-center py-10 px-4">
                <p className="text-muted-foreground">Trade section is currently not directly accessible via main navigation.</p>
                <MarketSection />
            </div>
        );
      default:
        return (
          <div className="text-center py-10 px-4">
            <p className="text-muted-foreground">Content for {activeTab} tab.</p>
          </div>
        );
    }
  };
  
  let mainPaddingBottom = 'pb-16'; 
  if (currentTrack && !isPlayerOpen) { 
    mainPaddingBottom = 'pb-28'; 
  } else if (isPlayerOpen) {
    mainPaddingBottom = 'pb-0'; 
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isPlayerOpen && <TopHeader />}
      <main className={`flex-grow overflow-y-auto ${mainPaddingBottom} md:pb-0 px-0 pt-3`}>
        {renderContent()}
      </main>
      {currentTrack && !isPlayerOpen && <PlayerBar />}
      {isPlayerOpen && <FullScreenPlayer />}
      {!isPlayerOpen && <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
}

export default function Page() {
  // This outer component is now the default export for the page.
  // It wraps HomePageContent, which uses useSearchParams, in a Suspense boundary.
  return (
    <Suspense fallback={<PageLoader />}>
      <HomePageContent />
    </Suspense>
  );
}
