
// src/components/exchange/Pay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import PaystackButton from './PaystackButton';
import WaafiButton from './WaafiButton'; // Import the new WaafiButton
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // For phone number input
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';


interface CoinPackage {
  id: string;
  amount: number;
  coins: number;
  description: string;
  bonusText?: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack1', amount: 1, coins: 100, description: "Basic Pack (KES 1)" },
  { id: 'pack2', amount: 2, coins: 220, description: "Popular Pack (KES 2)", bonusText: "Includes 10% bonus coins" },
  { id: 'pack3', amount: 50, coins: 600, description: "Premium Pack (KES 50)", bonusText: "Includes 20% bonus coins" },
];


interface PayProps {
  userId: string;
  userEmail: string | null;
  onCloseDialog: () => void;
}

type PaymentMethod = 'paystack' | 'waafi';

export default function Pay({ userId, userEmail, onCloseDialog }: PayProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('paystack');
  const [waafiPhoneNumber, setWaafiPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const cleanErrors = () => {
    setError('');
  };

  useEffect(() => {
    // No balance fetching needed as per requirements
  }, []);

  const handlePackageSelect = (pkgId: string) => {
    cleanErrors();
    const foundPackage = COIN_PACKAGES.find(p => p.id === pkgId);
    setSelectedPackage(foundPackage || null);
  };

  return (
    <div className="space-y-3">
      {error && (
        <div
          className={`bg-destructive/20 border-l-4 border-destructive text-destructive p-3 rounded-md text-sm`}
          role="alert"
        >
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!userEmail && selectedPaymentMethod === 'paystack' && (
        <div className="bg-destructive/20 border-l-4 border-destructive text-destructive p-3 rounded-md" role="alert">
          <p className="font-semibold">Email Required for Paystack</p>
          <p className="text-sm">A valid email address is required for Paystack payments.</p>
        </div>
      )}

      <RadioGroup
        value={selectedPackage?.id}
        onValueChange={handlePackageSelect}
        className="space-y-2.5"
        disabled={!userEmail && selectedPaymentMethod === 'paystack'}
      >
        {COIN_PACKAGES.map((pkg) => (
          <Label
            key={pkg.id}
            htmlFor={pkg.id}
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 border rounded-lg transition-all duration-200 ease-in-out hover:shadow-md
                        ${selectedPackage?.id === pkg.id
                          ? 'border-primary ring-1 ring-primary bg-primary/10 shadow-lg'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'}
                        ${(!userEmail && selectedPaymentMethod === 'paystack') ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer pointer-events-auto'}
                        glass-input-like`}
          >
            <div className="flex items-center mb-1 sm:mb-0">
              <RadioGroupItem value={pkg.id} id={pkg.id} className="mr-2.5 mt-0.5 sm:mt-0 self-start sm:self-center border-white/50 text-primary" disabled={(!userEmail && selectedPaymentMethod === 'paystack')} />
              <div>
                <h3 className="text-sm font-medium text-white">{pkg.description}</h3>
                <p className="text-base font-semibold text-primary/90">{pkg.coins.toLocaleString()} coins</p>
                {pkg.bonusText && (
                  <p className="text-xs text-green-400 font-medium">{pkg.bonusText}</p>
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-white sm:ml-3 self-end sm:self-center">
              KES {pkg.amount.toLocaleString()}
            </p>
          </Label>
        ))}
      </RadioGroup>

      {selectedPackage && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <Label className="text-sm font-medium text-white mb-2 block">Select Payment Method</Label>
          <RadioGroup
            value={selectedPaymentMethod}
            onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
            className="space-y-2 mb-4" // Changed to vertical stacking
          >
            <Label htmlFor="paystack" className="flex items-center space-x-2 cursor-pointer text-white text-sm p-2 rounded-md hover:bg-white/10 transition-colors glass-input-like">
              <RadioGroupItem value="paystack" id="paystack" className="text-primary border-white/50" />
              <span>Paystack (Card, M-Pesa)</span>
            </Label>
            <Label htmlFor="waafi" className="flex items-center space-x-2 cursor-pointer text-white text-sm p-2 rounded-md hover:bg-white/10 transition-colors glass-input-like">
              <RadioGroupItem value="waafi" id="waafi" className="text-primary border-white/50" />
              <span>Waafi (Mobile Money - USD)</span>
            </Label>
          </RadioGroup>

          {selectedPaymentMethod === 'waafi' && (
            <div className="mb-4">
              <Label htmlFor="waafiPhoneNumber" className="text-sm font-medium text-white mb-1 block">Waafi Phone Number</Label>
              <Input
                id="waafiPhoneNumber"
                type="tel"
                placeholder="E.g., 2526..."
                value={waafiPhoneNumber}
                onChange={(e) => setWaafiPhoneNumber(e.target.value)}
                className="glass-input"
              />
            </div>
          )}

          <div className="bg-black/20 p-2.5 rounded-lg mb-3 text-xs glass-input-like">
            <h3 className="text-xs font-semibold mb-1 text-white">Order Summary:</h3>
            <div className="flex justify-between"><span className="text-neutral-300">Package:</span> <span className="font-medium text-white">{selectedPackage.description}</span></div>
            <div className="flex justify-between"><span className="text-neutral-300">Price:</span> <span className="font-medium text-white">KES {selectedPackage.amount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-neutral-300">Coins:</span> <span className="font-medium text-white">{selectedPackage.coins.toLocaleString()}</span></div>
          </div>

          {selectedPaymentMethod === 'paystack' && userEmail && (
            <PaystackButton
              amount={selectedPackage.amount}
              email={userEmail}
              userId={userId}
              metadata={{
                coins: selectedPackage.coins,
                packageName: selectedPackage.description
              }}
            />
          )}
          {selectedPaymentMethod === 'waafi' && (
            <WaafiButton
              amount={selectedPackage.amount} // This is still KES amount
              currency="USD" // Waafi currency is now USD
              phoneNumber={waafiPhoneNumber}
              userId={userId}
              metadata={{
                coins: selectedPackage.coins,
                packageName: selectedPackage.description,
                originalAmountKES: selectedPackage.amount 
              }}
              onCloseDialog={onCloseDialog}
            />
          )}

          <p className="mt-2.5 text-xs text-center text-neutral-400 px-2">
            {selectedPaymentMethod === 'paystack'
              ? "You'll be redirected to Paystack for secure payment."
              : "Follow instructions on your phone to complete Waafi payment."}
          </p>
        </div>
      )}
    </div>
  );
}
