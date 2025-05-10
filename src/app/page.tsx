
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
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export default function CryptoExchangePage() {
  const { user, loading: authLoading } = useAuth();
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [coinBalance, setCoinBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('Home'); // Default to Home
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [userDocLoading, setUserDocLoading] = useState(true); // For Firestore data


  useEffect(() => {
    if (!authLoading && !user) {
      // Auth state determined, no user, redirect to sign-in
      nextRouter.replace('/auth/signin'); // Use replace to prevent back button to dashboard
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
      setUserDocLoading(true); // Set to true while auth is loading
      setCoinBalance(0);
    }
  }, [user, authLoading, nextRouter, toast]);


  const handleVerifyPayment = useCallback(async (paymentReference: string) => {
    if (isVerifyingPayment) return; // Prevent multiple simultaneous verifications
    setIsVerifyingPayment(true);
    console.log('Attempting to verify payment reference client-side:', paymentReference);
    
    const envSecretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE;
    const hardcodedSecretKey = "sk_live_7148c4754ef026a94b9015605a4707dc3c3cf8c3"; 

    let paystackSecretKey = envSecretKey || hardcodedSecretKey;

    if (paystackSecretKey === hardcodedSecretKey && envSecretKey) {
         console.warn("[VERIFICATION - INFO] Using Paystack secret key from NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE.");
    } else if (paystackSecretKey === hardcodedSecretKey) {
        console.warn(
          "[VERIFICATION - CRITICAL SECURITY WARNING] Paystack secret key for verification from NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE is not defined. " +
          "Falling back to a HARDCODED LIVE SECRET KEY for testing purposes. " +
          "This is EXTREMELY INSECURE and MUST BE REMOVED before production. " +
          "Ensure the environment variable is correctly set."
        );
    }
    

    if (!paystackSecretKey) {
      console.error("Paystack secret key for verification is not defined even after fallback. Set NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE or check hardcoded key in page.tsx.");
      toast({
        title: 'Verification Error',
        description: 'Payment gateway configuration error for verification. Contact support. [PSKNCV_FINAL]',
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
        console.log('Paystack verification successful:', data.data);

        const transactionData = data.data;
        const amountPaid = transactionData.amount / 100; 
        
        const paymentMetadata = transactionData.metadata;
        const userId = paymentMetadata?.userId; 
        const coinsToAddStr = paymentMetadata?.coins; 
        const packageName = paymentMetadata?.packageName; 

        if (!userId || typeof coinsToAddStr === 'undefined') {
            console.error('Invalid metadata from Paystack verification (userId or coins missing):', paymentMetadata);
            throw new Error('Crucial payment metadata (userId, coins) missing from verification.');
        }
        
        const coinsToAdd = parseInt(coinsToAddStr, 10);
        if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
            console.error('Invalid metadata: coinsToAdd is not a positive number', coinsToAddStr);
            throw new Error('Crucial payment metadata (coins) invalid from verification.');
        }


        const userRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userRef);

        const newPaymentRecord = {
          amount: amountPaid,
          coins: coinsToAdd,
          timestamp: new Date(), // Use client-side Date object for arrayUnion compatibility
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
          });
          console.log('New user document created with payment history for UID:', userId);
        } else {
          const currentCoins = userDocSnap.data()?.coins || 0;
          const newBalance = currentCoins + coinsToAdd;
          await updateDoc(userRef, {
            coins: newBalance,
            paymentHistory: arrayUnion(newPaymentRecord),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(), 
          });
          console.log('User balance updated for UID:', userId, '. New balance:', newBalance);
        }

        toast({
          title: 'Payment Successful!',
          description: `${coinsToAdd.toLocaleString()} coins added to your account.`,
          variant: 'default',
          duration: 7000,
        });

      } else {
        console.error('Paystack verification failed:', data);
        toast({
          title: 'Payment Verification Failed',
          description: data.message || 'There was an issue verifying your payment. Please contact support if debited.',
          variant: 'destructive',
          duration: 7000,
        });
      }
    } catch (error: any) {
      console.error('Error verifying payment client-side:', error);
      toast({
        title: 'Payment Verification Error',
        description: error.message || 'An unexpected error occurred while verifying your payment.',
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading authentication...</p>
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

  if (userDocLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  const renderContent = () => {
    // The targetTab from BottomNavBar now dictates content
    // Home -> Home content
    // Markets -> MarketSection (was Search in Spotify nav)
    // Sounds -> SoundsPlayer (was Library in Spotify nav)
    // Assets -> placeholder or CardBalance/UserActions (was Premium in Spotify nav)
    switch (activeTab) {
      case 'Home':
        return (
          <>
            <Card className="mb-4 bg-card border-border shadow-lg">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-lg text-primary">Your Sondar Wallet</CardTitle>
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
      case 'Sounds': // Corresponds to "Library" in new nav
        return <SoundsPlayer />;
      case 'Markets': // Corresponds to "Search" in new nav
        return <MarketSection /> 
      case 'Assets': // Corresponds to "Premium" in new nav
        return (
            <div className="text-center py-10">
                <CardBalance />
                <UserActions setCoinBalance={setCoinBalance} />
                <p className="text-muted-foreground mt-4">Premium features coming soon.</p>
            </div>
        );
      case 'Trade': // This tab is no longer in the nav bar items
        return (
             <div className="text-center py-10">
                <p className="text-muted-foreground">Trade section is currently not directly accessible via main navigation.</p>
                <MarketSection />
            </div>
        );
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

