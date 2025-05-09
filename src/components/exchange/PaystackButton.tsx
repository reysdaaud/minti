// src/components/exchange/PaystackButton.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { auth } from '@/lib/firebase'; // Path to firebase config

type Currency = 'NGN' | 'GHS' | 'USD' | 'KES';

interface CustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

interface PaystackConfig {
  reference: string;
  email: string;
  amount: number; // Amount in smallest currency unit (e.g., kobo, cents)
  publicKey: string;
  currency: Currency;
  metadata: {
    custom_fields: CustomField[];
  };
}

interface PaystackButtonProps {
  amount: number; // Amount in KES cents
  email: string; // User's email, ensured to be a non-null string by caller
  userId: string;
  metadata: { // Metadata passed from Pay.tsx
    coins: number;
    packageName: string;
  };
  onSuccess: (response: any) => Promise<void>; // Callback on successful payment
  onClose?: () => void; // Optional: Paystack's own modal close callback
}

const PaystackButton = ({ amount, email, userId, metadata: propMetadata, onSuccess, onClose }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const [buttonText, setButtonText] = useState('Pay Now');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  
  const user = auth.currentUser; // Firebase authenticated user
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  useEffect(() => {
    let currentError = null;
    let currentButtonText = 'Pay Now';
    let currentDisabled = false;

    if (!paystackPublicKey) {
      currentError = "Payment gateway is not configured. Please contact support.";
      currentButtonText = 'Payment Unavailable';
      currentDisabled = true;
      console.error("[PaystackButton] Paystack public key (NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) is not defined.");
    } else if (!email) {
      currentError = "A valid email address is required for payment.";
      currentButtonText = 'Email Required';
      currentDisabled = true;
    } else if (!user) {
      currentError = "You need to be logged in to make a payment.";
      currentButtonText = 'Login Required';
      currentDisabled = true;
    }
    
    setError(currentError);
    setButtonText(currentButtonText);
    setIsButtonDisabled(currentDisabled);

  }, [paystackPublicKey, email, user]);
  
  const config: PaystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: amount, // Amount is expected in KES cents
    publicKey: paystackPublicKey || '', // Fallback to empty string if undefined
    currency: 'KES',
    metadata: {
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: userId
        },
        {
          display_name: "Coins To Add",
          variable_name: "coins_to_add",
          value: propMetadata.coins.toString()
        },
        {
          display_name: "Package Name",
          variable_name: "package_name",
          value: propMetadata.packageName
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    // Re-check conditions just before payment attempt, although useEffect should cover it.
    if (isButtonDisabled || error) {
        // If there's an existing error or button is meant to be disabled,
        // ensure the error message reflects the current state if it changed.
        if (!paystackPublicKey) setError("Payment gateway is not configured.");
        else if (!email) setError("A valid email address is required.");
        else if (!user) setError("You need to be logged in.");
        return;
    }
    setError(null); // Clear previous transient errors if any

    try {
      initializePayment(
        (response?: any) => { // onSuccess callback from usePaystackPayment
          onSuccess(response); // Call the onSuccess prop passed to PaystackButton
        },
        () => { // onClose callback from usePaystackPayment (when Paystack modal is closed by user)
          if (onClose) {
            onClose();
          }
        }
      );
    } catch (err) {
      const paymentError = 'Failed to initialize payment. Please try again.';
      setError(paymentError);
      console.error('[PaystackButton] Payment initialization error:', err);
    }
  };

  return (
    <div className="text-center">
      {error && !isButtonDisabled && ( // Show error only if it's not a permanent disabled state error
        <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={isButtonDisabled}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText}
      </button>
      {/* Persistent messages for disabled states */}
      {isButtonDisabled && paystackPublicKey && !email && (
         <p className="text-xs text-destructive mt-2">A valid email address is required to proceed.</p>
      )}
       {isButtonDisabled && paystackPublicKey && email && !user && (
         <p className="text-xs text-destructive mt-2">Please log in to complete the payment.</p>
      )}
       {isButtonDisabled && !paystackPublicKey && (
         <p className="text-xs text-destructive mt-2">Payment gateway is currently unavailable. Please contact support.</p>
      )}
    </div>
  );
};

export default PaystackButton;
