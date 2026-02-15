import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';

interface EditCoTravellerIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeId: string;
  currentAmount: number;
  currentDate: string;
  currentNote?: string;
  onSave: (incomeId: string, amount: number, date: string, note?: string) => void;
}

export default function EditCoTravellerIncomeDialog({
  open,
  onOpenChange,
  incomeId,
  currentAmount,
  currentDate,
  currentNote,
  onSave,
}: EditCoTravellerIncomeDialogProps) {
  const [amount, setAmount] = useState(currentAmount.toString());
  const [date, setDate] = useState(currentDate);
  const [note, setNote] = useState(currentNote || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAmount(currentAmount.toString());
      setDate(currentDate);
      setNote(currentNote || '');
      setError('');
    }
  }, [open, currentAmount, currentDate, currentNote]);

  const handleSave = () => {
    setError('');
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    onSave(incomeId, numAmount, date, note || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Co-Traveller Income</DialogTitle>
          <DialogDescription>
            Update the income entry details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount (₹)</Label>
            <Input
              id="edit-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-note">Note (Optional)</Label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
