'use client';

import type { FC } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Loader2, CreditCard } from 'lucide-react';

// Read the environment variable for Paystack public key
const PAYSTACK_PUBLIC_KEY_FROM_ENV = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const FALLBACK_TEST_KEY = 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f';

let effectivePaystackPublicKey = PAYSTACK_PUBLIC_KEY_FROM_ENV;

if (!PAYSTACK_PUBLIC_KEY_FROM_ENV) {
  if (typeof window !== 'undefined') { // Ensure console.warn only runs client-side
    console.warn(
      "Paystack public key (NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) is not set in environment variables. " +
      `Using fallback test key: ${FALLBACK_TEST_KEY}. Ensure you set your actual public key for production.`
    );
  }
  effectivePaystackPublicKey = FALLBACK_TEST_KEY;
}


interface TopUpPlan {
  id: string;
  coins: number;
  amount: number; // Amount in KES (e.g., 100 for KES 100)
  description: string;
}

const topUpPlans: TopUpPlan[] = [
  { id: 'plan1', coins: 100, amount: 100, description: 'Get 100 Coins for KES 100' },
  { id: 'plan2', coins: 250, amount: 220, description: 'Get 250 Coins for KES 220 (Save KES 30)' },
  { id: 'plan3', coins: 500, amount: 400, description: 'Get 500 Coins for KES 400 (Save KES 100)' },
  { id: 'plan4', coins: 1000, amount: 750, description: 'Get 1000 Coins for KES 750 (Best Value!)' },
];

interface TopUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (coinsPurchased: number) => void;
}

const TopUpDialog: FC<TopUpDialogProps> = ({ isOpen, onClose: onDialogCloseProp, onPaymentSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(topUpPlans[0].id);
  const [isProcessing, setIsProcessing] = useState(false);

  // Effect to reset processing state if the dialog is closed externally
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);

  const selectedPlan = topUpPlans.find(p => p.id === selectedPlanId);

  const config = {
    reference: new Date().getTime().toString(),
    email: user?.email || 'test@example.com', 
    amount: selectedPlan ? selectedPlan.amount * 100 : 0, 
    publicKey: effectivePaystackPublicKey || FALLBACK_TEST_KEY, // Ensure publicKey is never undefined or empty
    currency: 'KES',
  };

  const initializePayment = usePaystackPayment(config);

  const handleBuyCoins = () => {
    if (!selectedPlan) {
      toast({
        title: 'No plan selected',
        description: 'Please select a top-up plan.',
        variant: 'destructive',
      });
      return;
    }
    if (!user?.email) {
        toast({
            title: 'User email not found',
            description: 'Please ensure you are properly signed in.',
            variant: 'destructive',
        });
        return;
    }
    if (!config.publicKey) {
        toast({
            title: 'Paystack Configuration Error',
            description: 'Paystack public key is missing. Please contact support.',
            variant: 'destructive',
        });
        setIsProcessing(false);
        return;
    }

    setIsProcessing(true); // Indicate processing started

    // Close this dialog *before* Paystack modal opens
    onDialogCloseProp(); 

    initializePayment({
      onSuccess: (reference) => {
        console.log('Paystack success reference:', reference);
        onPaymentSuccess(selectedPlan.coins);
        // setIsProcessing(false); // Not needed as dialog is closed, component might be unmounted
      },
      onClose: () => { // Paystack modal closed by user
        toast({
          title: 'Payment Cancelled',
          description: 'The payment process was not completed.',
          variant: 'warning',
        });
        // setIsProcessing(false); // Not needed as dialog is closed
      },
      onError: (error) => { 
        console.error('Paystack payment error:', error);
        toast({
            title: 'Payment Failed',
            description: 'An error occurred during payment. Please try again.',
            variant: 'destructive',
        });
        // setIsProcessing(false); // Not needed as dialog is closed
      }
    });
  };

  if (!isOpen) return null;

  return (
    <DialogContent className="sm:max-w-md md:max-w-lg p-0 glassmorphic-dialog">
      <DialogHeader className="p-6 pb-4">
        <DialogTitle className="text-2xl font-bold text-center text-primary">Top Up Your Wallet</DialogTitle>
        <DialogDescription className="text-center text-muted-foreground">
          Choose a coin package below to add funds to your account.
        </DialogDescription>
      </DialogHeader>
      
      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
        <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId} className="space-y-3">
          {topUpPlans.map((plan) => (
            <Label
              key={plan.id}
              htmlFor={plan.id}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all
                          ${selectedPlanId === plan.id ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={plan.id} id={plan.id} />
                <div>
                  <span className="font-semibold text-foreground">{plan.coins.toLocaleString()} Coins</span>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>
              <span className="text-lg font-bold text-primary">KES {plan.amount.toLocaleString()}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <DialogFooter className="p-6 border-t border-border/20">
        <Button variant="outline" onClick={() => {
          setIsProcessing(false); // Ensure processing is stopped if cancelled
          onDialogCloseProp();
        }} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          onClick={handleBuyCoins} 
          disabled={!selectedPlanId || isProcessing || !config.publicKey}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          {isProcessing ? 'Processing...' : `Buy ${selectedPlan?.coins.toLocaleString() || ''} Coins`}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default TopUpDialog;
