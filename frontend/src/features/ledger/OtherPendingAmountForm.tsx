import React, { useState } from 'react';
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

export interface OtherPending {
  id?: string;
  travellerId: string;
  amount: number;
  date: string;
  note?: string;
}

interface OtherPendingAmountFormProps {
  travellerId: string;
  travellerName: string;
  onSubmit: (pending: Omit<OtherPending, 'id'>) => void;
  defaultDate?: string;
}

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function OtherPendingAmountForm({
  travellerName,
  travellerId,
  onSubmit,
  defaultDate,
}: OtherPendingAmountFormProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayStr());
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');

  const handleOpen = () => {
    setAmount('');
    setDate(defaultDate || getTodayStr());
    setNote('');
    setAmountError('');
    setOpen(true);
  };

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (!amount.trim() || isNaN(val) || val <= 0) {
      setAmountError('Enter a valid amount greater than 0');
      return;
    }
    onSubmit({ travellerId, amount: val, date, note: note.trim() || undefined });
    setOpen(false);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen} className="h-9 text-xs sm:text-sm">
        + Other Pending
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md mx-auto p-4 sm:p-6 rounded-xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg sm:text-xl">Add Other Pending Amount</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Record a pending amount for <span className="font-medium">{travellerName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="op-amount" className="text-xs sm:text-sm">Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <IndianRupee className="h-3.5 w-3.5" />
                </span>
                <Input
                  id="op-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
                  className="pl-8 h-11 text-sm"
                />
              </div>
              {amountError && <p className="text-destructive text-xs">{amountError}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="op-date" className="text-xs sm:text-sm">Date</Label>
              <Input
                id="op-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="op-note" className="text-xs sm:text-sm">Note (optional)</Label>
              <Input
                id="op-note"
                type="text"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-11 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto h-11 text-sm">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto h-11 text-sm font-semibold">
              Add Pending Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
