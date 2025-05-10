// src/components/exchange/Pay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PaystackButton from './PaystackButton'; // The updated PaystackButton
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, enableIndexedDbPersistence, serverTimestamp } from 'firebase/firestore'; // Added serverTimestamp
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

// Enable offline persistence if not already done elsewhere or if specific to this component
try {
  if (typeof window !== "undefined") { 
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        // console.warn('The current browser does not support persistence.');
      }
    });
  }
} catch (error) {
  // console.warn('Error enabling persistence:', error);
}

interface CoinPackage {
  id: string;
  amount: number; // Amount in KES (major unit, e.g., 1 for KES 1)
  coins: number;
  description: string;
  bonusText?: string;
}

// Updated COIN_PACKAGES:
// KES 1 for Basic Pack, KES 2 for Popular Pack, KES 50 for Premium Pack
const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack1', amount: 1, coins: 100, description: "Basic Pack (KES 1)" },
  { id: 'pack2', amount: 2, coins: 220, description: "Popular Pack (KES 2)", bonusText: "Includes 10% bonus coins" },
  { id: 'pack3', amount: 50, coins: 600, description: "Premium Pack (KES 50)", bonusText: "Includes 20% bonus coins" },
];


interface PayProps {
  userId: string;
  userEmail: string | null; 
  onCloseDialog: () => void; // To close the parent DialogContent
}

export default function Pay({ userId, userEmail, onCloseDialog }: PayProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false); // Renamed from loading to avoid clash
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const cleanErrors = () => {
    setError('');
  };

  const fetchUserBalance = async () => {
    try {
      cleanErrors();
      setLoadingBalance(true);
      
      if (!userId) throw new Error('No user ID provided for balance fetch');
      
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        setCurrentBalance(0);
        // User doc might be created on first login or first payment by PaystackButton's success handler
      } else {
        setCurrentBalance(docSnap.data().coins || 0);
      }
    } catch (err: any) {
      console.error("Error fetching user balance:", err);
      setError(`Failed to load your balance. ${err.message}`);
      toast({ title: "Error", description: `Failed to load balance: ${err.message}`, variant: "destructive"});
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (userId) {
        fetchUserBalance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handlePackageSelect = (pkgId: string) => {
    cleanErrors();
    const foundPackage = COIN_PACKAGES.find(p => p.id === pkgId);
    setSelectedPackage(foundPackage || null);
  };

  const handlePaymentFlowComplete = (success: boolean) => {
    if (success) {
      // Balance should update via Firestore listener on the main page
      // or via the payment verification logic in page.tsx.
      // Re-fetching balance here might show outdated data if verification is not instant.
      // The toast for successful purchase is now handled in page.tsx after verification.
      // router.push('/'); // Example: navigate to home/dashboard
    }
    onCloseDialog(); // Close the "Buy Coins" dialog in all cases
  };


  if (loadingBalance && !selectedPackage && !error) { 
    return (
      <div className="max-w-4xl mx-auto p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your details...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-none overflow-hidden flex flex-col max-h-[calc(100vh-4rem)] h-full">
      <CardHeader className="bg-gradient-to-br from-primary/80 to-primary p-6">
        <CardTitle className="text-3xl font-bold text-center text-primary-foreground">Buy Sondar Coins</CardTitle>
        <CardDescription className="text-center text-primary-foreground/80 text-sm pt-1">
          Boost your wallet by selecting a coin package below.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6 bg-background flex-grow overflow-y-auto">
        {error && (
          <div 
            onClick={error.includes("load your balance") ? fetchUserBalance : undefined}
            className={`bg-destructive/10 border-l-4 border-destructive text-destructive p-4 mb-6 rounded-md ${error.includes("load your balance") ? "cursor-pointer hover:bg-destructive/20" : ""} transition-colors`}
            role="alert"
          >
            <p className="font-bold">An Error Occurred</p>
            <p className="text-sm">{error}</p>
            {error.includes("load your balance") && <p className="text-xs mt-2">Click this message to retry loading balance.</p>}
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg mb-6 text-center">
          {loadingBalance ? ( 
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <p className="text-lg text-muted-foreground">Loading balance...</p>
            </div>
          ) : (
            <p className="text-lg">Current Balance: <span className="font-bold text-primary">{currentBalance.toLocaleString()} coins</span></p>
          )}
        </div>

        {!userEmail && (
          <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 mb-6 rounded-md" role="alert">
            <p className="font-bold">Email Required</p>
            <p className="text-sm">A valid email address is required to make payments. Please ensure your account has a verified email.</p>
          </div>
        )}

        <RadioGroup 
          value={selectedPackage?.id} 
          onValueChange={handlePackageSelect}
          className="space-y-3"
          disabled={!userEmail || loadingBalance} 
        >
          {COIN_PACKAGES.map((pkg) => (
            <Label
              key={pkg.id}
              htmlFor={pkg.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-2 rounded-lg transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary/70
                          ${selectedPackage?.id === pkg.id 
                            ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]' 
                            : 'border-border bg-card hover:bg-muted/30'}
                          ${!userEmail ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer pointer-events-auto'}`}
            >
              <div className="flex items-center mb-2 sm:mb-0">
                <RadioGroupItem value={pkg.id} id={pkg.id} className="mr-3 mt-1 sm:mt-0 self-start sm:self-center" disabled={!userEmail || loadingBalance} />
                <div>
                  <h3 className="text-base font-semibold text-foreground">{pkg.description}</h3>
                  <p className="text-lg font-bold text-primary mb-1">{pkg.coins.toLocaleString()} coins</p>
                  {pkg.bonusText && (
                    <p className="text-xs text-green-600 font-medium">{pkg.bonusText}</p>
                  )}
                </div>
              </div>
              <p className="text-base font-semibold text-foreground sm:ml-4 self-end sm:self-center">
                KES {pkg.amount.toLocaleString()}
              </p>
            </Label>
          ))}
        </RadioGroup>

        {selectedPackage && userEmail && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="bg-muted/30 p-3 rounded-lg mb-4 text-xs">
              <h3 className="text-sm font-semibold mb-1 text-foreground">Order Summary:</h3>
              <div className="flex justify-between"><span className="text-muted-foreground">Package:</span> <span className="font-medium text-foreground">{selectedPackage.description}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Price:</span> <span className="font-medium text-foreground">KES {selectedPackage.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coins to receive:</span> <span className="font-medium text-foreground">{selectedPackage.coins.toLocaleString()}</span></div>
            </div>
            
            <PaystackButton
                amount={selectedPackage.amount} // Pass KES major unit
                email={userEmail}
                userId={userId}
                metadata={{
                  coins: selectedPackage.coins,
                  packageName: selectedPackage.description
                }}
                onPaymentFlowComplete={handlePaymentFlowComplete}
              />
            
            <p className="mt-4 text-xs text-center text-muted-foreground px-4">
              You will be redirected to Paystack to complete your payment securely.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

