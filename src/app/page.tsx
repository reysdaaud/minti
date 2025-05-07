
import TopHeader from '@/components/exchange/TopHeader';
import PromoBanner from '@/components/exchange/PromoBanner';
import ActionButtons from '@/components/exchange/ActionButtons';
import FeatureCards from '@/components/exchange/FeatureCards';
import MarketSection from '@/components/exchange/MarketSection';
import BottomNavBar from '@/components/exchange/BottomNavBar';

export default function CryptoExchangePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopHeader />
      <main className="flex-grow overflow-y-auto pb-16 md:pb-0"> {/* Padding bottom for mobile nav bar */}
        <PromoBanner />
        <ActionButtons />
        <FeatureCards />
        <MarketSection />
      </main>
      <BottomNavBar />
    </div>
  );
}
