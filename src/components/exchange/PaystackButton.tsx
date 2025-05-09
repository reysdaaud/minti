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
  publicKey: string;
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
  onClose?: () => void;
  onCloseParentDialog?: () => void; 
}

const PaystackButton = ({ amount, email, userId, metadata: propMetadata, onSuccess, onClose, onCloseParentDialog }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;
  
  const envPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  // This is the live key the user explicitly wants to use if the environment variable isn't set or isn't a live key.
  const hardcodedUserLiveKey = "pk_live_624bc2353b87de04be7d1dc3ca3fbdeab34dfa94"; 
  const defaultTestKey = 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f'; // Fallback test key

  let paystackPublicKey: string;
  let keySourceMessage: string;

  if (envPublicKey && envPublicKey.startsWith('pk_live_')) {
    paystackPublicKey = envPublicKey;
    keySourceMessage = `Using live Paystack key from environment variable: ${envPublicKey.substring(0,10)}...`;
  } else if (envPublicKey && envPublicKey.startsWith('pk_test_')) {
    // If env var is a test key, use it but warn.
    paystackPublicKey = envPublicKey;
    keySourceMessage = `Using test Paystack key from environment variable: ${envPublicKey.substring(0,10)}... (TEST MODE)`;
    console.warn("[PaystackButton] Environment variable NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY provides a TEST key. Payments will be in test mode.");
  } else {
    // If env var is not set, or not a valid live/test key, use the hardcoded user-provided live key.
    paystackPublicKey = hardcodedUserLiveKey;
    keySourceMessage = `Using hardcoded LIVE Paystack key: ${hardcodedUserLiveKey.substring(0,10)}...`;
    if (envPublicKey) {
      console.warn(`[PaystackButton] Environment variable NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ('${envPublicKey}') is not a valid live key. Falling back to the hardcoded live key specified by the user. For production, ensure the environment variable is correctly set to your live key.`);
    } else {
      console.warn(`[PaystackButton] NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY environment variable not found. Using the hardcoded live key specified by the user. For production, set this environment variable.`);
    }
  }

  // Final sanity check: if the determined paystackPublicKey is somehow not a valid pk_ format, fall back to a known test key.
  // This should ideally not be reached if hardcodedUserLiveKey is correct.
  if (!paystackPublicKey || (!paystackPublicKey.startsWith('pk_live_') && !paystackPublicKey.startsWith('pk_test_'))) {
    console.error(`[PaystackButton] CRITICAL CONFIGURATION ERROR: The determined Paystack public key ('${paystackPublicKey}') is invalid. Defaulting to a generic test key. Please check your configuration and environment variables.`);
    paystackPublicKey = defaultTestKey;
    keySourceMessage = `Using DEFAULT FALLBACK TEST Paystack key due to critical configuration error: ${defaultTestKey.substring(0,10)}... (TEST MODE - UNINTENDED)`;
  }


  useEffect(() => {
    // This log helps confirm which key is active when the component mounts or paystackPublicKey changes.
    console.log(`[PaystackButton Active Key] ${keySourceMessage}`);
    if (paystackPublicKey.startsWith('pk_test_')) {
        console.warn("[PaystackButton] WARNING: Application is currently using a TEST Paystack key. All transactions will be in test mode and will not process real payments.");
    } else if (paystackPublicKey.startsWith('pk_live_') && keySourceMessage.includes("hardcoded")) {
        console.warn("[PaystackButton] NOTICE: Application is using a hardcoded LIVE Paystack key. For better security and flexibility, it is recommended to use environment variables for live keys in production environments.");
    }

  }, [paystackPublicKey, keySourceMessage]);


  const config: PaystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email || user?.email || '', 
    amount: amount, 
    publicKey: paystackPublicKey,
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
    // Check specifically if the key to be used for initialization is valid.
    if (!config.publicKey || (!config.publicKey.startsWith('pk_test_') && !config.publicKey.startsWith('pk_live_'))) {
      setError('Paystack payment cannot be initialized. Configuration error: Invalid public key.');
      console.error('Invalid Paystack Public Key for initialization attempt:', config.publicKey);
      return;
    }
    
    try {
      if (onCloseParentDialog) {
        onCloseParentDialog();
      }

      initializePayment(
        (response?: any) => { 
          setError(null);
          onSuccess(response); 
        },
        () => { 
          if (onClose) {
            onClose();
          }
        }
      );
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
      console.error('Payment initialization error:', err);
    }
  };

  return (
    <div className="text-center">
      {error && (
        <div className="text-red-500 text-sm mb-4 p-3 bg-red-100 border border-red-400 rounded-md">
          {error}
        </div>
      )}
      <Button
        onClick={handlePayment}
        disabled={!config.email || (!config.publicKey.startsWith('pk_test_') && !config.publicKey.startsWith('pk_live_'))}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow w-full"
      >
        {(config.email && (config.publicKey.startsWith('pk_test_') || config.publicKey.startsWith('pk_live_'))) ? 'Pay Now' : 'Processing...'}
      </Button>
    </div>
  );
};

export default PaystackButton;
