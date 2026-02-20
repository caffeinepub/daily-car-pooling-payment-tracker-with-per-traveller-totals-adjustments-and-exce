import { useState, useMemo, useEffect } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Car, IndianRupee, Layers } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/money';
import { Separator } from '@/components/ui/separator';
import { useAutoTollSettings } from '../../hooks/useAutoTollSettings';
import MultiCategoryExpenseForm from './MultiCategoryExpenseForm';

const PREDEFINED_CATEGORIES = [
  'CNG BRD',
  'CNG AHM',
  'Petrol',
  'Maintenance Cost',
  'Toll',
  'Other',
];

export default function CarExpensesPanel() {
  const { dateRange, carExpenses, addCarExpense } = useLedgerState();
  const { enabled: autoTollEnabled, amount: autoTollAmount, setEnabled: setAutoTollEnabled, setAmount: setAutoTollAmount } = useAutoTollSettings();
  
  const [open, setOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [localAutoTollAmount, setLocalAutoTollAmount] = useState(autoTollAmount.toString());

  // Sync local amount input with persisted amount
  useEffect(() => {
    setLocalAutoTollAmount(autoTollAmount.toString());
  }, [autoTollAmount]);

  // Default amount to 30 when Toll is selected
  useEffect(() => {
    if (category === 'Toll' && !amount) {
      setAmount('30');
    }
  }, [category]);

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
    toast.success(`Expense of ₹${numAmount} added for ${finalCategory}`);
    
    // Reset form
    setCategory('');
    setCustomCategory('');
    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setNote('');
    setOpen(false);
  };

  const handleAutoTollAmountChange = (value: string) => {
    setLocalAutoTollAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setAutoTollAmount(num);
    }
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
          Expense Record
        </CardTitle>
        <CardDescription>Track daily expenses by category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto Toll Add Section - Global Toggle */}
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-toll-toggle" className="text-base font-medium">Auto Toll Add</Label>
              <p className="text-sm text-muted-foreground">
                Automatically add toll expenses for new days
              </p>
            </div>
            <Switch
              id="auto-toll-toggle"
              checked={autoTollEnabled}
              onCheckedChange={setAutoTollEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="auto-toll-amount">Toll Amount</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="auto-toll-amount"
                type="number"
                min="1"
                step="1"
                value={localAutoTollAmount}
                onChange={(e) => handleAutoTollAmountChange(e.target.value)}
                className="pl-9"
                placeholder="30"
                disabled={autoTollEnabled}
                readOnly={autoTollEnabled}
              />
            </div>
            {autoTollEnabled && (
              <p className="text-xs text-muted-foreground">
                Turn off Auto Toll Add to edit the amount
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
                <DialogDescription>Record a new expense</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="customCategory">Custom Category</Label>
                    <Input
                      id="customCategory"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add any additional details"
                    rows={3}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Expense</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="flex-1" onClick={() => setMultiOpen(true)}>
            <Layers className="mr-2 h-4 w-4" />
            Add 3 Expenses
          </Button>
        </div>

        <MultiCategoryExpenseForm open={multiOpen} onOpenChange={setMultiOpen} />

        {/* Totals Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Totals for Selected Range</h3>
          <div className="space-y-1 text-sm">
            {Object.entries(totals.categoryTotals).map(([cat, total]) => (
              <div key={cat} className="flex justify-between">
                <span className="text-muted-foreground">{cat}:</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Grand Total:</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
