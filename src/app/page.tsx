// src/app/page.tsx
'use client';

import TopHeader from '@/components/exchange/TopHeader';
import UserActions from '@/components/exchange/UserActions';
import MarketSection from '@/components/exchange/MarketSection';
import BottomNavBar from '@/components/exchange/BottomNavBar';
import CardBalance from '@/components/exchange/CardBalance';
import SoundsPlayer from '@/components/sounds/SoundsPlayer'; // Import SoundsPlayer
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function CryptoExchangePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [coinBalance, setCoinBalance] = useState(0); 
  const [activeTab, setActiveTab] = useState('Home'); // State for active tab

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      console.log("User logged in, ideally fetch coin balance for:", user.uid);
    }
  }, [user]);


  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <>
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
            <UserActions setCoinBalance={setCoinBalance} /> 
            <MarketSection />
          </>
        );
      case 'Sounds':
        return <SoundsPlayer />;
      // Add cases for other tabs if they render different content
      // For 'Markets', 'Trade', 'Assets', they might navigate or show other specific components.
      // For now, let's assume they fall through or show a placeholder if not 'Home' or 'Sounds'.
      case 'Markets':
        return <MarketSection /> // Example: Markets tab could just show market section
      default:
        return (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Content for {activeTab} tab.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopHeader />
      <main className="flex-grow overflow-y-auto pb-16 md:pb-0 px-4 pt-3">
        {renderContent()}
      </main>
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
