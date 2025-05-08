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

// User-provided live secret key for testing purposes.
// WARNING: THIS IS A SECRET KEY AND SHOULD NOT BE USED IN CLIENT-SIDE PRODUCTION CODE.
// THE USER HAS ACKNOWLEDGED THIS AND WILL FIX SECURITY LATER.
const USER_PROVIDED_PAYSTACK_KEY = 'sk_live_e9cd71a7fa828e96e65ea8a2480756125506421e';
const FALLBACK_TEST_PUBLIC_KEY = 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f'; // Standard Paystack test public key

// Directly use the user-provided key for testing.
// For actual client-side integration, Paystack expects a PUBLIC KEY (pk_live_... or pk_test_...).
// Using a secret key (sk_live_...) on the client is a security risk.
// The user has requested this for testing and will address security later.
let effectivePaystackPublicKey = USER_PROVIDED_PAYSTACK_KEY;

const varName = 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY'; // This variable is usually for public keys.

// For this specific request, we bypass typical client-side key validation
// as the user wants to test with a secret key directly.
// In a normal scenario, if a secret key is found in `process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`,
// we would warn and fallback to a test public key.
// However, here we are using the hardcoded `USER_PROVIDED_PAYSTACK_KEY`.

if (typeof window !== 'undefined') {
  if (USER_PROVIDED_PAYSTACK_KEY.startsWith('sk_')) {
    console.warn(
      `[Paystack Setup - TESTING] Using a LIVE SECRET KEY ('${USER_PROVIDED_PAYSTACK_KEY.substring(0, 10)}...') directly on the client for testing, as requested.\n` +
      `This is a significant security risk and must not be done in production.\n` +
      `Ensure this is replaced with a secure server-side implementation or a public key for client-side operations before going live.`
    );
  } else if (!USER_PROVIDED_PAYSTACK_KEY.startsWith('pk_live_') && !USER_PROVIDED_PAYSTACK_KEY.startsWith('pk_test_')) {
    console.warn(
        `[Paystack Setup - TESTING] The provided key ('${USER_PROVIDED_PAYSTACK_KEY.substring(0, 10)}...') does not look like a standard Paystack public key or the intended secret key for testing.\n` +
        `Proceeding with this key as requested for testing. Ensure it is the correct key for your testing scenario and replace with a secure setup for production.`
    );
  } else {
     console.log(
      `[Paystack Setup - TESTING] Using provided key: '${USER_PROVIDED_PAYSTACK_KEY.substring(0, 10)}...' for Paystack integration.`
     );
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

  // The Paystack SDK on the client expects a PUBLIC KEY.
  // If `effectivePaystackPublicKey` is a SECRET KEY, the behavior of the Paystack popup/checkout
  // might be unpredictable or might not work as intended for typical client-side flows.
  // This setup is based on the user's specific request for testing.
  const config = {
    reference: new Date().getTime().toString(),
    email: user?.email || 'test@example.com', 
    amount: selectedPlan ? selectedPlan.amount * 100 : 0, 
    publicKey: effectivePaystackPublicKey, // This will be the sk_live_... key
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
    // As per user request, we are using the provided key, even if it's a secret key.
    // The standard Paystack client SDK expects a public key.
    // If `config.publicKey` is a secret key, this check might need to be adjusted or removed
    // if Paystack's client SDK behavior with a secret key is different.
    // For now, we'll check if it's simply present.
    if (!config.publicKey) { 
        toast({
            title: 'Paystack Configuration Error',
            description: `Paystack key is missing. Please check setup or contact support.`,
            variant: 'destructive',
        });
        setIsProcessing(false);
        return;
    }

    setIsProcessing(true); 
    
    // We close the dialog immediately and let Paystack's modal take over.
    // This is a change from previous behavior where dialog was closed *after* Paystack modal.
    // onDialogCloseProp(); 

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
        onDialogCloseProp(); // Close our dialog after success
      },
      onClose: () => { 
        // This callback is invoked when the Paystack modal is closed by the user.
        toast({
          title: 'Payment Process Closed',
          description: 'The Paystack payment window was closed.',
          variant: 'warning',
        });
        setIsProcessing(false);
        // onDialogCloseProp(); // Ensure our dialog is also closed if not already.
      },
      onError: (error) => { 
        console.error('Paystack payment error:', error);
        toast({
            title: 'Payment Failed',
            description: 'An error occurred during payment. Please try again.',
            variant: 'destructive',
        });
        setIsProcessing(false);
        onDialogCloseProp(); // Close our dialog on error
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
          disabled={!selectedPlanId || isProcessing || !config.publicKey || !user?.email?.includes('@')}
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
