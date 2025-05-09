// src/components/exchange/PaystackButton.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { auth, db } from '@/lib/firebase'; 
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Currency = 'NGN' | 'GHS' | 'USD' | 'KES';

interface CustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

interface PaystackConfig {
  reference: string;
  email: string;
  amount: number; // Amount in kobo/cents
  publicKey: string;
  currency: Currency;
  metadata: {
    custom_fields: CustomField[];
  };
}

interface PaystackButtonProps {
  amount: number; // Amount in major unit (e.g., KES)
  email: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
  };
  onPaymentFlowComplete: (success: boolean) => void; // To notify parent component
}

const PaystackButton = ({ amount, email, userId, metadata, onPaymentFlowComplete }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const user = auth.currentUser; // Get current user from Firebase auth

  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  if (!paystackPublicKey) {
    console.error("Paystack public key is not defined. Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in your environment variables.");
    // Optionally render an error message or disabled button
  }
  
  const config: PaystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: Math.round(amount * 100), // Convert to Kobo/Cents, ensure integer
    publicKey: paystackPublicKey || '', // Fallback to empty string if undefined, Paystack will error out
    currency: 'KES', 
    metadata: {
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: userId
        },
        {
          display_name: "Coins",
          variable_name: "coins",
          value: metadata.coins.toString() 
        },
        {
          display_name: "Package Name", // Changed from "Package" to "Package Name" for clarity
          variable_name: "package_name", // Changed from "package" to "package_name"
          value: metadata.packageName
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handleSuccessfulPayment = async (response: any) => {
    setIsLoading(true);
    try {
      if (!userId || !metadata) {
        throw new Error('User ID or payment metadata is missing');
      }

      const userRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userRef);

      const paymentData = {
        amount: amount, // KES major unit
        coins: metadata.coins,
        timestamp: serverTimestamp(),
        reference: response.reference,
        status: 'success',
        packageName: metadata.packageName
      };

      if (!userDocSnap.exists()) {
        // This case should ideally be handled by user initialization on login.
        // If it happens, create user doc with payment info.
        await setDoc(userRef, {
          email: email,
          coins: metadata.coins,
          lastPayment: paymentData,
          paymentHistory: [paymentData],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const currentCoins = userDocSnap.data()?.coins || 0;
        const newBalance = currentCoins + metadata.coins;
        await updateDoc(userRef, {
          coins: newBalance,
          lastPayment: paymentData,
          paymentHistory: arrayUnion(paymentData),
          updatedAt: serverTimestamp()
        });
      }

      toast({
        title: 'Payment Successful!',
        description: `Successfully added ${metadata.coins.toLocaleString()} coins to your account.`,
      });
      onPaymentFlowComplete(true);
    } catch (err: any) {
      console.error('Failed to update user balance or record payment:', err);
      toast({
        title: 'Payment Processing Error',
        description: `Payment may have succeeded, but updating your account failed. Ref: ${response?.reference}. Please contact support. Error: ${err.message}`,
        variant: 'destructive',
        duration: 10000,
      });
      onPaymentFlowComplete(true); // True because payment itself might be successful with Paystack
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePaystackModal = () => {
    // This is called when the user closes the Paystack modal manually
    // or after a successful/failed transaction where Paystack closes the modal.
    // If not successful, it means user cancelled.
    // Avoid toast if success is still processing
    if (!isLoading) {
      toast({
        title: 'Payment Cancelled',
        description: 'You closed the payment window.',
        variant: 'destructive', // Or 'default' if just informational
      });
    }
    onPaymentFlowComplete(false); // False as user explicitly closed or it was not a completed success path for this handler
  };

  const handlePayment = () => {
    setError(null); // Clear previous errors
    if (!user?.email) {
      setError('Please ensure your email is verified before making a purchase.');
      toast({ title: "Email Required", description: "Please ensure your email is verified.", variant: "destructive" });
      return;
    }
    if (!email) {
      setError('A valid email address is required for payment.');
      toast({ title: "Email Required", description: "A valid email address is required.", variant: "destructive" });
      return;
    }
    if (!paystackPublicKey) {
      setError('Payment gateway is not configured correctly. Please contact support.');
      toast({ title: "Configuration Error", description: "Payment gateway is not configured.", variant: "destructive" });
      return;
    }

    setIsLoading(true); // Set loading true before calling initializePayment
    try {
      initializePayment(handleSuccessfulPayment, handleClosePaystackModal);
    } catch (err: any) {
      setError('Failed to initialize payment. Please try again.');
      console.error('Payment initialization error:', err);
      toast({ title: "Initialization Error", description: "Failed to initialize payment.", variant: "destructive" });
      setIsLoading(false); // Reset loading on direct catch
      onPaymentFlowComplete(false); // Indicate flow ended without success
    }
    // setIsLoading(false) is handled in onSuccess/onClose or direct catch
  };

  return (
    <div className="text-center">
      {error && (
        <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          {error}
        </div>
      )}
      <Button
        onClick={handlePayment}
        disabled={isLoading || !user?.email || !paystackPublicKey}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        {isLoading ? 'Processing...' : 'Pay Now'}
      </Button>
      {!user?.email && (
        <p className="text-xs text-destructive mt-2">Please ensure your email is verified to make a purchase.</p>
      )}
      {!paystackPublicKey && (
        <p className="text-xs text-destructive mt-2">Payment system is currently unavailable.</p>
      )}
    </div>
  );
};

export default PaystackButton;
