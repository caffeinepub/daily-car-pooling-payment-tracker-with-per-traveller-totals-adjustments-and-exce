import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLedgerState } from './LedgerStateContext';

interface CoTravellerIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'add' | 'edit';
  existingIncome?: {
    id: string;
    amount: number;
    date: string;
    note?: string;
  };
}

export default function CoTravellerIncomeDialog({ open, onOpenChange, mode = 'add', existingIncome }: CoTravellerIncomeDialogProps) {
  const { addCoTravellerIncome, updateCoTravellerIncome } = useLedgerState();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && mode === 'edit' && existingIncome) {
      setAmount(existingIncome.amount.toString());
      setDate(new Date(existingIncome.date));
      setNote(existingIncome.note || '');
    } else if (open && mode === 'add') {
      setAmount('');
      setDate(new Date());
      setNote('');
    }
  }, [open, mode, existingIncome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'edit' && existingIncome) {
        updateCoTravellerIncome(existingIncome.id, {
          amount: parsedAmount,
          date: format(date, 'yyyy-MM-dd'),
          note: note.trim() || undefined,
        });
        toast.success('Other Co-Traveller income updated successfully');
      } else {
        addCoTravellerIncome({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          amount: parsedAmount,
          date: format(date, 'yyyy-MM-dd'),
          note: note.trim() || undefined,
        });
        toast.success('Other Co-Traveller income added successfully');
      }

      setAmount('');
      setDate(new Date());
      setNote('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save income:', error);
      toast.error('Failed to save income. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add'} Other Co-Traveller Income</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update' : 'Record'} income from other co-travellers
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                mode === 'edit' ? 'Update Income' : 'Add Income'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
