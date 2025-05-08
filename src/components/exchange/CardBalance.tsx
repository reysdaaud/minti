'use client';
import type { FC } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button'; 
// import { EyeOff, Eye } from 'lucide-react';
// import { useState } from 'react';

const CardBalance: FC = () => {
  // const [showBalance, setShowBalance] = useState(false);

  return (
    <section className="w-full max-w-md mx-auto text-center space-y-6"> {/* Removed mb-6 */}
      {/* Bank Card Section - Profile Info is ON this card */}
      <div className="bg-gradient-to-br from-primary/40 via-primary/50 to-yellow-500/60 backdrop-blur-lg border border-primary/50 rounded-xl p-5 text-primary-foreground shadow-xl relative overflow-hidden">
        {/* Profile Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-primary/70">
              <AvatarImage src="https://picsum.photos/seed/useravatar/50/50" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback className="bg-primary/20 text-primary-foreground">JD</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-normal text-left">Welcome back,</h3>
              <p className="text-lg font-semibold text-left">Jane Doe</p>
            </div>
          </div>
        </div>

        {/* Card Details Section */}
        <div className="mt-6"> {/* Increased margin-top for better spacing from profile */}
          <div className="flex items-end justify-between"> {/* items-end to push VISA logo to bottom */}
            <div className="text-left">
              <div className="flex items-center space-x-2">
                <svg width="24" height="24" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                  <path d="M45.3359 20C45.3359 20 40.4577 130.522 47.8203 136.752C55.1829 142.983 137.998 121.155 137.998 121.155L154.664 70.1812C154.664 70.1812 162.027 169.478 152.179 178C142.332 186.522 64.4988 169.478 64.4988 169.478L45.3359 20Z" fill="#34D399"/>
                </svg>
                <h5 className="text-xl font-semibold">Sondar</h5>
              </div>
              <p className="text-2xl tracking-wider font-mono my-3">**** **** **** 1234</p>
              <div className="flex justify-between items-center text-xs opacity-90">
                <p className="uppercase">Jane Doe</p>
                <p>Expires: 12/28</p>
              </div>
            </div>
            {/* Removed VISA Logo */}
          </div>
        </div>
      </div>

      {/* Balance Section - REMOVED
      <div className="bg-card border-border rounded-lg p-5 shadow-md">
        <h4 className="text-sm text-muted-foreground text-left mb-1">Current Balance</h4>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-foreground">
             {showBalance ? '$3,982.00' : '$••••••'}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowBalance(!showBalance)} 
            className="text-muted-foreground hover:text-foreground"
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      */}
    </section>
  );
};

export default CardBalance;
