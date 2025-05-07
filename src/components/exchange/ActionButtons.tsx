
'use client';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';

const ActionButtons: FC = () => {
  return (
    <section className="px-4 pb-6 flex gap-4 bg-background">
      <Button variant="secondary" className="flex-1 py-3 h-auto bg-card border-border text-foreground hover:bg-muted">
        Demo Trading
      </Button>
      <Button variant="default" className="flex-1 py-3 h-auto bg-primary text-primary-foreground hover:bg-primary/90">
        Signup / Log in
      </Button>
    </section>
  );
};

export default ActionButtons;
