import { useLedgerState } from './LedgerStateContext';
import { formatCurrency } from '../../utils/money';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '../../components/EmptyState';
import { Car, Pencil, Trash2, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import EditCarExpenseDialog from './EditCarExpenseDialog';
import DeleteCarExpenseAlertDialog from './DeleteCarExpenseAlertDialog';
import type { CarExpense } from '../../hooks/useLedgerLocalState';

export default function ExpenseHistoryView() {
  const { carExpenses, dateRange, updateCarExpense, removeCarExpense } = useLedgerState();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpense, setEditingExpense] = useState<CarExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<CarExpense | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(carExpenses.map((e) => e.category))).sort();

  // Filter expenses by date range, category, and search
  const filteredExpenses = carExpenses.filter((expense) => {
    try {
      const expenseDate = parseISO(expense.date);
      const inRange = expenseDate >= dateRange.start && expenseDate <= dateRange.end;
      const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.note?.toLowerCase().includes(searchQuery.toLowerCase());
      return inRange && matchesCategory && matchesSearch;
    } catch {
      return false;
    }
  });

  // Sort by date descending
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    try {
      return parseISO(b.date).getTime() - parseISO(a.date).getTime();
    } catch {
      return 0;
    }
  });

  const handleUpdateExpense = (id: string, updates: Partial<CarExpense>) => {
    updateCarExpense(id, updates);
    setEditingExpense(null);
  };

  const handleConfirmDelete = () => {
    if (deletingExpense) {
      removeCarExpense(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  if (carExpenses.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="No Expense Records"
        description="Start tracking expenses by adding your first expense record."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by category or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48 space-y-2">
          <Label htmlFor="category-filter">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {sortedExpenses.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No Matching Expenses"
          description="Try adjusting your filters or search query."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{format(parseISO(expense.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IndianRupee className="h-3 w-3" />
                      <span>{formatCurrency(expense.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{expense.note || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingExpense(expense)}
                        aria-label="Edit expense"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingExpense(expense)}
                        aria-label="Delete expense"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      {editingExpense && (
        <EditCarExpenseDialog
          expense={editingExpense}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          onUpdateExpense={handleUpdateExpense}
        />
      )}

      {/* Delete Confirmation */}
      {deletingExpense && (
        <DeleteCarExpenseAlertDialog
          open={!!deletingExpense}
          onOpenChange={(open) => !open && setDeletingExpense(null)}
          onConfirmDelete={handleConfirmDelete}
          category={deletingExpense.category}
          amount={deletingExpense.amount}
        />
      )}
    </div>
  );
}
