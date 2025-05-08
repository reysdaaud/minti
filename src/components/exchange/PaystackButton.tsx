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
}

const PaystackButton = ({ amount, email, userId, metadata: propMetadata, onSuccess, onClose }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;
  
  // Ensure NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is set in your .env.local file
  // e.g., NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

  if (!paystackPublicKey) {
    console.error("Paystack public key is not set. Please set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY environment variable.");
    // Optionally, render an error message or disable the button
  }

  const config: PaystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: email || '', // Paystack requires an email
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
    if (!user?.email && !email) { // Check both current user's email and passed email
      setError('Please provide a valid email address or ensure your account email is verified.');
      return;
    }
    if (!paystackPublicKey) {
      setError('Paystack payment cannot be initialized. Configuration error.');
      return;
    }
    
    try {
      initializePayment(
        (response?: any) => {
          setError(null);
          onSuccess(response);
        },
        () => {
          onClose?.();
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
        disabled={!user?.email && !email || !paystackPublicKey}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
      >
        {user || email ? 'Pay Now' : 'Processing...'}
      </Button>
    </div>
  );
};

export default PaystackButton;
