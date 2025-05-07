import TopHeader from '@/components/exchange/TopHeader';
import FeatureCards from '@/components/exchange/FeatureCards';
import MarketSection from '@/components/exchange/MarketSection';
import BottomNavBar from '@/components/exchange/BottomNavBar';
import CardBalance from '@/components/exchange/CardBalance';

export default function CryptoExchangePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopHeader />
      <main className="flex-grow overflow-y-auto pb-16 md:pb-0 px-4 py-6">
        <CardBalance />
        <FeatureCards />
        <MarketSection />
      </main>
      <BottomNavBar />
    </div>
  );
}
