import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee } from 'lucide-react';
import type { CashPayment } from '../../hooks/useLedgerLocalState';

export interface EditCashPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: CashPayment | null;
  travellerName: string;
  onUpdatePayment: (paymentId: string, updates: Partial<Pick<CashPayment, 'amount' | 'date' | 'note'>>) => void;
}

export default function EditCashPaymentDialog({
  open,
  onOpenChange,
  payment,
  travellerName,
  onUpdatePayment,
}: EditCashPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (payment && open) {
      setAmount(String(payment.amount));
      setDate(payment.date);
      setNote(payment.note || '');
      setAmountError('');
    }
  }, [payment, open]);

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!amount.trim() || isNaN(val) || val <= 0) {
      setAmountError('Enter a valid amount greater than 0');
      return;
    }
    if (!payment) return;
    onUpdatePayment(payment.id, { amount: val, date, note: note.trim() || undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-md mx-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg sm:text-xl">Edit Cash Payment</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Update payment details for{' '}
            <span className="font-medium">{travellerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ecp-amount" className="text-xs sm:text-sm">Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <IndianRupee className="h-3.5 w-3.5" />
              </span>
              <Input
                id="ecp-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
                className="pl-8 h-11 text-sm"
              />
            </div>
            {amountError && <p className="text-destructive text-xs">{amountError}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="ecp-date" className="text-xs sm:text-sm">Date</Label>
            <Input
              id="ecp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ecp-note" className="text-xs sm:text-sm">Note (optional)</Label>
            <Input
              id="ecp-note"
              type="text"
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 text-sm">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto h-11 text-sm font-semibold">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
