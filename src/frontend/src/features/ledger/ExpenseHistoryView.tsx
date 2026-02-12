import { useState, useMemo } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../utils/money';
import EmptyState from '../../components/EmptyState';
import ResponsiveTableShell from '../../components/ResponsiveTableShell';
import EditCarExpenseDialog from './EditCarExpenseDialog';
import DeleteCarExpenseAlertDialog from './DeleteCarExpenseAlertDialog';
import type { CarExpense } from '../../hooks/useLedgerLocalState';

export default function ExpenseHistoryView() {
  const { dateRange, carExpenses, updateCarExpense, removeCarExpense } = useLedgerState();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpense, setEditingExpense] = useState<CarExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<CarExpense | null>(null);

  // Get unique categories from existing expenses
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    carExpenses.forEach((expense) => categories.add(expense.category));
    return Array.from(categories).sort();
  }, [carExpenses]);

  // Filter expenses by date range, category, and search
  const filteredExpenses = useMemo(() => {
    return carExpenses
      .filter((expense) => {
        try {
          const expenseDate = parseISO(expense.date);
          const inRange = expenseDate >= dateRange.start && expenseDate <= dateRange.end;
          if (!inRange) return false;

          // Category filter
          if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
            return false;
          }

          // Search filter (case-insensitive, matches category or note)
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesCategory = expense.category.toLowerCase().includes(query);
            const matchesNote = expense.note?.toLowerCase().includes(query);
            return matchesCategory || matchesNote;
          }

          return true;
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by date descending (newest first)
        try {
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);
          return dateB.getTime() - dateA.getTime();
        } catch {
          return 0;
        }
      });
  }, [carExpenses, dateRange, categoryFilter, searchQuery]);

  const handleEdit = (expense: CarExpense) => {
    setEditingExpense(expense);
  };

  const handleDelete = (expense: CarExpense) => {
    setDeletingExpense(expense);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category-filter">Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by category or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description={
            searchQuery || categoryFilter !== 'all'
              ? 'No expenses match your current filters and date range.'
              : 'No expenses recorded in the selected date range.'
          }
        />
      ) : (
        <ResponsiveTableShell>
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
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(parseISO(expense.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.note || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(expense)}
                        aria-label="Edit expense"
                      >
                        <span className="sr-only">Edit</span>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense)}
                        aria-label="Delete expense"
                      >
                        <span className="sr-only">Delete</span>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTableShell>
      )}

      {/* Edit Dialog */}
      {editingExpense && (
        <EditCarExpenseDialog
          expense={editingExpense}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          onUpdateExpense={updateCarExpense}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingExpense && (
        <DeleteCarExpenseAlertDialog
          open={!!deletingExpense}
          onOpenChange={(open) => !open && setDeletingExpense(null)}
          onConfirmDelete={() => removeCarExpense(deletingExpense.id)}
          category={deletingExpense.category}
          amount={deletingExpense.amount}
        />
      )}
    </div>
  );
}
