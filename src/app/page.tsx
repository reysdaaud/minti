import TopHeader from '@/components/exchange/TopHeader';
import UserActions from '@/components/exchange/UserActions';
import MarketSection from '@/components/exchange/MarketSection';
import BottomNavBar from '@/components/exchange/BottomNavBar';
import CardBalance from '@/components/exchange/CardBalance';

export default function CryptoExchangePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopHeader />
      <main className="flex-grow overflow-y-auto pb-16 md:pb-0 px-4 pt-3"> {/* Changed pt-6 to pt-3 */}
        <CardBalance />
        <UserActions />
        <MarketSection />
      </main>
      <BottomNavBar />
    </div>
  );
}
