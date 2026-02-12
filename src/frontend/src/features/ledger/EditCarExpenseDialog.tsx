import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CarExpense } from '../../hooks/useLedgerLocalState';

const PREDEFINED_CATEGORIES = [
  'CNG BRD',
  'CNG AHM',
  'Petrol',
  'Maintenance Cost',
  'Toll',
  'Other',
];

interface EditCarExpenseDialogProps {
  expense: CarExpense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateExpense: (id: string, updates: Partial<CarExpense>) => void;
}

export default function EditCarExpenseDialog({
  expense,
  open,
  onOpenChange,
  onUpdateExpense,
}: EditCarExpenseDialogProps) {
  const [date, setDate] = useState(expense.date);
  const [category, setCategory] = useState(expense.category);
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState(expense.amount.toString());
  const [note, setNote] = useState(expense.note || '');
  const [error, setError] = useState('');

  // Determine if the category is predefined or custom
  const isPredefinedCategory = PREDEFINED_CATEGORIES.includes(expense.category);
  const [selectedCategory, setSelectedCategory] = useState(
    isPredefinedCategory ? expense.category : 'Other'
  );

  useEffect(() => {
    if (!isPredefinedCategory) {
      setCustomCategory(expense.category);
    }
  }, [expense.category, isPredefinedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (selectedCategory === 'Other' && !customCategory.trim()) {
      setError('Please enter a custom category name for Other');
      return;
    }

    const finalCategory = selectedCategory === 'Other' ? customCategory.trim() : selectedCategory;

    onUpdateExpense(expense.id, {
      date,
      category: finalCategory,
      amount: numAmount,
      note: note || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Car Expense</DialogTitle>
          <DialogDescription>Update the details of this car expense</DialogDescription>
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategory === 'Other' && (
              <div className="grid gap-2">
                <Label htmlFor="edit-customCategory">
                  Custom Category Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-customCategory"
                  type="text"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setError('');
                  }}
                />
              </div>
            )}

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

            {error && <p className="text-sm text-destructive">{error}</p>}
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
