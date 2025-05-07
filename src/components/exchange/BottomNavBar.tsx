
'use client';
import type { FC } from 'react';
import { Home, LayoutGrid, CandlestickChart, PiggyBank, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const BottomNavBar: FC = () => {
  const [activeTab, setActiveTab] = useState('Home');

  const navItems: NavItem[] = [
    { label: 'Home', icon: Home, href: '#' },
    { label: 'Markets', icon: LayoutGrid, href: '#' },
    { label: 'Trade', icon: CandlestickChart, href: '#' },
    { label: 'Earn', icon: PiggyBank, href: '#' },
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
            onClick={() => setActiveTab(item.label)}
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
