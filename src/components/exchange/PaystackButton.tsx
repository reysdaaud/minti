// src/components/exchange/PaystackButton.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase'; 
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaystackButtonProps {
  amount: number; // Amount in KES (major unit), server.js will convert to kobo/cents
  email: string; 
  userId: string;
  metadata: { 
    coins: number;
    packageName: string;
  };
  onClose?: () => void; 
}

const PaystackButton = ({ amount, email, userId, metadata: propMetadata, onClose }: PaystackButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [buttonText, setButtonText] = useState('Pay Now');
  const { toast } = useToast();

  const user = auth.currentUser;

  useEffect(() => {
    let currentError = null;
    let currentButtonText = 'Pay Now';
    let currentDisabled = false;

    if (!email) {
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

  }, [email, user]);
  
  const handlePayment = async () => {
    if (isButtonDisabled || error) {
        if (!email) setError("A valid email address is required.");
        else if (!user) setError("You need to be logged in.");
        return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        email: email,
        amount: amount, // Amount in KES (major unit). server.js will multiply by 100.
        metadata: { // This metadata is sent to your backend
          userId: userId,
          coins: propMetadata.coins,
          packageName: propMetadata.packageName,
        }
      };

      // Ensure your backend server (e.g., server.js at http://localhost:5000) is running to handle this request.
      const backendInitializeUrl = process.env.NEXT_PUBLIC_PAYMENT_BACKEND_URL || 'http://localhost:5000/paystack/initialize';

      const response = await fetch(backendInitializeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Payment initialization failed with status: ${response.statusText || response.status}` }));
        throw new Error(errorData.message || `Payment initialization failed: ${response.statusText || response.status}`);
      }

      const responseData = await response.json();

      if (responseData.status && responseData.data && responseData.data.authorization_url) {
        // Open Paystack checkout in a new tab
        window.open(responseData.data.authorization_url, '_blank');
        toast({
          title: "Redirecting to Paystack",
          description: "Complete your payment in the new tab. Your balance will update after successful payment and verification.",
          duration: 7000,
        });
        if (onClose) { 
          onClose(); // Close the dialog after opening Paystack in a new tab
        }
      } else {
        throw new Error(responseData.message || "Failed to get authorization URL from Paystack.");
      }

    } catch (err: any) {
      console.error('[PaystackButton] Payment initialization error:', err);
      setError(err.message || 'Failed to initialize payment. Please check your connection or try again.');
      toast({
        title: "Payment Error",
        description: err.message || 'Failed to initialize payment. Please check console for details.',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false);
      // onClose is called specifically after successful new tab opening, or if an error before that point requires dialog closure.
      // If the error is just a network blip and the dialog should stay open for retry, onClose might not be called here.
      // Current logic: onClose is called if new tab is opened. If error before, dialog stays for user to see error.
    }
  };

  return (
    <div className="text-center">
      {error && !isButtonDisabled && ( 
        <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          {error}
        </div>
      )}
      <Button
        onClick={handlePayment}
        disabled={isButtonDisabled || isLoading}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-shadow w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        {isLoading ? 'Processing...' : buttonText}
      </Button>
      {isButtonDisabled && email && !user && (
         <p className="text-xs text-destructive mt-2">Please log in to complete the payment.</p>
      )}
       {isButtonDisabled && !email && (
         <p className="text-xs text-destructive mt-2">A valid email address is required to proceed.</p>
      )}
    </div>
  );
};

export default PaystackButton;

    