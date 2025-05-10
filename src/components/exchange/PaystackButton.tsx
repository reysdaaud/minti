// src/components/exchange/PaystackButton.tsx
"use client";

import React, { useState, useEffect } from 'react';
// REMOVE: import { usePaystackPayment } from 'react-paystack'; // No longer using the hook directly for new tab behavior
import { auth, db } from '@/lib/firebase'; 
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// type Currency = 'NGN' | 'GHS' | 'USD' | 'KES'; // Already defined if needed elsewhere

interface CustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

/* // PaystackConfig type for usePaystackPayment hook is no longer directly used
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
*/

interface PaystackButtonProps {
  amount: number; // Amount in major unit (e.g., KES)
  email: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
  };
  onPaymentFlowComplete: (success: boolean) => void; // To notify parent component to close dialog
}

const PaystackButton = ({ amount, email, userId, metadata, onPaymentFlowComplete }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const user = auth.currentUser; 

  // WARNING: Using SECRET KEY on the client side. This is a SEVERE SECURITY RISK.
  // This should be replaced with a backend call in production.
  // User's live secret key, e.g., sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const paystackSecretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE; 


  const handlePayment = async () => {
    setError(null);
    setIsLoading(true);

    if (!user?.email) {
      setError('Please ensure your email is verified before making a purchase.');
      toast({ title: "Email Required", description: "Please ensure your email is verified.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!email) {
      setError('A valid email address is required for payment.');
      toast({ title: "Email Required", description: "A valid email address is required.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (!paystackSecretKey) {
      console.error("Paystack secret key is not defined. Set NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE in your environment variables.");
      setError('Payment gateway is not configured correctly. Please contact support.');
      toast({ title: "Configuration Error", description: "Payment gateway critical error. Contact support. [PSKNC]", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    // Construct callback URL - current page without query parameters, Paystack will append its own.
    const callbackUrl = `${window.location.origin}${window.location.pathname}`;

    const payload = {
      email: email,
      amount: Math.round(amount * 100), // Convert to Kobo/Cents
      currency: 'KES', 
      callback_url: callbackUrl,
      metadata: {
        // custom_fields are for display on Paystack's dashboard.
        custom_fields: [
          { display_name: "User ID", variable_name: "user_id_display", value: userId }, // Changed variable_name to avoid conflict if Paystack uses 'user_id' internally
          { display_name: "Coins", variable_name: "coins_to_add_display", value: metadata.coins.toString() },
          { display_name: "Package Name", variable_name: "package_name_display", value: metadata.packageName }
        ],
        // Store crucial data directly in metadata for easier retrieval during verification
        userId: userId, 
        coins: metadata.coins, 
        packageName: metadata.packageName,
      }
    };

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.status) {
        console.error('Paystack initialization failed:', responseData);
        throw new Error(responseData.message || 'Failed to initialize payment with Paystack.');
      }

      const authorizationUrl = responseData.data.authorization_url;
      if (authorizationUrl) {
        // Open Paystack checkout in a new tab
        window.open(authorizationUrl, '_blank');
        toast({
          title: 'Redirecting to Paystack',
          description: 'Please complete your payment in the new tab.',
        });
        // Close the dialog or indicate that the process has moved to a new tab.
        onPaymentFlowComplete(true); 
      } else {
        throw new Error('Authorization URL not found in Paystack response.');
      }

    } catch (err: any) {
      console.error('Error initializing Paystack payment:', err);
      setError(err.message || 'An unexpected error occurred during payment setup.');
      toast({
        title: 'Payment Setup Error',
        description: err.message || 'Could not initiate payment.',
        variant: 'destructive',
      });
      onPaymentFlowComplete(false); // Indicate failure to initiate
    } finally {
      setIsLoading(false);
    }
  };
  
  // The onSuccess and onClose callbacks for usePaystackPayment are no longer used directly here.
  // Success is handled via redirect to callback_url and verification on the main page.
  // The `onPaymentFlowComplete` prop is now used to signal the parent (Pay.tsx) to close the dialog.

  return (
    <div className="text-center">
      {error && (
        <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          {error}
        </div>
      )}
      <Button
        onClick={handlePayment}
        disabled={isLoading || !user?.email || !paystackSecretKey}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        {isLoading ? 'Initiating...' : `Pay KES ${amount.toLocaleString()}`}
      </Button>
      {!user?.email && (
        <p className="text-xs text-destructive mt-2">Please ensure your email is verified to make a purchase.</p>
      )}
      {!paystackSecretKey && (
        <p className="text-xs text-destructive mt-2">Payment system is currently unavailable. [PSK NC]</p>
      )}
      <p className="text-xs text-muted-foreground mt-3">
        You will be redirected to Paystack in a new tab to complete your payment securely.
      </p>
    </div>
  );
};

export default PaystackButton;
