// src/components/exchange/Pay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import PaystackButton from './PaystackButton';
import { db } from '../../lib/firebase'; 
import { doc, getDoc, updateDoc, setDoc, enableIndexedDbPersistence, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Enable offline persistence
try {
  if (typeof window !== "undefined") { 
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      }
    });
  }
} catch (error) {
  console.warn('Error enabling persistence:', error);
}

interface CoinPackage {
  id: string;
  amountKES: number; // Amount in KES (major unit)
  coins: number;
  description: string;
  bonusText?: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack1', amountKES: 10, coins: 100, description: "Basic Pack" },
  { id: 'pack2', amountKES: 20, coins: 220, description: "Popular Pack", bonusText: "Includes 10% bonus coins" },
  { id: 'pack3', amountKES: 50, coins: 600, description: "Premium Pack", bonusText: "Includes 20% bonus coins" },
];

interface PayProps {
  userId: string;
  userEmail: string | null; 
  onPaymentCompleted: (coinsAdded: number) => void; // This might be re-evaluated based on new flow
  onCloseDialog: () => void;
}

export default function Pay({ userId, userEmail, onPaymentCompleted, onCloseDialog }: PayProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState('');
  const { toast } = useToast(); // Initialize toast

  const cleanErrors = () => {
    setError('');
  };

  const fetchUserBalance = async () => {
    try {
      cleanErrors();
      setLoading(true);
      
      if (!userId) throw new Error('No user ID provided');
      
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        setCurrentBalance(0);
        // Initialize user if not exists, or ensure PaystackButton handles this for its metadata if needed.
        // For now, assuming user initialization happens at login.
        await setDoc(userRef, { email: userEmail, coins: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } else {
        setCurrentBalance(docSnap.data().coins || 0);
      }
    } catch (err: any) {
      console.error("Error fetching user balance:", err);
      setError(`Failed to load your balance. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) { // Ensure userId is present before fetching
        fetchUserBalance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only re-run if userId changes

  const handlePackageSelect = (pkgId: string) => {
    cleanErrors();
    const foundPackage = COIN_PACKAGES.find(p => p.id === pkgId);
    setSelectedPackage(foundPackage || null);
  };

  // This function is no longer directly called by PaystackButton's onSuccess.
  // Payment success is now handled by the callback URL and server-side verification.
  // The `onPaymentCompleted` prop from UserActions might need to be re-thought for timing.
  // For now, it's not called from here.
  // const handlePaymentSuccess = async (response: any) => { ... } // Removed this as direct handler


  if (loading && !selectedPackage && !error) { 
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
          {loading && !selectedPackage ? ( 
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
          disabled={!userEmail || loading} 
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
                <RadioGroupItem value={pkg.id} id={pkg.id} className="mr-3 mt-1 sm:mt-0 self-start sm:self-center" disabled={!userEmail || loading} />
                <div>
                  <h3 className="text-base font-semibold text-foreground">{pkg.description}</h3>
                  <p className="text-lg font-bold text-primary mb-1">{pkg.coins.toLocaleString()} coins</p>
                  {pkg.bonusText && (
                    <p className="text-xs text-green-600 font-medium">{pkg.bonusText}</p>
                  )}
                </div>
              </div>
              <p className="text-base font-semibold text-foreground sm:ml-4 self-end sm:self-center">
                KES {pkg.amountKES.toLocaleString()}
              </p>
            </Label>
          ))}
        </RadioGroup>

        {selectedPackage && userEmail && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="bg-muted/30 p-3 rounded-lg mb-4 text-xs">
              <h3 className="text-sm font-semibold mb-1 text-foreground">Order Summary:</h3>
              <div className="flex justify-between"><span className="text-muted-foreground">Package:</span> <span className="font-medium text-foreground">{selectedPackage.description}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Price:</span> <span className="font-medium text-foreground">KES {selectedPackage.amountKES.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coins to receive:</span> <span className="font-medium text-foreground">{selectedPackage.coins.toLocaleString()}</span></div>
            </div>
            
            <PaystackButton
                amount={selectedPackage.amountKES} // Pass amount in KES (major unit)
                email={userEmail}
                userId={userId}
                metadata={{
                  coins: selectedPackage.coins,
                  packageName: selectedPackage.description
                }}
                onClose={onCloseDialog} // This will close the Pay dialog after Paystack tab is opened
              />
            
            <p className="mt-4 text-xs text-center text-muted-foreground px-4">
              You will be redirected to Paystack in a new tab to complete your payment securely.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
