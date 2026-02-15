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
import { Plus, Car, IndianRupee } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/money';
import { Separator } from '@/components/ui/separator';
import { useAutoTollSettings } from '../../hooks/useAutoTollSettings';
import { getWeekdaysInRange } from '../../utils/dateRange';

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

  // Auto-add toll expenses when enabled
  useEffect(() => {
    if (!autoTollEnabled) return;

    const weekdays = getWeekdaysInRange(dateRange.start, dateRange.end);
    const existingTollDates = new Set(
      carExpenses
        .filter((e) => e.category === 'Toll')
        .map((e) => e.date)
    );

    let addedCount = 0;
    weekdays.forEach((dateKey) => {
      if (!existingTollDates.has(dateKey)) {
        addCarExpense({
          category: 'Toll',
          amount: autoTollAmount,
          date: dateKey,
          note: 'Auto-added',
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Auto-added ${addedCount} toll expense(s) for weekdays`);
    }
  }, [autoTollEnabled, dateRange, autoTollAmount]);

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

  const handleAutoTollAmountChange = (value: string) => {
    setLocalAutoTollAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setAutoTollAmount(num);
    }
  };

  const handleAutoTollToggle = (checked: boolean) => {
    setAutoTollEnabled(checked);
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
        {/* Auto Toll Add Section */}
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-toll-toggle" className="text-base font-medium">
                Auto Toll Add
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically add toll expenses for weekdays
              </p>
            </div>
            <Switch
              id="auto-toll-toggle"
              checked={autoTollEnabled}
              onCheckedChange={handleAutoTollToggle}
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
                disabled={autoTollEnabled}
                className="pl-9"
                placeholder="30"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {autoTollEnabled 
                ? 'Amount is read-only while Auto Toll is enabled' 
                : 'Enter the toll amount to auto-add for each weekday'}
            </p>
          </div>
        </div>

        <Separator />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Car Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Car Expense</DialogTitle>
              <DialogDescription>Record a new car expense</DialogDescription>
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

        {/* Totals Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Expenses in Current Range</h4>
          {Object.keys(totals.categoryTotals).length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
          ) : (
            <div className="space-y-1">
              {Object.entries(totals.categoryTotals).map(([cat, total]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{cat}</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
