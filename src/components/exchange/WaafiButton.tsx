
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
    let responseData: any; 

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
        const responseText = await response.text();
        console.error('Waafi initiation failed. Server response was not JSON:', responseText);
        console.error('Waafi initiation status:', response.status, response.statusText);
        throw new Error(`Failed to initiate Waafi payment. Server responded with ${response.status} and non-JSON content. Check server logs and console for details.`);
      }

      if (!response.ok) { // Checks if status is 200-299
        console.error('[API /api/waafi/initiate] Waafi API Error Response (from our API route):', responseData);
        // If responseData is empty or doesn't have a message, provide a more generic error.
        // Also, include the status code in the message.
        const serverMessage = responseData && typeof responseData.message === 'string' 
                              ? responseData.message 
                              : `Received status ${response.status}. Check server logs.`;
        const errorMessage = `Waafi payment initiation failed: ${serverMessage}`;
        
        toast({
          title: 'Waafi Initiation Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw new Error(errorMessage);
      }

      // At this point, response.ok is true, and responseData should be the success JSON from your API route
      toast({
        title: 'Waafi Payment Initiated',
        description: responseData.message || 'Please check your phone to authorize the payment.',
      });
      // Consider if onCloseDialog(); should be called here or after user interacts with Waafi prompt
    } catch (error: any) {
      console.error('Waafi payment button error catch block:', error);
      // The toast for specific errors is now handled above if !response.ok
      // This catch block will handle network errors or other unexpected issues.
      if (!toast.toasts.find(t => t.title === 'Waafi Initiation Error')) { // Avoid duplicate toasts
        toast({
          title: 'Waafi Payment Error',
          description: error.message || 'Could not start Waafi payment. Please try again.',
          variant: 'destructive',
        });
      }
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
