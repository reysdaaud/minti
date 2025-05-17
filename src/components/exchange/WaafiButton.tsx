
// src/components/exchange/WaafiButton.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WaafiButtonProps {
  amount: number; // Amount in KES (base unit for selected package)
  currency: string; // Target currency for Waafi (e.g., "USD")
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
    let responseData; 

    try {
      const response = await fetch('/api/waafi/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          phoneNumber,
          userId,
          metadata,
        }),
      });

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // If not JSON, it's an unexpected server error (like an HTML page from a crash or misconfiguration)
        const responseText = await response.text();
        console.error('Waafi initiation failed. Server response was not JSON:', responseText);
        console.error('Waafi initiation status:', response.status, response.statusText);
        throw new Error(`Failed to initiate Waafi payment. Server responded with ${response.status}. Check console for details.`);
      }

      if (!response.ok) { // Checks if status is 200-299
        console.error('[API /api/waafi/initiate] Waafi API Error Response (from our API route):', responseData);
        // Use message from JSON error response if available
        throw new Error(responseData.message || `Failed to initiate payment with Waafi. Status: ${response.status}`);
      }

      // At this point, response.ok is true, and responseData should be the success JSON
      // No need to check responseData.success explicitly if your API route correctly uses HTTP status codes
      // For example, a 500 status (like for WCFG01) would mean !response.ok is true.
      // If your API route *always* returns 200 OK but uses a 'success: false' flag in the JSON,
      // then you would add: if (!responseData.success) { throw new Error(responseData.message || ...); }

      toast({
        title: 'Waafi Payment Initiated',
        description: responseData.message || 'Please check your phone to authorize the payment.',
      });
      // onCloseDialog(); // Keep dialog open for now
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
      disabled={isLoading || !phoneNumber.trim()}
      className="send-money-button w-full text-sm py-2.5"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isLoading ? 'Processing...' : `Pay with Waafi`}
    </Button>
  );
};

export default WaafiButton;
