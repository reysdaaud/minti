// src/components/exchange/Pay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import PaystackButton from './PaystackButton';
import { db } from '../../lib/firebase'; // Adjusted path
import { doc, getDoc, updateDoc, setDoc, enableIndexedDbPersistence, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// Enable offline persistence
try {
  if (typeof window !== "undefined") { // Ensure runs only in browser
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
  { id: 'pack1', amountKES: 10, coins: 100, description: "Basic Pack" },  // KSh 10 = 100 coins
  { id: 'pack2', amountKES: 20, coins: 220, description: "Popular Pack", bonusText: "Includes 10% bonus coins" }, // KSh 20 = 220 coins
  { id: 'pack3', amountKES: 50, coins: 600, description: "Premium Pack", bonusText: "Includes 20% bonus coins" }, // KSh 50 = 600 coins
];

interface PayProps {
  userId: string;
  userEmail: string | null;
  onPaymentCompleted: (coinsAdded: number) => void;
  onCloseDialog: () => void; // New prop
}

export default function Pay({ userId, userEmail, onPaymentCompleted, onCloseDialog }: PayProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
         // Optionally create user document if it doesn't exist
        await setDoc(userRef, { email: userEmail, coins: 0, createdAt: serverTimestamp() });
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
    fetchUserBalance();
  }, [userId]);

  const handlePackageSelect = (pkgId: string) => {
    cleanErrors();
    const foundPackage = COIN_PACKAGES.find(p => p.id === pkgId);
    setSelectedPackage(foundPackage || null);
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      cleanErrors();
      setLoading(true);

      if (!selectedPackage || !userId) {
        throw new Error('Invalid payment data. Package or User ID missing.');
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef); // Get latest doc
      
      const paymentData = {
        amountKES: selectedPackage.amountKES,
        coinsAdded: selectedPackage.coins,
        timestamp: serverTimestamp(), // Use server timestamp
        reference: response.reference || response.transaction, // Paystack might use 'transaction'
        status: 'success',
        packageName: selectedPackage.description,
      };

      const currentCoins = userDoc.exists() ? (userDoc.data().coins || 0) : 0;
      const newBalance = currentCoins + selectedPackage.coins;

      if (!userDoc.exists()) { // Should be rare if fetchUserBalance created it
        await setDoc(userRef, {
          email: userEmail,
          coins: newBalance,
          lastPayment: paymentData,
          paymentHistory: [paymentData],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          coins: newBalance,
          lastPayment: paymentData,
          paymentHistory: [...(userDoc.data().paymentHistory || []), paymentData],
          updatedAt: serverTimestamp(),
        });
      }
      
      setCurrentBalance(newBalance);
      onPaymentCompleted(selectedPackage.coins); // This will also call onCloseDialog via UserActions
      
    } catch (err: any) {
      console.error("Error processing payment success:", err);
      setError(
        `Payment recorded with Paystack (Ref: ${response.reference || response.transaction}) but database update failed. ` +
        `Please contact support with this reference. Error: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedPackage) { // Show main loading indicator only initially
    return (
      <div className="max-w-4xl mx-auto p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your details...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl border-none overflow-hidden flex flex-col max-h-[calc(100vh-4rem)] h-full"> {/* Adjusted max-h for viewport */}
      <CardHeader className="bg-gradient-to-br from-primary/80 to-primary p-6">
        <CardTitle className="text-3xl font-bold text-center text-primary-foreground">Buy Sondar Coins</CardTitle>
        <CardDescription className="text-center text-primary-foreground/80 text-sm pt-1">
          Boost your wallet by selecting a coin package below.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6 bg-background flex-grow overflow-y-auto"> {/* Ensure this can scroll */}
        {error && (
          <div 
            onClick={fetchUserBalance} // Allow retry
            className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 mb-6 cursor-pointer hover:bg-destructive/20 transition-colors rounded-md"
            role="alert"
          >
            <p className="font-bold">An Error Occurred</p>
            <p className="text-sm">{error}</p>
            {error.includes("load your balance") && <p className="text-xs mt-2">Click this message to retry.</p>}
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg mb-6 text-center">
          {loading && selectedPackage ? ( // More subtle loading when package is selected
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <p className="text-lg text-muted-foreground">Processing...</p>
            </div>
          ) : (
            <p className="text-lg">Current Balance: <span className="font-bold text-primary">{currentBalance.toLocaleString()} coins</span></p>
          )}
        </div>

        <RadioGroup 
          value={selectedPackage?.id} 
          onValueChange={handlePackageSelect}
          className="space-y-3"
        >
          {COIN_PACKAGES.map((pkg) => (
            <Label
              key={pkg.id}
              htmlFor={pkg.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary/70
                          ${selectedPackage?.id === pkg.id 
                            ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]' 
                            : 'border-border bg-card hover:bg-muted/30'}`}
            >
              <div className="flex items-center mb-2 sm:mb-0">
                <RadioGroupItem value={pkg.id} id={pkg.id} className="mr-3 mt-1 sm:mt-0 self-start sm:self-center" />
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

        {selectedPackage && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="bg-muted/30 p-3 rounded-lg mb-4 text-xs">
              <h3 className="text-sm font-semibold mb-1 text-foreground">Order Summary:</h3>
              <div className="flex justify-between"><span className="text-muted-foreground">Package:</span> <span className="font-medium text-foreground">{selectedPackage.description}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Price:</span> <span className="font-medium text-foreground">KES {selectedPackage.amountKES.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coins to receive:</span> <span className="font-medium text-foreground">{selectedPackage.coins.toLocaleString()}</span></div>
            </div>
            
            <PaystackButton
              amount={selectedPackage.amountKES * 100} // Convert KES to cents for Paystack
              email={userEmail}
              userId={userId}
              onSuccess={handlePaymentSuccess}
              metadata={{
                coins: selectedPackage.coins,
                packageName: selectedPackage.description
              }}
              onCloseParentDialog={onCloseDialog} // Pass the handler
            />
            
            <p className="mt-4 text-xs text-center text-muted-foreground px-4">
              Payments are securely processed by Paystack. By clicking "Pay Now", you agree to our Terms of Service.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
