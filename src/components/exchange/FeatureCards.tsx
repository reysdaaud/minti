
import type { FC } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const FeatureCards: FC = () => {
  return (
    <section className="px-4 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-background">
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">TradeGPT</CardTitle>
          <span className="text-xs text-muted-foreground">3/4</span>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">Trade Smarter with AI</p>
            <ArrowRight className="h-5 w-5 text-primary mt-1" />
          </div>
          <div className="relative w-16 h-16">
            <Image
              src="https://picsum.photos/seed/robotai/100/100"
              alt="AI Robot"
              layout="fill"
              objectFit="contain"
              data-ai-hint="ai robot"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Bybit Savings</CardTitle>
          <span className="text-xs text-muted-foreground">1/2</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-1">
            <div className="relative w-6 h-6">
                <Image 
                    src="https://picsum.photos/seed/usdtlogo/40/40" 
                    alt="USDT Logo" 
                    layout="fill"
                    objectFit="contain"
                    data-ai-hint="usdt logo"
                />
            </div>
            <p className="text-lg font-semibold text-foreground">USDT</p>
          </div>
          <p className="text-xs text-muted-foreground">APR</p>
          <p className="text-2xl font-bold text-green-500">6%</p>
        </CardContent>
      </Card>
    </section>
  );
};

export default FeatureCards;
