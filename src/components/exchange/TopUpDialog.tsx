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
import { Loader2, CreditCard } from 'lucide-react';

const FALLBACK_TEST_PUBLIC_KEY = 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f'; // Standard Paystack test public key
let effectivePaystackPublicKey = FALLBACK_TEST_PUBLIC_KEY; // Default to fallback

if (typeof window !== 'undefined') {
  const envPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  if (envPublicKey && (envPublicKey.startsWith('pk_live_') || envPublicKey.startsWith('pk_test_'))) {
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
      `Falling back to test public key: ${FALLBACK_TEST_PUBLIC_KEY.substring(0,10)}...` +
      `\nFor live transactions, please set your Paystack PUBLIC KEY in this environment variable.`
    );
    effectivePaystackPublicKey = FALLBACK_TEST_PUBLIC_KEY;
  }
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
    amount: selectedPlan ? selectedPlan.amount * 100 : 0, // Paystack amount is in kobo/cents
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
   
    if (!config.publicKey || !(config.publicKey.startsWith('pk_test_') || config.publicKey.startsWith('pk_live_'))) { 
        toast({
            title: 'Paystack Configuration Error',
            description: `A valid Paystack public key is missing or invalid. Please check setup or contact support. Key used: ${config.publicKey ? config.publicKey.substring(0,10)+'...' : 'Not found'}.`,
            variant: 'destructive',
        });
        setIsProcessing(false);
        return;
    }

    setIsProcessing(true); 
    
    initializePayment({
      onSuccess: (reference) => {
        console.log('Paystack success reference:', reference);
        if (selectedPlan) { 
            onPaymentSuccess(selectedPlan.coins);
        }
        toast({
            title: 'Payment Successful',
            description: `Reference: ${reference.reference}`,
        });
        setIsProcessing(false);
        onDialogCloseProp(); 
      },
      onClose: () => { 
        // This callback is invoked when the Paystack modal is closed by the user.
        // Do not show a toast if payment was successful and dialog already closed.
        if (isProcessing) { // Only show if processing was interrupted by closing.
            toast({
              title: 'Payment Process Closed',
              description: 'The Paystack payment window was closed before completion.',
              variant: 'warning',
            });
        }
        setIsProcessing(false);
        // onDialogCloseProp(); // Dialog might be closed by onSuccess already.
      },
      onError: (error) => { 
        console.error('Paystack payment error:', error);
        toast({
            title: 'Payment Failed',
            description: 'An error occurred during payment. Please try again.',
            variant: 'destructive',
        });
        setIsProcessing(false);
        onDialogCloseProp(); 
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
          disabled={!selectedPlanId || isProcessing || !config.publicKey || !user?.email?.includes('@') || !(config.publicKey.startsWith('pk_test_') || config.publicKey.startsWith('pk_live_'))}
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