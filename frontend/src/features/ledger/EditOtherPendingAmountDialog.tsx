import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { useLedgerState } from './LedgerStateContext';
import type { OtherPending } from '../../hooks/useLedgerLocalState';

interface EditOtherPendingAmountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: OtherPending | null;
  travellerName: string;
}

export default function EditOtherPendingAmountDialog({
  open,
  onOpenChange,
  entry,
  travellerName,
}: EditOtherPendingAmountDialogProps) {
  const { updateOtherPending } = useLedgerState();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [amountError, setAmountError] = useState('');

  // Pre-fill form when entry changes
  useEffect(() => {
    if (entry && open) {
      setAmount(entry.amount.toString());
      setDate(entry.date);
      setComment(entry.note || '');
      setAmountError('');
    }
  }, [entry, open]);

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!amount.trim() || isNaN(val) || val <= 0) {
      setAmountError('Enter a valid amount greater than 0');
      return;
    }

    if (!entry) return;

    updateOtherPending(entry.id, {
      amount: val,
      date,
      note: comment.trim() || undefined,
    });

    toast.success('Pending amount updated successfully');
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-md mx-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg sm:text-xl">Edit Other Pending Amount</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Editing pending amount for <span className="font-medium">{travellerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name (read-only) */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Name</Label>
            <Input
              type="text"
              value={travellerName}
              readOnly
              className="h-11 text-sm bg-muted cursor-not-allowed"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="edit-op-amount" className="text-xs sm:text-sm">Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <IndianRupee className="h-3.5 w-3.5" />
              </span>
              <Input
                id="edit-op-amount"
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

          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="edit-op-date" className="text-xs sm:text-sm">Date</Label>
            <Input
              id="edit-op-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1">
            <Label htmlFor="edit-op-comment" className="text-xs sm:text-sm">Comment (optional)</Label>
            <Input
              id="edit-op-comment"
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-11 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto h-11 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto h-11 text-sm font-semibold"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
