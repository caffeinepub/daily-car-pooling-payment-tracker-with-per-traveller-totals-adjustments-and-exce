import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLedgerState } from './LedgerStateContext';
import { Separator } from '@/components/ui/separator';

interface MultiCategoryExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExpenseFormData {
  category: string;
  amount: string;
  date: string;
}

export default function MultiCategoryExpenseForm({ open, onOpenChange }: MultiCategoryExpenseFormProps) {
  const { addCarExpense } = useLedgerState();
  
  const [expenses, setExpenses] = useState<ExpenseFormData[]>([
    { category: 'Toll', amount: '', date: format(new Date(), 'yyyy-MM-dd') },
    { category: 'CNG BRD', amount: '', date: format(new Date(), 'yyyy-MM-dd') },
    { category: 'CNG AHM', amount: '', date: format(new Date(), 'yyyy-MM-dd') },
  ]);
  const [error, setError] = useState('');

  const handleAmountChange = (index: number, value: string) => {
    const updated = [...expenses];
    updated[index].amount = value;
    setExpenses(updated);
  };

  const handleDateChange = (index: number, value: string) => {
    const updated = [...expenses];
    updated[index].date = value;
    setExpenses(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all amounts
    for (let i = 0; i < expenses.length; i++) {
      const numAmount = parseFloat(expenses[i].amount);
      if (!expenses[i].amount || isNaN(numAmount) || numAmount <= 0) {
        setError(`Please enter a valid amount for ${expenses[i].category}`);
        return;
      }
    }

    // Add all 3 expenses
    expenses.forEach((expense) => {
      addCarExpense({
        category: expense.category,
        amount: parseFloat(expense.amount),
        date: expense.date,
      });
    });

    toast.success('3 expenses added successfully');
    
    // Reset form
    setExpenses([
      { category: 'Toll', amount: '', date: format(new Date(), 'yyyy-MM-dd') },
      { category: 'CNG BRD', amount: '', date: format(new Date(), 'yyyy-MM-dd') },
      { category: 'CNG AHM', amount: '', date: format(new Date(), 'yyyy-MM-dd') },
    ]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add 3 Expenses</DialogTitle>
          <DialogDescription>Add Toll, CNG BRD, and CNG AHM expenses at once</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {expenses.map((expense, index) => (
            <div key={expense.category} className="space-y-4">
              {index > 0 && <Separator />}
              <div className="space-y-3">
                <h3 className="font-semibold text-base">{expense.category}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`amount-${index}`}>Amount (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={expense.amount}
                        onChange={(e) => handleAmountChange(index, e.target.value)}
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`date-${index}`}>Date</Label>
                    <Input
                      id={`date-${index}`}
                      type="date"
                      value={expense.date}
                      onChange={(e) => handleDateChange(index, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add All 3 Expenses</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
