'use client';
import type { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const CardSection: FC = () => {
  return (
    <section className="px-4 py-6 text-center bg-background">
      <Card className="w-full max-w-md mx-auto bg-card border-border rounded-lg overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-center text-3xl font-bold text-foreground">
            <Sparkles className="mr-2 h-8 w-8 text-primary" />
            <span className="text-primary">$5,050</span> Bonus
          </div>
          <p className="text-sm text-muted-foreground">
            Sign up now and start trading with a significant bonus!
          </p>
          <button className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Sign Up
          </button>
        </CardContent>
      </Card>
    </section>
  );
};

export default CardSection;

