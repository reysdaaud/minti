'use client';
import type { FC, Dispatch, SetStateAction } from 'react';
import { ArrowRightLeft, PlusCircle, ReceiptText, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TopUpDialog from './TopUpDialog'; // Import the new TopUpDialog
import { useToast } from '@/hooks/use-toast';


interface ActionItem {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
}

interface TransferFormData {
  recipient: string;
  amount: string;
  note?: string;
}

const defaultFormData: TransferFormData = {
  recipient: '',
  amount: '',
  note: '',
};

interface UserActionsProps {
  setCoinBalance: Dispatch<SetStateAction<number>>;
}

const UserActions: FC<UserActionsProps> = ({ setCoinBalance }) => {
  const { toast } = useToast();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TransferFormData>(defaultFormData);

  const actions: ActionItem[] = [
    {
      label: 'Transfer',
      icon: ArrowRightLeft,
      onClick: () => setTransferDialogOpen(true),
    },
    {
      label: 'Top-up',
      icon: PlusCircle,
      onClick: () => setTopUpDialogOpen(true),
    },
    {
      label: 'Pay Bills',
      icon: ReceiptText,
      onClick: () => console.log('Pay Bills clicked'), // Placeholder
    },
    {
      label: 'Withdraw',
      icon: ArrowDownToLine,
      onClick: () => console.log('Withdraw clicked'), // Placeholder
    },
  ];

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSendMoney = () => {
    console.log('Send Money clicked', formData);
    toast({
      title: 'Transfer Initiated',
      description: `Transferring ${formData.amount} to ${formData.recipient}.`,
    });
    // Reset form and close dialog if needed
    // setFormData(defaultFormData);
    // setTransferDialogOpen(false);
  };

  const handlePaymentSuccess = (coinsPurchased: number) => {
    setCoinBalance(prevBalance => prevBalance + coinsPurchased);
    toast({
      title: 'Top-up Successful!',
      description: `You've successfully purchased ${coinsPurchased} coins.`,
    });
    setTopUpDialogOpen(false); // Close the top-up dialog
  };


  return (
    <section className="py-6">
      <div className="flex flex-row justify-around items-center space-x-2 sm:space-x-3 p-3 bg-card border border-border rounded-lg shadow-md">
        {actions.map((action) => (
          <Dialog key={action.label} open={action.label === 'Transfer' ? transferDialogOpen : action.label === 'Top-up' ? topUpDialogOpen : undefined} onOpenChange={action.label === 'Transfer' ? setTransferDialogOpen : action.label === 'Top-up' ? setTopUpDialogOpen : undefined}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-auto p-2 space-y-2 text-primary-foreground hover:bg-primary/10 group transition-all duration-200 hover:shadow-sm rounded-md flex-1 max-w-[100px]"
                onClick={action.onClick}
                aria-label={action.label}
              >
                <div className="p-3 border-2 border-primary/40 group-hover:border-primary transition-colors duration-200 rounded-lg">
                  <action.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-105 transition-transform" />
                </div>
                <span className="text-xs sm:text-sm text-primary group-hover:font-semibold whitespace-nowrap">{action.label}</span>
              </Button>
            </DialogTrigger>
            {action.label === 'Transfer' && (
              <DialogContent className="w-full max-w-xs p-6 rounded-[20px] send-money-dialog-content">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center mb-5 text-white">Send Money</DialogTitle>
                </DialogHeader>
                <form className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="recipient" className="text-sm text-white">Recipient</Label>
                    <Input id="recipient" name="recipient" value={formData.recipient} onChange={handleInputChange} type="text" placeholder="Enter recipient name or email" className="glass-input" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="amount" className="text-sm text-white">Amount</Label>
                    <Input id="amount" name="amount" value={formData.amount} onChange={handleInputChange} type="number" placeholder="$0.00" className="glass-input" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="note" className="text-sm text-white">Note</Label>
                    <Textarea id="note" name="note" value={formData.note ?? ''} onChange={handleInputChange} placeholder="Add a note (optional)" className="glass-input" />
                  </div>
                  <Button type="button" onClick={handleSendMoney} className="send-money-button mt-2">Send</Button>
                </form>
              </DialogContent>
            )}
            {action.label === 'Top-up' && (
              <TopUpDialog
                isOpen={topUpDialogOpen}
                onClose={() => setTopUpDialogOpen(false)}
                onPaymentSuccess={handlePaymentSuccess}
              />
            )}
             {/* Placeholder for Pay Bills and Withdraw dialogs if they were to be implemented */}
            {(action.label === 'Pay Bills' || action.label === 'Withdraw') && !topUpDialogOpen && !transferDialogOpen && (
                 <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{action.label}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground">This feature ({action.label}) is coming soon!</p>
                    </div>
                 </DialogContent>
            )}
          </Dialog>
        ))}
      </div>
    </section>
  );
};

export default UserActions;
