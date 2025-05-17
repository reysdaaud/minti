
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
    // Basic phone number validation (can be more sophisticated)
    if (!/^\d{9,15}$/.test(phoneNumber.replace(/\D/g,''))) { // Allows digits, common lengths
        toast({
            title: 'Invalid Phone Number',
            description: 'Please enter a valid phone number for Waafi.',
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
          amount, // This is still the KES package amount
          currency, // This should be "USD"
          phoneNumber,
          userId,
          metadata, // Contains originalAmountKES
        }),
      });

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // If not JSON, it's likely an HTML error page (e.g., 404, 500 from Next.js/Vercel)
        const responseText = await response.text();
        console.error('Waafi initiation failed. Server response was not JSON:', responseText);
        console.error('Waafi initiation status:', response.status, response.statusText);
        toast({
          title: 'Waafi Initiation Error',
          description: `Server error: ${response.status}. Please check console or try again later.`,
          variant: 'destructive',
        });
        throw new Error(`Failed to initiate Waafi payment. Server responded with ${response.status} and non-JSON content.`);
      }

      if (!response.ok) { // Checks if status is 200-299
        // This block handles JSON error responses from *your* API route
        console.error('[API /api/waafi/initiate] Waafi API Error Response (from our API route):', responseData);
        toast({
          title: 'Waafi Initiation Error',
          description: responseData.message || `Payment initiation failed. Status: ${response.status}`,
          variant: 'destructive',
        });
        throw new Error(responseData.message || `Failed to initiate payment with Waafi. Status: ${response.status}`);
      }

      // At this point, response.ok is true, and responseData should be the success JSON from your API route
      toast({
        title: 'Waafi Payment Initiated',
        description: responseData.message || 'Please check your phone to authorize the payment.',
      });
      // onCloseDialog(); // You might want to close the dialog here, or keep it open
    } catch (error: any) {
      // This catch block handles network errors or errors thrown above
      console.error('Waafi payment button error catch block:', error.message);
      // Avoid duplicate toasts if already shown
      if (!toast.toasts.find(t => t.title === 'Waafi Initiation Error')) { 
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

