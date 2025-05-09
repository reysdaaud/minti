// src/components/exchange/PaystackButton.tsx
"use client";

import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { auth } from '../../lib/firebase'; // Adjusted path
import { Button } from '@/components/ui/button'; // Using ShadCN button for consistency

type Currency = 'NGN' | 'GHS' | 'USD' | 'KES';

interface CustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

interface PaystackMetadata { // Renamed to avoid conflict with component prop
  custom_fields: CustomField[];
}

interface PaystackConfig {
  reference: string;
  email: string;
  amount: number; // Expected in cents
  publicKey: string;
  currency: Currency;
  metadata: PaystackMetadata;
}

interface PaystackButtonProps {
  amount: number; // Expected in cents
  email: string | null; // Can be null
  userId: string;
  metadata: { // This is the prop passed to the component
    coins: number;
    packageName: string;
  };
  onSuccess: (response: any) => Promise<void>;
  onClose?: () => void;
  onCloseParentDialog?: () => void; // New prop
}

const PaystackButton = ({ amount, email, userId, metadata: propMetadata, onSuccess, onClose, onCloseParentDialog }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;
  
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f'; // Fallback to test key if not set

  if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
    console.warn("Paystack public key is not set in environment variables. Using default test key.");
  }


  const config: PaystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email || user?.email || '', // Paystack requires an email, prioritize passed email, then user's
    amount: amount, // Amount is already in KES cents (passed from Pay.tsx)
    publicKey: paystackPublicKey,
    currency: 'KES',
    metadata: { // This is Paystack's metadata object
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: userId
        },
        {
          display_name: "Coins",
          variable_name: "coins",
          value: propMetadata.coins.toString() // Use actual coins from component prop
        },
        {
          display_name: "Package",
          variable_name: "package_name", // Changed variable_name to be more specific
          value: propMetadata.packageName
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    setError(null); // Clear previous errors
    if (!config.email) { 
      setError('Please provide a valid email address or ensure your account email is verified.');
      return;
    }
    if (!paystackPublicKey || !paystackPublicKey.startsWith('pk_')) {
      setError('Paystack payment cannot be initialized. Configuration error: Invalid public key.');
      console.error('Invalid Paystack Public Key:', paystackPublicKey);
      return;
    }
    
    try {
      // Close the parent ShadCN dialog first
      if (onCloseParentDialog) {
        onCloseParentDialog();
      }

      // Then initialize Paystack payment
      initializePayment(
        (response?: any) => { // onSuccess callback for Paystack
          setError(null);
          onSuccess(response); // Call the onSuccess prop passed from Pay.tsx
        },
        () => { // onClose callback for Paystack (user closed Paystack modal)
          // The parent dialog is already closed. If any specific action needed when Paystack modal is closed by user, do it here.
          // e.g., re-open the coin selection dialog if desired, or call the original onClose prop if it has other duties.
          if (onClose) {
            onClose();
          }
        }
      );
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
      console.error('Payment initialization error:', err);
       // If initialization fails, the parent dialog might have been closed.
       // Consider re-opening it or showing a persistent error message.
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
        disabled={!config.email || !paystackPublicKey.startsWith('pk_')}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow w-full" // Make button full width
      >
        {config.email && paystackPublicKey.startsWith('pk_') ? 'Pay Now' : 'Processing...'}
      </Button>
    </div>
  );
};

export default PaystackButton;
