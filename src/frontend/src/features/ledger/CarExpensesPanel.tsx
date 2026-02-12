import { useState, useMemo } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Car } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/money';
import { Separator } from '@/components/ui/separator';

const PREDEFINED_CATEGORIES = [
  'CNG BRD',
  'CNG AHM',
  'Petrol',
  'Maintenance Cost',
  'Other',
];

export default function CarExpensesPanel() {
  const { dateRange, carExpenses, addCarExpense } = useLedgerState();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    if (category === 'Other' && !customCategory.trim()) {
      setError('Please enter a custom category name for Other');
      return;
    }

    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    addCarExpense({
      category: finalCategory,
      amount: numAmount,
      date,
      note: note || undefined,
    });
    toast.success(`Car expense of ₹${numAmount} added for ${finalCategory}`);
    
    // Reset form
    setCategory('');
    setCustomCategory('');
    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setNote('');
    setOpen(false);
  };

  // Calculate totals for the current date range
  const totals = useMemo(() => {
    const expensesInRange = carExpenses.filter((expense) => {
      try {
        const expenseDate = parseISO(expense.date);
        return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
      } catch {
        return false;
      }
    });

    const categoryTotals: Record<string, number> = {};
    let grandTotal = 0;

    expensesInRange.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
      grandTotal += expense.amount;
    });

    return { categoryTotals, grandTotal };
  }, [carExpenses, dateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Car Expenses
        </CardTitle>
        <CardDescription>Track daily car expenses by category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Car Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Add Car Expense
              </DialogTitle>
              <DialogDescription>
                Record a car expense for the selected category
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
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

                {category === 'Other' && (
                  <div className="grid gap-2">
                    <Label htmlFor="customCategory">
                      Custom Category Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="customCategory"
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
                  <Label htmlFor="amount">
                    Amount (₹) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Add a note about this expense"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Expense</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Totals for Selected Date Range</h3>
          
          {Object.keys(totals.categoryTotals).length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses recorded in this date range</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(totals.categoryTotals)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([cat, total]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{cat}:</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                ))}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between text-base font-semibold">
                <span>Grand Total:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
