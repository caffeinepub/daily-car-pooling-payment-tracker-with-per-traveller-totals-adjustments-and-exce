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
import { IndianRupee, Loader2 } from 'lucide-react';
import { useLedgerState } from './LedgerStateContext';
import { toast } from 'sonner';

interface ExpenseEntry {
  category: string;
  amount: string;
  date: string;
}

interface MultiCategoryExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
}

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function MultiCategoryExpenseForm({
  open,
  onOpenChange,
  defaultDate,
}: MultiCategoryExpenseFormProps) {
  const { addCarExpense } = useLedgerState();
  const today = defaultDate || getTodayStr();

  const getInitialEntries = (): ExpenseEntry[] => [
    { category: 'Toll', amount: '30', date: today },
    { category: 'CNG BRD', amount: '', date: today },
    { category: 'CNG AHM', amount: '', date: today },
  ];

  const [entries, setEntries] = useState<ExpenseEntry[]>(getInitialEntries());
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      const t = defaultDate || getTodayStr();
      setEntries([
        { category: 'Toll', amount: '30', date: t },
        { category: 'CNG BRD', amount: '', date: t },
        { category: 'CNG AHM', amount: '', date: t },
      ]);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, defaultDate]);

  const updateEntry = (index: number, field: keyof ExpenseEntry, value: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (field === 'amount' && errors[index]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: { [key: number]: string } = {};
    entries.forEach((entry, i) => {
      const val = parseFloat(entry.amount);
      if (entry.amount.trim() === '' || isNaN(val) || val <= 0) {
        newErrors[i] = 'Enter a valid amount greater than 0';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save all three expenses to local state immediately
      entries.forEach((entry) => {
        const numAmount = parseFloat(entry.amount);
        addCarExpense({
          category: entry.category,
          amount: numAmount,
          date: entry.date,
        });
      });

      toast.success('3 expenses added successfully');
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to add expenses:', err);
      toast.error('Failed to add expenses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-lg mx-auto p-4 sm:p-6 rounded-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg sm:text-xl">Add 3 Expenses</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Add Toll, CNG BRD, and CNG AHM expenses at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={entry.category} className="space-y-2">
              <h3 className="font-semibold text-sm sm:text-base">{entry.category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`amount-${index}`} className="text-xs sm:text-sm">
                    Amount (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IndianRupee className="h-3.5 w-3.5" />
                    </span>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={entry.amount}
                      onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                      className="pl-8 h-11 text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors[index] && (
                    <p className="text-destructive text-xs">{errors[index]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`date-${index}`} className="text-xs sm:text-sm">
                    Date
                  </Label>
                  <Input
                    id={`date-${index}`}
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateEntry(index, 'date', e.target.value)}
                    className="h-11 text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              {index < entries.length - 1 && (
                <div className="border-b border-border mt-3" />
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto h-11 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full sm:w-auto h-11 text-sm font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Add All 3 Expenses'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
