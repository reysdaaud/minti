// src/components/exchange/PaystackButton.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaystackButtonProps {
  amount: number; 
  email: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
  };
}

const PaystackButton = ({ amount, email, userId, metadata }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const user = auth.currentUser; 

  const envSecretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE;
  const hardcodedSecretKey = "sk_live_7148c4754ef026a94b9015605a4707dc3c3cf8c3"; 

  let paystackSecretKey = envSecretKey || hardcodedSecretKey;

   if (paystackSecretKey === hardcodedSecretKey && envSecretKey) {
         console.warn("[Paystack Setup - INFO] Using Paystack secret key from NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE.");
    } else if (paystackSecretKey === hardcodedSecretKey) {
        console.warn(
          "[Paystack Setup - CRITICAL SECURITY WARNING] Paystack secret key for verification from NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE is not defined. " +
          "Falling back to a HARDCODED LIVE SECRET KEY for testing purposes. " +
          "This is EXTREMELY INSECURE and MUST BE REMOVED before production. " +
          "Ensure the environment variable is correctly set."
        );
    }


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
      console.error("Paystack secret key is not defined. Set NEXT_PUBLIC_PAYSTACK_SECRET_KEY_TEMP_LIVE or check hardcoded key.");
      setError('Payment gateway is not configured correctly. Please contact support. [PSKNC]');
      toast({ title: "Configuration Error", description: "Payment gateway critical error. Contact support. [PSKNC]", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const callbackUrl = `${window.location.origin}${window.location.pathname}`; // Or your specific dashboard/confirmation page

    const payload = {
      email: email,
      amount: Math.round(amount * 100), 
      currency: 'KES', 
      callback_url: callbackUrl,
      metadata: {
        custom_fields: [
          { display_name: "User ID", variable_name: "user_id_display", value: userId },
          { display_name: "Coins", variable_name: "coins_to_add_display", value: metadata.coins.toString() },
          { display_name: "Package Name", variable_name: "package_name_display", value: metadata.packageName }
        ],
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
        // Note: onSuccess/onClose from usePaystackPayment are not used here.
        // Payment verification will happen when the user returns to the app (e.g., via URL params).
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
    } finally {
      setIsLoading(false);
    }
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
        disabled={isLoading || !user?.email || !paystackSecretKey}
        className="send-money-button w-full text-sm py-2.5" // Apply send-money-button style
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} 
        {isLoading ? 'Initiating...' : `Pay KES ${amount.toLocaleString()}`}
      </Button>
      {!user?.email && (
        <p className="text-xs text-destructive mt-2">Please ensure your email is verified to make a purchase.</p>
      )}
      {!paystackSecretKey && ( 
        <p className="text-xs text-destructive mt-2">Payment system is currently unavailable. [PSKNC_BTN]</p>
      )}
      <p className="text-xs text-muted-foreground mt-3">
        You will be redirected to Paystack in a new tab to complete your payment securely.
      </p>
    </div>
  );
};

export default PaystackButton;
