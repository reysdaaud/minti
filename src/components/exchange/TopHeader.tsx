
'use client';
import type { FC } from 'react';
import { UserCircle, Headphones } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TopHeader: FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-background sticky top-0 z-50 border-b border-border/50">
      <Avatar className="h-8 w-8 cursor-pointer">
        <AvatarImage src="https://picsum.photos/seed/useravatar/100/100" alt="User Avatar" data-ai-hint="user avatar" />
        <AvatarFallback>
          <UserCircle className="h-8 w-8 text-primary" />
        </AvatarFallback>
      </Avatar>

      <Tabs defaultValue="exchange" className="w-auto">
        <TabsList className="bg-card border border-border p-0.5 rounded-md">
          <TabsTrigger value="exchange" className="px-4 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm">Exchange</TabsTrigger>
          <TabsTrigger value="web3" className="px-4 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm">WEB3</TabsTrigger>
        </TabsList>
      </Tabs>

      <Button variant="ghost" size="icon" aria-label="Support">
        <Headphones className="h-6 w-6 text-primary" />
      </Button>
    </header>
  );
};

export default TopHeader;
