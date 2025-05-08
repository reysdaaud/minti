
'use client';
import type { FC } from 'react';
import { ArrowRightLeft, PlusCircle, ReceiptText, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <div className="flex flex-row justify-around items-center space-x-2 sm:space-x-3 p-3 bg-card border border-border rounded-lg shadow-md">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className="flex flex-col items-center justify-center h-auto p-2 space-y-1.5 text-primary-foreground hover:bg-primary/10 group transition-all duration-200 hover:shadow-sm rounded-md flex-1 max-w-[100px]" // flex-1 to distribute space, max-w to control size
            onClick={action.onClick}
            aria-label={action.label}
          >
            <action.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm text-primary group-hover:font-semibold whitespace-nowrap">{action.label}</span>
          </Button>
        ))}
      </div>
    </section>
  );
};

export default UserActions;

