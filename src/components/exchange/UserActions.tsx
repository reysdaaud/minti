// src/components/exchange/UserActions.tsx
'use client';
import type { FC, Dispatch, SetStateAction } from 'react';
import { ArrowRightLeft, PlusCircle, ReceiptText, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useState, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Pay from './Pay'; // Import the new Pay component
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';


interface ActionItem {
  label: string;
  icon: React.ElementType;
  dialogKey: 'transfer' | 'topup' | 'paybills' | 'withdraw'; // To manage dialog states
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
  const { user } = useAuth();
  
  const [openDialogKey, setOpenDialogKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<TransferFormData>(defaultFormData);

  const actions: ActionItem[] = [
    { label: 'Transfer', icon: ArrowRightLeft, dialogKey: 'transfer' },
    { label: 'Top-up', icon: PlusCircle, dialogKey: 'topup' },
    { label: 'Pay Bills', icon: ReceiptText, dialogKey: 'paybills' },
    { label: 'Withdraw', icon: ArrowDownToLine, dialogKey: 'withdraw' },
  ];

  const handleOpenDialog = (key: string) => {
    if (key === 'topup' && !user) {
      toast({ title: "Authentication Required", description: "Please sign in to top up your account.", variant: "destructive" });
      return;
    }
    setOpenDialogKey(key);
  };

  const handleCloseDialog = () => {
    setOpenDialogKey(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSendMoney = () => {
    console.log('Send Money clicked', formData);
    toast({
      title: 'Transfer Initiated',
      description: `Transferring ${formData.amount} to ${formData.recipient}.`,
    });
    // Reset form and close dialog if needed
    // setFormData(defaultFormData);
    // handleCloseDialog();
  };

  const handleTopUpCompleted = (coinsPurchased: number) => {
    handleCloseDialog(); // Close the top-up dialog
    setCoinBalance(prevBalance => prevBalance + coinsPurchased);
    toast({
      title: 'Top-up Successful!',
      description: `You've successfully purchased ${coinsPurchased.toLocaleString()} coins. Your balance has been updated.`,
      variant: 'default',
    });
  };

  return (
    <section className="py-6">
      <div className="flex flex-row justify-around items-center space-x-2 sm:space-x-3 p-3 bg-card border border-border rounded-lg shadow-md">
        {actions.map((action) => (
          <Dialog key={action.dialogKey} open={openDialogKey === action.dialogKey} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-auto p-2 space-y-2 text-primary-foreground hover:bg-primary/10 group transition-all duration-200 hover:shadow-sm rounded-md flex-1 max-w-[100px]"
                onClick={() => handleOpenDialog(action.dialogKey)}
                aria-label={action.label}
              >
                <div className="p-3 border-2 border-primary/40 group-hover:border-primary transition-colors duration-200 rounded-lg">
                  <action.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-105 transition-transform" />
                </div>
                <span className="text-xs sm:text-sm text-primary group-hover:font-semibold whitespace-nowrap">{action.label}</span>
              </Button>
            </DialogTrigger>
            
            {/* Transfer Dialog Content */}
            {action.dialogKey === 'transfer' && (
              <DialogContent className="w-full max-w-xs p-0 rounded-[20px] send-money-dialog-content overflow-hidden">
                 <DialogHeader className="p-6 pb-4 flex flex-row justify-between items-center">
                    <DialogTitle className="text-2xl font-bold text-center text-white flex-grow">Send Money</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white/80">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 pt-0">
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
                </div>
              </DialogContent>
            )}

            {/* Top-up Dialog Content */}
            {action.dialogKey === 'topup' && user && (
              <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-none shadow-none data-[state=open]:animate-none data-[state=closed]:animate-none">
                {/* Pay component handles its own styling including background and card */}
                <Pay 
                  userId={user.uid} 
                  userEmail={user.email} 
                  onPaymentCompleted={handleTopUpCompleted} 
                />
                 {/* Explicit close button for the Pay dialog if needed, or rely on Pay's internal logic/ESC key */}
                 <DialogClose asChild className="absolute right-2 top-2 z-50">
                    <Button variant="ghost" size="icon" className="text-background hover:bg-background/20 rounded-full">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </Button>
                </DialogClose>
              </DialogContent>
            )}
            
            {/* Placeholder for Pay Bills and Withdraw dialogs */}
            {(action.dialogKey === 'paybills' || action.dialogKey === 'withdraw') && (
                 <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{action.label}</DialogTitle>
                         <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground absolute right-4 top-4">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </DialogClose>
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
