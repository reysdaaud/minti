// src/components/exchange/Pay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import PaystackButton from './PaystackButton'; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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

export default function Pay({ userId, userEmail, onCloseDialog }: PayProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
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
    <div className="space-y-3"> {/* Reduced vertical spacing */}
      {error && (
        <div 
          className={`bg-destructive/20 border-l-4 border-destructive text-destructive p-3 rounded-md text-sm`}
          role="alert"
        >
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!userEmail && (
        <div className="bg-destructive/20 border-l-4 border-destructive text-destructive p-3 rounded-md" role="alert">
          <p className="font-semibold">Email Required</p>
          <p className="text-sm">A valid email address is required for payments.</p>
        </div>
      )}

      <RadioGroup 
        value={selectedPackage?.id} 
        onValueChange={handlePackageSelect}
        className="space-y-2.5" // Slightly reduced spacing between packages
        disabled={!userEmail} 
      >
        {COIN_PACKAGES.map((pkg) => (
          <Label
            key={pkg.id}
            htmlFor={pkg.id}
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 border rounded-lg transition-all duration-200 ease-in-out hover:shadow-md
                        ${selectedPackage?.id === pkg.id 
                          ? 'border-primary ring-1 ring-primary bg-primary/10 shadow-lg' 
                          : 'border-white/20 bg-white/5 hover:bg-white/10'}
                        ${!userEmail ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer pointer-events-auto'}
                        glass-input-like`}
          >
            <div className="flex items-center mb-1 sm:mb-0">
              <RadioGroupItem value={pkg.id} id={pkg.id} className="mr-2.5 mt-0.5 sm:mt-0 self-start sm:self-center border-white/50 text-primary" disabled={!userEmail} />
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

      {selectedPackage && userEmail && (
        <div className="mt-3 pt-3 border-t border-white/20"> {/* Reduced margin-top */}
          <div className="bg-black/20 p-2.5 rounded-lg mb-3 text-xs glass-input-like">
            <h3 className="text-xs font-semibold mb-1 text-white">Order Summary:</h3>
            <div className="flex justify-between"><span className="text-neutral-300">Package:</span> <span className="font-medium text-white">{selectedPackage.description}</span></div>
            <div className="flex justify-between"><span className="text-neutral-300">Price:</span> <span className="font-medium text-white">KES {selectedPackage.amount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-neutral-300">Coins:</span> <span className="font-medium text-white">{selectedPackage.coins.toLocaleString()}</span></div>
          </div>
          
          <PaystackButton
              amount={selectedPackage.amount} 
              email={userEmail}
              userId={userId}
              metadata={{
                coins: selectedPackage.coins,
                packageName: selectedPackage.description
              }}
            />
          
          <p className="mt-2.5 text-xs text-center text-neutral-400 px-2">
            You'll be redirected to Paystack in a new tab for secure payment.
          </p>
        </div>
      )}
    </div>
  );
}
