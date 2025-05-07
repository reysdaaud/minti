'use client';
import type { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EyeOff, Eye } from 'lucide-react';
import { useState } from 'react';

const CardBalance: FC = () => {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <section className="text-center">
      <Card className="w-full max-w-md mx-auto bg-card border-border rounded-lg overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Profile Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://picsum.photos/seed/useravatar/50/50" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Welcome back,</h3>
                <p className="text-sm text-muted-foreground">Jane Doe</p>
              </div>
            </div>
            {/* Notification and Settings - Omitted for brevity, can be added back if needed */}
          </div>

          {/* Card Section */}
          <div className="bg-secondary rounded-md p-4">
            <h4 className="text-sm text-muted-foreground text-left">Your Card</h4>
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-md font-semibold text-secondary-foreground text-left">NeoWallet Premier</h5>
                <div className="flex items-center space-x-1 text-secondary-foreground">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-secondary-foreground rounded-full"></div>
                  ))}
                  <span> VISA </span>
                </div>
                <p className="text-sm text-secondary-foreground text-left">**** **** **** 1234</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-secondary-foreground text-left">Card Holder: JANE DOE</p>
                  <p className="text-xs text-secondary-foreground text-right">Expires: 12/28</p>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Section */}
          <div className="text-center">
            <h4 className="text-sm text-muted-foreground">Current Balance</h4>
            <div className="text-3xl font-bold text-foreground flex items-center justify-center">
              $
              {showBalance ? '3,982.00' : '****'}
              <button onClick={() => setShowBalance(!showBalance)} className="ml-2">
                {showBalance ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default CardBalance;
