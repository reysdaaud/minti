
// src/components/exchange/WaafiButton.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WaafiButtonProps {
  amount: number; // Amount in KES (base unit for selected package)
  currency: string; // Target currency for Waafi (e.g., "SOS")
  phoneNumber: string;
  userId: string;
  metadata: {
    coins: number;
    packageName: string;
    originalAmountKES: number; // Original KES amount for reference
  };
  onCloseDialog: () => void;
}

const WaafiButton: React.FC<WaafiButtonProps> = ({
  amount,
  currency,
  phoneNumber,
  userId,
  metadata,
  onCloseDialog,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleWaafiPayment = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your Waafi phone number.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/waafi/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount, // This is the KES amount. The API route will handle conversion if needed.
          currency, // e.g., "SOS"
          phoneNumber,
          userId,
          metadata, // Will include coins, package name, original KES amount
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to initiate Waafi payment.');
      }

      toast({
        title: 'Waafi Payment Initiated',
        description: result.message || 'Please check your phone to authorize the payment.',
      });
      // Optionally close the dialog or update UI to show "pending"
      // onCloseDialog(); // Decide if dialog should close immediately or wait for callback
    } catch (error: any) {
      console.error('Waafi payment initiation error:', error);
      toast({
        title: 'Waafi Payment Error',
        description: error.message || 'Could not start Waafi payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleWaafiPayment}
      disabled={isLoading}
      className="send-money-button w-full text-sm py-2.5"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isLoading ? 'Processing...' : `Pay with Waafi`}
    </Button>
  );
};

export default WaafiButton;
