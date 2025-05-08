'use client';
import type { FC } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button'; // Import Button if needed for icons
import { EyeOff, Eye, Bell } from 'lucide-react';
import { useState } from 'react';

const CardBalance: FC = () => {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <section className="w-full max-w-md mx-auto text-center space-y-6">
      {/* Bank Card Section - Profile Info is ON this card */}
      <div className="bg-gradient-to-br from-primary/90 via-primary to-yellow-500 rounded-xl p-5 text-primary-foreground shadow-xl relative overflow-hidden">
        {/* Profile Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-primary-foreground/50">
              <AvatarImage src="https://picsum.photos/seed/useravatar/50/50" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">JD</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-normal text-left">Welcome back,</h3>
              <p className="text-lg font-semibold text-left">Jane Doe</p>
            </div>
          </div>
          {/* Optional: Notification Bell Icon 
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
            <Bell className="h-5 w-5" />
          </Button>
          */}
        </div>

        {/* Card Details Section */}
        <div className="mt-6"> {/* Increased margin-top for better spacing from profile */}
          <div className="flex items-end justify-between"> {/* items-end to push VISA logo to bottom */}
            <div className="text-left">
              <h5 className="text-base font-medium opacity-80">NeoWallet Premier</h5>
              <p className="text-2xl tracking-wider font-mono my-3">**** **** **** 1234</p>
              <div className="flex justify-between items-center text-xs opacity-90">
                <p className="uppercase">Jane Doe</p>
                <p>Expires: 12/28</p>
              </div>
            </div>
            {/* VISA Logo Placeholder */}
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="30" viewBox="0 0 38 24" className="fill-current">
                    <path d="M37.031 2.121c0-.608-.493-1.101-1.101-1.101H15.432c-.608 0-1.101.493-1.101 1.101L3.819 21.879c0 .608.493 1.101 1.101 1.101H22.23c.608 0 1.101-.493 1.101-1.101l13.699-19.758h.001zm-14.268 8.474h-3.328c-.493 0-.863.425-.799.917l.654 4.932c.065.493.493.863.994.863h1.729c.501 0 .93-.37.994-.863l.654-4.932c.065-.492-.305-.917-.8-.917zm5.735 6.081c0 .608-.493 1.101-1.101 1.101h-1.565a.991.991 0 0 1-.994-.863l-.654-4.932c-.065-.493.305-.917.799-.917h3.328c.493 0 .863.425.799.917l-.654 4.932a.864.864 0 0 1-.959.863zm7.057-6.081c0 .493-.37.863-.863.863h-1.729c-.501 0-.93-.37-.994-.863l-.654-4.932c-.065-.493.305-.917.799-.917h3.328c.493 0 .863.425.799.917l-.958 4.932h.002z" fill="#fff"/>
                    <path d="M21.368 21.879H3.819C2.031 21.879.74 20.49.863 18.707L0 4.58C-.123 2.797 1.168 1.408 2.956 1.408h17.549L21.368 21.879z" fill="#FFD700"/> {/* Standard Gold for VISA */}
                </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Section - Styled as a separate card */}
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
    </section>
  );
};

export default CardBalance;
