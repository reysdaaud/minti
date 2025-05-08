// src/app/page.tsx
'use client';

import TopHeader from '@/components/exchange/TopHeader';
import UserActions from '@/components/exchange/UserActions';
import MarketSection from '@/components/exchange/MarketSection';
import BottomNavBar from '@/components/exchange/BottomNavBar';
import CardBalance from '@/components/exchange/CardBalance';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function CryptoExchangePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // This state will be updated by UserActions after a successful top-up
  const [coinBalance, setCoinBalance] = useState(0); 

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Effect to fetch initial coin balance if user exists (e.g., from Firestore)
  // This is a placeholder; actual fetching logic would be needed here or passed down.
  useEffect(() => {
    if (user) {
      // Placeholder: fetch balance for user.uid
      // For now, we'll just log it. In a real app, you'd fetch from Firestore.
      console.log("User logged in, ideally fetch coin balance for:", user.uid);
      // Example: fetchUserBalance(user.uid).then(setCoinBalance);
      // For the purpose of this task, Pay.tsx updates Firestore, and this page
      // will reflect the change if UserActions calls setCoinBalance.
    }
  }, [user]);


  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopHeader />
      <main className="flex-grow overflow-y-auto pb-16 md:pb-0 px-4 pt-3">
        <Card className="mb-4 bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Your Sondar Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              Coin Balance: {coinBalance.toLocaleString()} Coins
            </p>
             <p className="text-sm text-muted-foreground mt-1">
              Manage your digital assets with ease.
            </p>
          </CardContent>
        </Card>
        <CardBalance />
        {/* Pass setCoinBalance to UserActions so it can update the balance after top-up */}
        <UserActions setCoinBalance={setCoinBalance} /> 
        <MarketSection />
      </main>
      <BottomNavBar />
    </div>
  );
}
