
'use client';
import type { FC } from 'react';
import { Home, Search, Library, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: React.ElementType;
  targetTab: string;
}

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tabLabel: string) => void;
}

const BottomNavBar: FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  const navItems: NavItem[] = [
    { label: 'Home', icon: Home, targetTab: 'Home' },
    { label: 'Search', icon: Search, targetTab: 'Markets' }, // Assuming 'Search' corresponds to 'Markets' or a new 'Search' tab
    { label: 'Library', icon: Library, targetTab: 'Sounds' }, // Assuming 'Library' corresponds to 'Sounds' or a new 'Library' tab
    { label: 'Premium', icon: Star, targetTab: 'Assets' }, // Assuming 'Premium' corresponds to 'Assets' or a new 'Premium' tab
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] md:hidden h-[60px] z-50">
      <nav className="flex justify-around items-center h-full px-1">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`flex flex-col items-center justify-center h-full p-1 space-y-0 rounded-none transition-all duration-200 w-[24%] 
              ${activeTab === item.targetTab ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'}
            `}
            onClick={() => onTabChange(item.targetTab)}
            aria-current={activeTab === item.targetTab ? "page" : undefined}
          >
            <item.icon className={`h-[18px] w-[18px] mb-[2px] transition-transform duration-200 ${activeTab === item.targetTab ? 'scale-110' : ''}`} />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </nav>
    </footer>
  );
};

export default BottomNavBar;
