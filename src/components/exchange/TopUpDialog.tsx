'use client';

import type { FC } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react'; // Loader2 removed as isProcessing is removed

// Effective Paystack Public Key Logic (remains unchanged)
const FALLBACK_TEST_PUBLIC_KEY = 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f';
let effectivePaystackPublicKey = FALLBACK_TEST_PUBLIC_KEY;

if (typeof window !== 'undefined') {
  const envPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const liveKeyFromUser = "sk_live_e9cd71a7fa828e96e65ea8a2480756125506421e"; // User provided key

  // Prioritize user-provided live key if it seems valid (starts with pk_live_ or sk_live_ for testing this scenario)
  // WARNING: Using secret keys (sk_live_) on the client-side is a MAJOR SECURITY RISK.
  // This is ONLY for temporary user testing as per their request.
  // In a production environment, this MUST be a public key (pk_live_ or pk_test_).
  if (liveKeyFromUser && (liveKeyFromUser.startsWith('pk_live_') || liveKeyFromUser.startsWith('sk_live_'))) {
    effectivePaystackPublicKey = liveKeyFromUser.startsWith('sk_live_') 
        ? liveKeyFromUser // Allow sk_live for user's specific testing request
        : liveKeyFromUser; // Use pk_live_
    if (liveKeyFromUser.startsWith('sk_live_')) {
        console.warn(
            `[Paystack Setup - CRITICAL SECURITY WARNING] Using a SECRET KEY ('${liveKeyFromUser.substring(0,10)}...') on the client side. ` +
            `This is for TESTING ONLY as requested and is a SEVERE SECURITY RISK. Remove before production.`
        );
    } else {
        console.log(`[Paystack Setup] Using user-provided live key (public part): ${effectivePaystackPublicKey.substring(0,10)}...`);
    }
  } else if (envPublicKey && (envPublicKey.startsWith('pk_live_') || envPublicKey.startsWith('pk_test_'))) {
    effectivePaystackPublicKey = envPublicKey;
    console.log(`[Paystack Setup] Using Paystack public key from environment: ${effectivePaystackPublicKey.substring(0,10)}...`);
  } else if (envPublicKey && envPublicKey.startsWith('sk_')) {
    console.warn(
      `[Paystack Setup - WARNING] Environment variable NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ('${envPublicKey.substring(0,10)}...') contains a SECRET KEY. ` +
      `This is a security risk and invalid for client-side usage. Falling back to test public key: ${FALLBACK_TEST_PUBLIC_KEY.substring(0,10)}...` +
      `\nPlease use your Paystack PUBLIC KEY (pk_live_... or pk_test_...) in NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.`
    );
    effectivePaystackPublicKey = FALLBACK_TEST_PUBLIC_KEY;
  } else if (envPublicKey) {
    console.warn(
      `[Paystack Setup - WARNING] Invalid Paystack key in NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: '${envPublicKey.substring(0,10)}...'. ` +
      `Falling back to test public key: ${FALLBACK_TEST_PUBLIC_KEY.substring(0,10)}...` +
      `\nPlease ensure it is a valid Paystack PUBLIC KEY (pk_live_... or pk_test_...).`
    );
    effectivePaystackPublicKey = FALLBACK_TEST_PUBLIC_KEY;
  } else {
    console.warn(
      `[Paystack Setup - WARNING] NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set. ` +
      `Falling back to test public key: ${FALLBACK_TEST_PUBLIC_KEY.substring(0,10)}... (or user-provided if valid)` +
      `\nFor live transactions, please set your Paystack PUBLIC KEY in this environment variable.`
    );
    // effectivePaystackPublicKey is already set to FALLBACK_TEST_PUBLIC_KEY or user's key
  }
}


interface TopUpPlan {
  id: string;
  coins: number;
  amount: number; // Amount in KES
  description: string;
}

const topUpPlans: TopUpPlan[] = [
  { id: 'plan1', coins: 100, amount: 100, description: 'Get 100 Coins for KES 100' },
  { id: 'plan2', coins: 250, amount: 220, description: 'Get 250 Coins for KES 220 (Save KES 30)' },
  { id: 'plan3', coins: 500, amount: 400, description: 'Get 500 Coins for KES 400 (Save KES 100)' },
  { id: 'plan4', coins: 1000, amount: 750, description: 'Get 1000 Coins for KES 750 (Best Value!)' },
];

interface TopUpDialogProps {
  onClose: () => void;
  onPaymentSuccess: (coinsPurchased: number) => void;
}

const TopUpDialog: FC<TopUpDialogProps> = ({ onClose: onDialogCloseProp, onPaymentSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(topUpPlans[0].id);

  const selectedPlan = topUpPlans.find(p => p.id === selectedPlanId);

  // Config is now assembled just before payment initialization
  const initializePayment = usePaystackPayment(); // Initialize hook without config initially

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
    // Critical check for public key format, allow sk_live_ for testing as requested
    if (!effectivePaystackPublicKey || !(effectivePaystackPublicKey.startsWith('pk_test_') || effectivePaystackPublicKey.startsWith('pk_live_') || effectivePaystackPublicKey.startsWith('sk_live_'))) {
        toast({
            title: 'Paystack Configuration Error',
            description: `A valid Paystack key is missing or invalid. Please check setup or contact support. Key used: ${effectivePaystackPublicKey ? effectivePaystackPublicKey.substring(0,10)+'...' : 'Not found'}.`,
            variant: 'destructive',
        });
        return;
    }

    const paymentConfig = {
        reference: new Date().getTime().toString(),
        email: user.email,
        amount: selectedPlan.amount * 100, // Paystack amount is in kobo/cents
        publicKey: effectivePaystackPublicKey,
        currency: 'KES',
    };

    // Close the app's dialog *before* initializing Paystack payment
    onDialogCloseProp();

    initializePayment({
        ...paymentConfig, // Spread the dynamic config here
        onSuccess: (reference) => {
            console.log('Paystack success reference:', reference);
            if (selectedPlan) {
                onPaymentSuccess(selectedPlan.coins);
            }
            toast({
                title: 'Payment Successful',
                description: `Purchased ${selectedPlan?.coins.toLocaleString()} coins. Ref: ${reference.transaction}`,
            });
        },
        onClose: () => {
            // This callback is invoked when the Paystack modal is closed by the user
            // or after onSuccess/onError. If it was closed by user before completion,
            // we might want a toast, but onSuccess/onError toasts are usually sufficient.
            console.log('Paystack payment window closed.');
            // No automatic toast here to avoid duplicates if success/error already showed one.
        },
        onError: (error) => {
            console.error('Paystack payment error:', error);
            toast({
                title: 'Payment Failed',
                description: (error as any)?.message || 'An error occurred during payment. Please try again.',
                variant: 'destructive',
            });
        }
    });
  };

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
        <Button variant="outline" onClick={onDialogCloseProp}>
          Cancel
        </Button>
        <Button
          onClick={handleBuyCoins}
          disabled={!selectedPlanId || !user?.email?.includes('@') || !(effectivePaystackPublicKey.startsWith('pk_test_') || effectivePaystackPublicKey.startsWith('pk_live_') || effectivePaystackPublicKey.startsWith('sk_live_'))}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {`Buy ${selectedPlan?.coins.toLocaleString() || ''} Coins`}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default TopUpDialog;
