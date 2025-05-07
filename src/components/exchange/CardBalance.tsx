'use client';
import type { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const CardBalance: FC = () => {
  return (
    <section className="px-4 py-6 text-center bg-background">
      <Card className="w-full max-w-md mx-auto bg-card border-border rounded-lg overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://picsum.photos/seed/useravatar/50/50" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Account Balance</h3>
                <p className="text-sm text-muted-foreground">Jane Doe</p>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            $12,050.00
          </div>
          <p className="text-sm text-muted-foreground">
            Available for trading
          </p>
          <div className="flex justify-between">
            <button className="w-1/2 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors mr-2">
              Deposit
            </button>
            <button className="w-1/2 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2">
              Withdraw
            </button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default CardBalance;
