import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { CarExpense } from '../../hooks/useLedgerLocalState';

interface EditCarExpenseDialogProps {
  expense: CarExpense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateExpense: (expenseId: string, patch: Partial<Pick<CarExpense, 'category' | 'amount' | 'date' | 'note'>>) => void;
}

export default function EditCarExpenseDialog({
  expense,
  open,
  onOpenChange,
  onUpdateExpense,
}: EditCarExpenseDialogProps) {
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [date, setDate] = useState(expense.date);
  const [note, setNote] = useState(expense.note || '');
  const [error, setError] = useState('');

  // Reset form when expense changes or dialog opens
  useEffect(() => {
    if (open) {
      setCategory(expense.category);
      setAmount(expense.amount.toString());
      setDate(expense.date);
      setNote(expense.note || '');
      setError('');
    }
  }, [open, expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!category.trim()) {
      setError('Please enter a category');
      return;
    }

    onUpdateExpense(expense.id, {
      category: category.trim(),
      amount: numAmount,
      date,
      note: note || undefined,
    });

    toast.success(`Expense updated for ${category}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Car Expense
          </DialogTitle>
          <DialogDescription>
            Update the expense details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-category"
                type="text"
                placeholder="Enter category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setError('');
                }}
              />
            </div>
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
              <Label htmlFor="edit-note">Note (optional)</Label>
              <Textarea
                id="edit-note"
                placeholder="Add a note about this expense"
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
