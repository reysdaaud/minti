'use client';
import type { FC } from 'react';
import { ArrowRightLeft, PlusCircle, ReceiptText, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea import

interface ActionItem {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
}

interface TransferFormData {
  recipient: string; // Changed from receiverEmail to recipient
  amount: string;
  note?: string; // Added note field
}

const defaultFormData: TransferFormData = {
  recipient: '',
  amount: '',
  note: '',
};

const UserActions: FC = () => {
  const actions: ActionItem[] = [
    {
      label: 'Transfer',
      icon: ArrowRightLeft,
      onClick: () => {},
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

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const handleTopUpClick = () => {
    setTopUpOpen(true);
  };
  const [formData, setFormData] = useState<TransferFormData>(defaultFormData);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSend = () => {
    console.log('Send clicked');
    console.log(formData);
    // Reset form after sending (optional)
    // setFormData(defaultFormData);
    // setTransferDialogOpen(false); // Close dialog
  };

  const handleTransferClick = () => {
    setTransferDialogOpen(true);
  };

  return (
    <section className="py-6">
      <div className="flex flex-row justify-around items-center space-x-2 sm:space-x-3 p-3 bg-card border border-border rounded-lg shadow-md">
        {actions.map((action) => (
          <>
            {action.label === 'Transfer' ? (
              <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    key={action.label}
                    variant="ghost"
                    className="flex flex-col items-center justify-center h-auto p-2 space-y-2 text-primary-foreground hover:bg-primary/10 group transition-all duration-200 hover:shadow-sm rounded-md flex-1 max-w-[100px]"
                    onClick={handleTransferClick}
                    aria-label={action.label}
                  >
                    <div className="p-3 border-2 border-primary/40 group-hover:border-primary transition-colors duration-200 rounded-lg">
                      <action.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="text-xs sm:text-sm text-primary group-hover:font-semibold whitespace-nowrap">{action.label}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-xs p-[30px] rounded-[20px] send-money-dialog-content">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-center mb-5 text-white">Send Money</DialogTitle>
                    {/* DialogDescription removed as per mockup */}
                  </DialogHeader>
                  <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5"> {/* Reduced gap from 2 to 1.5 to match mockup density */}
                      <Label htmlFor="recipient" className="text-sm text-white"> 
                        Recipient
                      </Label>
                      <Input
                        id="recipient"
                        name="recipient"
                        value={formData.recipient}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Enter recipient name or email"
                        className="glass-input"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="amount" className="text-sm text-white">
                        Amount
                      </Label>
                      <Input
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        type="number"
                        placeholder="$0.00"
                        className="glass-input"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="note" className="text-sm text-white">
                        Note
                      </Label>
                      <Textarea
                        id="note"
                        name="note"
                        value={formData.note}
                        onChange={handleInputChange}
                        placeholder="Add a note (optional)"
                        className="glass-input"
                      />
                    </div>
                    <Button onClick={handleSend} className="send-money-button mt-2"> {/* Reduced mt from 4 to 2 */}
                      Send
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            ) : action.label === 'Top-up' ? (
              <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
                <DialogTrigger asChild>
                  <Button
                    key={action.label}
                    variant="ghost"
                    className="flex flex-col items-center justify-center h-auto p-2 space-y-2 text-primary-foreground hover:bg-primary/10 group transition-all duration-200 hover:shadow-sm rounded-md flex-1 max-w-[100px]"
                    onClick={handleTopUpClick}
                    aria-label={action.label}
                  >
                    <div className="p-3 border-2 border-primary/40 group-hover:border-primary transition-colors duration-200 rounded-lg">
                      <action.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="text-xs sm:text-sm text-primary group-hover:font-semibold whitespace-nowrap">{action.label}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] glassmorphic-dialog">
                  {/* Kept original Top-up dialog content, only Transfer dialog is changed */}
                  <DialogHeader>
                    <DialogTitle>Top Up Options</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                    <p className="text-sm">100 coins - $10</p>
                    <p className="text-sm">200 coins - $15</p>
                    <p className="text-sm">350 coins - $25</p>
                  </div>
                  <Button>Buy Coins</Button>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                key={action.label}
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
            )}
          </>
        ))}
      </div>
    </section>
  );
};

export default UserActions;
