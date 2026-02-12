import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { CashPayment } from '../../hooks/useLedgerLocalState';

interface EditCashPaymentDialogProps {
  payment: CashPayment;
  travellerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdatePayment: (paymentId: string, patch: Partial<Pick<CashPayment, 'amount' | 'date' | 'note'>>) => void;
}

export default function EditCashPaymentDialog({
  payment,
  travellerName,
  open,
  onOpenChange,
  onUpdatePayment,
}: EditCashPaymentDialogProps) {
  const [amount, setAmount] = useState(payment.amount.toString());
  const [date, setDate] = useState(payment.date);
  const [note, setNote] = useState(payment.note || '');
  const [error, setError] = useState('');

  // Reset form when payment changes or dialog opens
  useEffect(() => {
    if (open) {
      setAmount(payment.amount.toString());
      setDate(payment.date);
      setNote(payment.note || '');
      setError('');
    }
  }, [open, payment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    onUpdatePayment(payment.id, {
      amount: numAmount,
      date,
      note: note || undefined,
    });

    toast.success(`Payment updated for ${travellerName}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Cash Payment
          </DialogTitle>
          <DialogDescription>
            Update the payment details for {travellerName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">
                Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className={error ? 'border-destructive' : ''}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Payment Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-note">Note (optional)</Label>
              <Textarea
                id="edit-note"
                placeholder="Add a note about this payment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
