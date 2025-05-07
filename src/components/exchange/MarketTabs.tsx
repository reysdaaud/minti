
'use client';
import type { FC } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MarketTabsProps {
  activeMainTab: string;
  onMainTabChange: (value: string) => void;
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
}

const mainTabs = ["Favorites", "Hot", "New", "Gainers", "Losers", "Turnover"];
const subTabs = ["Spot", "Derivatives"];

const MarketTabs: FC<MarketTabsProps> = ({ activeMainTab, onMainTabChange, activeSubTab, onSubTabChange }) => {
  return (
    <div className="px-4 pt-4 bg-background">
      <ScrollArea className="w-full whitespace-nowrap">
        <Tabs value={activeMainTab} onValueChange={onMainTabChange} className="w-max">
          <TabsList className="bg-transparent p-0">
            {mainTabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="px-3 py-2 text-sm text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-semibold relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      {activeMainTab === "Favorites" && ( // Or any other condition to show sub-tabs
        <div className="mt-3">
          <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card border-border p-0.5">
              {subTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="px-3 py-1.5 text-xs data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-semibold"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default MarketTabs;
