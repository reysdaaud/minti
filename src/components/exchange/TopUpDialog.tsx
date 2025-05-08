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
const FALLBACK_TEST_PUBLIC_KEY = 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f'; // Standard Paystack test public key

let effectivePaystackPublicKey = PAYSTACK_PUBLIC_KEY_FROM_ENV;
const varName = 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY';

if (!effectivePaystackPublicKey || effectivePaystackPublicKey.trim() === "") {
  if (typeof window !== 'undefined') {
    console.warn(
      `[Paystack Setup] Environment variable ${varName} is not set or is empty.\n` +
      `Using fallback TEST public key: ${FALLBACK_TEST_PUBLIC_KEY}.\n` +
      `To use your own LIVE public key for actual transactions:\n` +
      `1. Create or open the '.env.local' file in your project root.\n` +
      `2. Add the line: ${varName}=your_paystack_public_live_key (e.g., pk_live_xxxxxxxxxxxx).\n` +
      `3. Restart your Next.js development server (e.g., 'npm run dev').\n` +
      `For production, ensure ${varName} is set in your deployment environment's variables with your live public key.`
    );
  }
  effectivePaystackPublicKey = FALLBACK_TEST_PUBLIC_KEY;
} else if (effectivePaystackPublicKey.startsWith('sk_')) {
  // Warn if a secret key is mistakenly used
  if (typeof window !== 'undefined') {
    console.warn(
      `[Paystack Setup] The provided ${varName} ('${effectivePaystackPublicKey.substring(0, 10)}...') starts with 'sk_'.\n` +
      `This appears to be a SECRET KEY. The client-side Paystack SDK requires a PUBLIC KEY (e.g., 'pk_live_...' or 'pk_test_...').\n` +
      `Using fallback TEST public key: ${FALLBACK_TEST_PUBLIC_KEY} to prevent accidental exposure of secret key.\n` +
      `Please update ${varName} with your correct Paystack PUBLIC key.`
    );
  }
  effectivePaystackPublicKey = FALLBACK_TEST_PUBLIC_KEY; // Default to test key for safety
} else if (!effectivePaystackPublicKey.startsWith('pk_live_') && !effectivePaystackPublicKey.startsWith('pk_test_')) {
    // Warn if the key doesn't look like a public key
    if (typeof window !== 'undefined') {
        console.warn(
            `[Paystack Setup] The provided ${varName} ('${effectivePaystackPublicKey.substring(0, 10)}...') does not look like a valid Paystack public key (should start with 'pk_live_' or 'pk_test_').\n` +
            `Using fallback TEST public key: ${FALLBACK_TEST_PUBLIC_KEY}.\n` +
            `Please verify your ${varName}.`
        );
    }
    effectivePaystackPublicKey = FALLBACK_TEST_PUBLIC_KEY;
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
    publicKey: effectivePaystackPublicKey,
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
    if (!config.publicKey || (!config.publicKey.startsWith('pk_test_') && !config.publicKey.startsWith('pk_live_'))) { 
        toast({
            title: 'Paystack Configuration Error',
            description: `Paystack public key ('${config.publicKey ? config.publicKey.substring(0,10)+'...' : 'Not Set'}') is invalid or missing. Please check setup or contact support.`,
            variant: 'destructive',
        });
        setIsProcessing(false);
        return;
    }

    setIsProcessing(true); 
    onDialogCloseProp(); 

    initializePayment({
      onSuccess: (reference) => {
        console.log('Paystack success reference:', reference);
        if (selectedPlan) { 
            onPaymentSuccess(selectedPlan.coins);
        }
      },
      onClose: () => { 
        toast({
          title: 'Payment Cancelled',
          description: 'The payment process was not completed.',
          variant: 'warning',
        });
      },
      onError: (error) => { 
        console.error('Paystack payment error:', error);
        toast({
            title: 'Payment Failed',
            description: 'An error occurred during payment. Please try again.',
            variant: 'destructive',
        });
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
          setIsProcessing(false); 
          onDialogCloseProp();
        }} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          onClick={handleBuyCoins} 
          disabled={!selectedPlanId || isProcessing || !config.publicKey || !config.email.includes('@') || (!config.publicKey.startsWith('pk_test_') && !config.publicKey.startsWith('pk_live_'))}
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
