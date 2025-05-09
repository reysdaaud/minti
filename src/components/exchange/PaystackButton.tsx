// src/components/exchange/PaystackButton.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { auth } from '../../lib/firebase'; 
import { Button } from '@/components/ui/button'; 

type Currency = 'NGN' | 'GHS' | 'USD' | 'KES';

interface CustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

interface PaystackMetadata { 
  custom_fields: CustomField[];
}

interface PaystackConfig {
  reference: string;
  email: string;
  amount: number; 
  publicKey: string; // This will hold the key, which might be a secret key for user's testing
  currency: Currency;
  metadata: PaystackMetadata;
}

interface PaystackButtonProps {
  amount: number; 
  email: string | null; 
  userId: string;
  metadata: { 
    coins: number;
    packageName: string;
  };
  onSuccess: (response: any) => Promise<void>;
  onClose?: () => void; // Paystack's own modal close
  onCloseParentDialog?: () => void; // To close the top-up dialog in UserActions.tsx
}

const PaystackButton = ({ amount, email, userId, metadata: propMetadata, onSuccess, onClose, onCloseParentDialog }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;
  
  const envPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  // User's latest provided live secret key
  const hardcodedUserLiveKey = "sk_live_7148c4754ef026a94b9015605a4707dc3c3cf8c3"; 
  const defaultTestKey = 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f'; // Fallback public test key

  let paystackKeyToUse: string;
  let keySourceMessage: string;

  if (envPublicKey && (envPublicKey.startsWith('pk_live_') || envPublicKey.startsWith('sk_live_'))) {
    paystackKeyToUse = envPublicKey;
    keySourceMessage = `Using LIVE Paystack key from environment variable: ${envPublicKey.substring(0,10)}...`;
    if (envPublicKey.startsWith('sk_live_')) {
      console.warn("[PaystackButton - CRITICAL SECURITY WARNING] Environment variable NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY provides a SECRET live key. This is a SEVERE security risk and should ONLY be for temporary testing as explicitly requested by the user. REMOVE BEFORE PRODUCTION.");
      keySourceMessage += " (SECRET KEY)";
    }
  } else if (envPublicKey && envPublicKey.startsWith('pk_test_')) {
    paystackKeyToUse = envPublicKey;
    keySourceMessage = `Using TEST Paystack key from environment variable: ${envPublicKey.substring(0,10)}... (TEST MODE)`;
    console.warn("[PaystackButton] Environment variable NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY provides a TEST key. Payments will be in test mode.");
  } else {
    // Fallback to the user-provided hardcoded key if env var is not set or not a valid live/test key.
    paystackKeyToUse = hardcodedUserLiveKey;
    keySourceMessage = `Using hardcoded LIVE Paystack key: ${hardcodedUserLiveKey.substring(0,10)}...`;
    if (hardcodedUserLiveKey.startsWith('sk_live_')) {
         console.warn(`[PaystackButton - CRITICAL SECURITY WARNING] Using a hardcoded SECRET live key ('${hardcodedUserLiveKey.substring(0,10)}...') on the client side. This is for TESTING ONLY as explicitly requested by the user and is a SEVERE SECURITY RISK. Remove before production.`);
        keySourceMessage += " (SECRET KEY)";
    } else if (hardcodedUserLiveKey.startsWith('pk_live_')) {
        console.warn(`[PaystackButton] NOTICE: Application is using a hardcoded PUBLIC live key. For better security and flexibility, it is recommended to use environment variables for live keys in production environments.`);
    }

    if (envPublicKey) {
      console.warn(`[PaystackButton] Environment variable NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ('${envPublicKey}') is not a valid live/test key. Falling back to the hardcoded key specified by the user. For production, ensure the environment variable is correctly set to your live PUBLIC key.`);
    } else {
      console.warn(`[PaystackButton] NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY environment variable not found. Using the hardcoded key specified by the user. For production, set this environment variable with your live PUBLIC key.`);
    }
  }

  // Final sanity check:
  if (!paystackKeyToUse || (!paystackKeyToUse.startsWith('pk_live_') && !paystackKeyToUse.startsWith('pk_test_') && !paystackKeyToUse.startsWith('sk_live_'))) {
    console.error(`[PaystackButton] CRITICAL CONFIGURATION ERROR: The determined Paystack key ('${paystackKeyToUse}') is invalid or missing. Defaulting to a generic public test key. Please check your configuration and environment variables.`);
    paystackKeyToUse = defaultTestKey;
    keySourceMessage = `Using DEFAULT FALLBACK TEST Paystack key due to critical configuration error: ${defaultTestKey.substring(0,10)}... (TEST MODE - UNINTENDED)`;
  }


  useEffect(() => {
    console.log(`[PaystackButton Active Key Source] ${keySourceMessage}`);
    console.log(`[PaystackButton Effective Key Used] ${paystackKeyToUse.substring(0,10)}...`);
    if (paystackKeyToUse.startsWith('pk_test_')) {
        console.warn("[PaystackButton] WARNING: Application is currently using a TEST Paystack key. All transactions will be in test mode and will not process real payments.");
    } else if (paystackKeyToUse.startsWith('sk_live_')) {
         // Warning is already prominent when keySourceMessage is built.
         console.error("[PaystackButton - CRITICAL USAGE] Attempting to use a LIVE SECRET KEY for client-side Paystack initialization. This is highly insecure and against Paystack's recommended practices. This configuration is due to explicit user instruction for testing and MUST be changed for any production environment. Paystack's client library may not support secret keys for initialization, potentially leading to 'invalid key' errors or unexpected behavior.");
    } else if (paystackKeyToUse.startsWith('pk_live_')) {
        console.log("[PaystackButton] Application is using a LIVE PUBLIC Paystack key.");
    }
  }, [paystackKeyToUse, keySourceMessage]);


  const config: PaystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email || user?.email || '', 
    amount: amount, // Amount should be in the smallest currency unit (e.g., Kobo, Cents)
    publicKey: paystackKeyToUse, // This is now correctly `paystackKeyToUse`
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
          value: propMetadata.coins.toString() 
        },
        {
          display_name: "Package",
          variable_name: "package_name", 
          value: propMetadata.packageName
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    setError(null); 
    if (!config.email) { 
      setError('Please provide a valid email address or ensure your account email is verified.');
      return;
    }
    
    if (!config.publicKey || (!config.publicKey.startsWith('pk_test_') && !config.publicKey.startsWith('pk_live_') && !config.publicKey.startsWith('sk_live_'))) {
      setError('Paystack payment cannot be initialized. Configuration error: Invalid or missing Paystack key.');
      console.error('[PaystackButton] Invalid Paystack Key for initialization attempt:', config.publicKey);
      return;
    }
    
    // Close the parent dialog (e.g., top-up dialog) before opening Paystack's modal
    if (onCloseParentDialog) {
        onCloseParentDialog();
    }

    try {
      if (config.publicKey.startsWith('sk_live_')) {
        console.warn(`[PaystackButton - PAYMENT ATTEMPT WITH SECRET KEY] Initializing payment with a SECRET KEY ('${config.publicKey.substring(0,10)}...') on the client side. This is for TESTING ONLY as requested and is a SEVERE SECURITY RISK. This may not work as Paystack's client-side library expects a public key and can result in an 'invalid key' error from Paystack.`);
      }

      initializePayment(
        (response?: any) => { // onSuccess callback from usePaystackPayment
          setError(null);
          onSuccess(response); // Call the prop onSuccess
        },
        () => { // onClose callback from usePaystackPayment
          if (onClose) { // Call the prop onClose if provided
            onClose();
          }
          // Note: The parent dialog should have already been closed by onCloseParentDialog
        }
      );
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
      console.error('[PaystackButton] Payment initialization error:', err);
    }
  };

  const canPay = !!config.email && !!config.publicKey && (config.publicKey.startsWith('pk_test_') || config.publicKey.startsWith('pk_live_') || config.publicKey.startsWith('sk_live_'));

  return (
    <div className="text-center">
      {error && (
        <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          {error}
        </div>
      )}
      <Button
        onClick={handlePayment}
        disabled={!canPay || !user?.email} // Also disable if user email is not available
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow w-full"
      >
        {canPay && user?.email ? 'Pay Now' : 'Processing...'}
      </Button>
       {!user?.email && (
         <p className="text-xs text-destructive mt-2">Please ensure your email is verified to make a purchase.</p>
       )}
    </div>
  );
};

export default PaystackButton;
