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
import { useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_fae492482c870c83a5d33ba8f260880c22a5b24f';

interface TopUpPlan {
  id: string;
  coins: number;
  amount: number; // Amount in NGN (e.g., 1000 for NGN 1000)
  description: string;
}

const topUpPlans: TopUpPlan[] = [
  { id: 'plan1', coins: 100, amount: 1000, description: 'Get 100 Coins for ₦1,000' },
  { id: 'plan2', coins: 250, amount: 2200, description: 'Get 250 Coins for ₦2,200 (Save ₦300)' },
  { id: 'plan3', coins: 500, amount: 4000, description: 'Get 500 Coins for ₦4,000 (Save ₦1000)' },
  { id: 'plan4', coins: 1000, amount: 7500, description: 'Get 1000 Coins for ₦7,500 (Best Value!)' },
];

interface TopUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (coinsPurchased: number) => void;
}

const TopUpDialog: FC<TopUpDialogProps> = ({ isOpen, onClose, onPaymentSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(topUpPlans[0].id);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = topUpPlans.find(p => p.id === selectedPlanId);

  const config = {
    reference: new Date().getTime().toString(),
    email: user?.email || 'test@example.com', // Fallback email if user.email is null
    amount: selectedPlan ? selectedPlan.amount * 100 : 0, // Amount in Kobo
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
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
    setIsProcessing(true);
    initializePayment({
      onSuccess: (reference) => {
        console.log('Paystack success reference:', reference);
        onPaymentSuccess(selectedPlan.coins);
        setIsProcessing(false);
      },
      onClose: () => {
        toast({
          title: 'Payment Closed',
          description: 'You closed the payment window.',
          variant: 'warning',
        });
        setIsProcessing(false);
      },
      // onError is implicitly handled by Paystack's UI, but you can add specific logging if needed.
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
              <span className="text-lg font-bold text-primary">₦{plan.amount.toLocaleString()}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <DialogFooter className="p-6 border-t border-border/20">
        <Button variant="outline" onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          onClick={handleBuyCoins} 
          disabled={!selectedPlanId || isProcessing}
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
