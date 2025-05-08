
// top-level comment
'use client';

import type { FC } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { CreditCard, X } from 'lucide-react';

// --- Paystack Key Configuration ---
// WARNING: The user has explicitly requested to use the following LIVE key for testing.
// This is a pk_live_ key which is meant for client-side use.
// Ensure this key is correct and active on the Paystack dashboard.
const USER_REQUESTED_PAYSTACK_PUBLIC_KEY = "pk_live_624bc2353b87de04be7d1dc3ca3fbdeab34dfa94";
let effectivePaystackPublicKey = USER_REQUESTED_PAYSTACK_PUBLIC_KEY;

if (typeof window !== 'undefined') {
  console.log(`[Paystack Setup] Attempting to use EXPLICITLY DEFINED Paystack Public Key: ${effectivePaystackPublicKey.substring(0,10)}...`);
  if (!effectivePaystackPublicKey.startsWith('pk_live_') && !effectivePaystackPublicKey.startsWith('pk_test_')) {
    console.error(
      `[Paystack Setup - CRITICAL ERROR] The explicitly defined key '${effectivePaystackPublicKey.substring(0,10)}...' is NOT a valid public key (pk_live_ or pk_test_). ` +
      `Payment will likely fail. Please verify the key.`
    );
  } else if (effectivePaystackPublicKey.startsWith('pk_test_')) {
     console.warn(
        `[Paystack Setup] Using a TEST Paystack Public Key: ${effectivePaystackPublicKey.substring(0,10)}... Ensure this is intended.`
    );
  }
}
// --- End Paystack Key Configuration ---


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

  const initializePayment = usePaystackPayment(); 

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
    
    if (!effectivePaystackPublicKey || !(effectivePaystackPublicKey.startsWith('pk_test_') || effectivePaystackPublicKey.startsWith('pk_live_'))) {
        toast({
            title: 'Paystack Configuration Error',
            description: `A valid Paystack public key is missing or invalid. Please check setup or contact support. Key used: ${effectivePaystackPublicKey ? effectivePaystackPublicKey.substring(0,10) : 'Not found'}...`,
            variant: 'destructive',
        });
        console.error("FATAL: Invalid or missing Paystack public key for payment initialization:", effectivePaystackPublicKey);
        return;
    }

    const paymentConfig = { // Ensure amount is in kobo/cents i.e. the smallest unit of your currency.
        reference: new Date().getTime().toString(),
        email: user.email,
        amount: selectedPlan.amount * 100, // Paystack amount is in kobo/cents
        publicKey: effectivePaystackPublicKey,
        currency: 'KES', // Currency for Paystack
    };
    
    console.log("[Paystack Payment] Initializing payment with config:", { 
      ...paymentConfig, 
      publicKey: `${paymentConfig.publicKey.substring(0,10)}...` // Avoid logging full key
    });

    onDialogCloseProp(); // Close the app's dialog *before* initializing Paystack payment

    initializePayment({
        ...paymentConfig,
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
            console.log('Paystack payment window closed by user.');
            // Do not show an error toast if the user intentionally closes the Paystack modal.
            // toast({
            //     title: 'Payment Canceled',
            //     description: 'The payment process was canceled.',
            //     variant: 'default', 
            // });
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

  // Effect to log the key being used when component mounts or key changes
  useEffect(() => {
    if (typeof window !== 'undefined') { // Ensure this runs client-side
        console.log(`[TopUpDialog] Effective Paystack Public Key: ${effectivePaystackPublicKey.substring(0,10)}...`);
         if (!effectivePaystackPublicKey.startsWith('pk_live_') && !effectivePaystackPublicKey.startsWith('pk_test_')) {
            console.error("[TopUpDialog] CRITICAL: Invalid Paystack key format detected.");
        }
    }
  }, []);


  return (
    <DialogContent className="sm:max-w-md md:max-w-lg p-0 glassmorphic-dialog overflow-hidden">
      <DialogHeader className="p-6 pb-4 flex flex-row justify-between items-center">
        <DialogTitle className="text-2xl font-bold text-center text-primary flex-grow">Top Up Your Wallet</DialogTitle>
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>
      </DialogHeader>
      <DialogDescription className="text-center text-muted-foreground px-6 pb-2 -mt-2">
          Choose a coin package below to add funds to your account.
      </DialogDescription>
      
      <div className="p-6 pt-2 space-y-6 max-h-[calc(60vh-50px)] overflow-y-auto">
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
          disabled={!selectedPlanId || !user?.email?.includes('@') || !(effectivePaystackPublicKey.startsWith('pk_test_') || effectivePaystackPublicKey.startsWith('pk_live_'))}
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
