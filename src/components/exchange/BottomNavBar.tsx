
'use client';
import type { FC } from 'react';
import { Home, LayoutGrid, CandlestickChart, Music2, Wallet } from 'lucide-react'; // Changed PiggyBank to Music2
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string; // href might not be used if onTabChange handles navigation/view change
}

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tabLabel: string) => void;
}

const BottomNavBar: FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  const navItems: NavItem[] = [
    { label: 'Home', icon: Home, href: '#' },
    { label: 'Markets', icon: LayoutGrid, href: '#' },
    { label: 'Trade', icon: CandlestickChart, href: '#' },
    { label: 'Sounds', icon: Music2, href: '#' }, // Changed from Earn to Sounds
    { label: 'Assets', icon: Wallet, href: '#' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 shadow-[-2px_0_10px_rgba(0,0,0,0.1)] md:hidden">
      <nav className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`flex flex-col items-center justify-center h-full p-1 space-y-0.5 rounded-none transition-all duration-200 w-[19%]
              ${activeTab === item.label ? 'text-primary scale-105' : 'text-muted-foreground hover:text-foreground/80'}
            `}
            onClick={() => onTabChange(item.label)}
            aria-current={activeTab === item.label ? "page" : undefined}
          >
            <item.icon className={`h-5 w-5 mb-0.5 transition-transform duration-200 ${activeTab === item.label ? 'scale-110' : ''}`} />
            <span className={`text-[10px] transition-opacity duration-200 ${activeTab === item.label ? 'opacity-100 font-semibold' : 'opacity-80'}`}>{item.label}</span>
          </Button>
        ))}
      </nav>
    </footer>
  );
};

export default BottomNavBar;
