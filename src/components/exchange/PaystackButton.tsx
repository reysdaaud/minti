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
  onClose?: () => void; // Paystack's own modal close
  onCloseParentDialog?: () => void; // To close the top-up dialog in UserActions.tsx
}

const PaystackButton = ({ amount, email, userId, metadata: propMetadata, onSuccess, onClose, onCloseParentDialog }: PaystackButtonProps) => {
  const [componentError, setComponentError] = useState<string | null>(null); // Renamed from error to avoid conflict with hook error
  const user = auth.currentUser;
  
  const envPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  // Updated hardcoded live key as per user request
  const hardcodedUserLiveKey = "pk_live_624bc2353b87de04be7d1dc3ca3fbdeab34dfa94"; 

  let paystackKeyToUse: string = ''; // Initialize to empty string
  let keySourceMessage: string = '';

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
    console.warn("[PaystackButton] Environment variable NEXT_PUBLIC_PAYstack_PUBLIC_KEY provides a TEST key. Payments will be in test mode.");
  } else {
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
    const originalKey = paystackKeyToUse;
    paystackKeyToUse = ''; // Set to empty to ensure it's treated as invalid
    keySourceMessage = `CRITICAL CONFIGURATION ERROR: No valid Paystack key found. Original attempted key: '${originalKey || 'undefined'}'. Payments will be disabled. Please check your configuration and environment variables.`;
    console.error(`[PaystackButton] ${keySourceMessage}`);
  }


  useEffect(() => {
    console.log(`[PaystackButton Active Key Source] ${keySourceMessage}`);
    console.log(`[PaystackButton Effective Key Used] ${paystackKeyToUse ? paystackKeyToUse.substring(0,10) + '...' : 'N/A (Invalid/Missing)'}`);
    if (paystackKeyToUse.startsWith('pk_test_')) {
        console.warn("[PaystackButton] WARNING: Application is currently using a TEST Paystack key. All transactions will be in test mode and will not process real payments.");
    } else if (paystackKeyToUse.startsWith('sk_live_')) {
         console.error("[PaystackButton - CRITICAL USAGE] Attempting to use a LIVE SECRET KEY for client-side Paystack initialization. This is highly insecure and against Paystack's recommended practices. This configuration is due to explicit user instruction for testing and MUST be changed for any production environment. Paystack's client library may not support secret keys for initialization, potentially leading to 'invalid key' errors or unexpected behavior.");
    } else if (paystackKeyToUse.startsWith('pk_live_')) {
        console.log("[PaystackButton] Application is using a LIVE PUBLIC Paystack key.");
    }
  }, [paystackKeyToUse, keySourceMessage]);


  const config: PaystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email || user?.email || '', 
    amount: amount, 
    publicKey: paystackKeyToUse,
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
    setComponentError(null); 
    if (!config.email) { 
      setComponentError('Please provide a valid email address or ensure your account email is verified.');
      return;
    }
    
    if (!config.publicKey || (!config.publicKey.startsWith('pk_test_') && !config.publicKey.startsWith('pk_live_') && !config.publicKey.startsWith('sk_live_'))) {
      setComponentError('Paystack payment cannot be initialized. Configuration error: Invalid or missing Paystack key.');
      console.error('[PaystackButton] Invalid Paystack Key for initialization attempt:', config.publicKey);
      return;
    }
    
    if (onCloseParentDialog) {
        onCloseParentDialog();
    }

    try {
      if (config.publicKey.startsWith('sk_live_')) {
        console.warn(`[PaystackButton - PAYMENT ATTEMPT WITH SECRET KEY] Initializing payment with a SECRET KEY ('${config.publicKey.substring(0,10)}...') on the client side. This is for TESTING ONLY as requested and is a SEVERE SECURITY RISK. This may not work as Paystack's client-side library expects a public key and can result in an 'invalid key' error from Paystack.`);
      }

      initializePayment(
        (response?: any) => { 
          setComponentError(null);
          onSuccess(response); 
        },
        () => { 
          if (onClose) { 
            onClose();
          }
        }
      );
    } catch (err) {
      setComponentError('Failed to initialize payment. Please try again.');
      console.error('[PaystackButton] Payment initialization error:', err);
    }
  };

  const isKeyConfiguredAndValid = !!config.publicKey && (config.publicKey.startsWith('pk_test_') || config.publicKey.startsWith('pk_live_') || config.publicKey.startsWith('sk_live_'));
  const isUserEmailAvailable = !!user?.email;

  let buttonText = 'Pay Now';
  if (!isKeyConfiguredAndValid) {
    buttonText = 'Paystack Key Error';
  } else if (!isUserEmailAvailable) {
    buttonText = 'Verify Email to Pay';
  }


  return (
    <div className="text-center">
      {componentError && (
        <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          {componentError}
        </div>
      )}
      <Button
        onClick={handlePayment}
        disabled={!isKeyConfiguredAndValid || !isUserEmailAvailable}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow w-full"
      >
        {buttonText}
      </Button>
       {!isKeyConfiguredAndValid && (
         <p className="text-xs text-destructive mt-2">A valid Paystack key is not configured. Payments are disabled. Please check application setup or console for details.</p>
       )}
       {isKeyConfiguredAndValid && !isUserEmailAvailable && (
         <p className="text-xs text-destructive mt-2">Please ensure your email is verified to make a purchase.</p>
       )}
    </div>
  );
};

export default PaystackButton;
