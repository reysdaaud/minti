
'use client';
import type { FC } from 'react';
import { ArrowRightLeft, PlusCircle, ReceiptText, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

const UserActions: FC = () => {
  const actions: ActionItem[] = [
    {
      label: 'Transfer',
      icon: ArrowRightLeft,
      onClick: () => console.log('Transfer clicked'),
    },
    {
      label: 'Top-up',
      icon: PlusCircle,
      onClick: () => console.log('Top-up clicked'),
    },
    {
      label: 'Pay Bills',
      icon: ReceiptText,
      onClick: () => console.log('Pay Bills clicked'),
    },
    {
      label: 'Withdraw',
      icon: ArrowDownToLine,
      onClick: () => console.log('Withdraw clicked'),
    },
  ];

  return (
    <section className="py-6">
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-2 space-y-1.5 border-primary/30 hover:bg-primary/10 group transition-all duration-200 hover:shadow-md"
                onClick={action.onClick}
                aria-label={action.label}
              >
                <action.icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs text-primary-foreground group-hover:font-semibold">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default UserActions;
