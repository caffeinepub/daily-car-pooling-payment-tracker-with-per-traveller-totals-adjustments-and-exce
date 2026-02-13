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

  // Filter expenses by date range, category, and search query
  const filteredExpenses = carExpenses
    .filter((expense) => {
      // Filter by date range
      try {
        const expenseDate = parseISO(expense.date);
        if (expenseDate < dateRange.start || expenseDate > dateRange.end) {
          return false;
        }
      } catch {
        return false;
      }

      // Filter by category
      if (selectedCategory !== 'all' && expense.category !== selectedCategory) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesCategory = expense.category.toLowerCase().includes(query);
        const matchesNote = expense.note?.toLowerCase().includes(query);
        return matchesCategory || matchesNote;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by date, newest first
      try {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="category-filter">Filter by Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="search-query">Search</Label>
            <Input
              id="search-query"
              placeholder="Search by category or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing expenses from {format(dateRange.start, 'MMM dd, yyyy')} to{' '}
          {format(dateRange.end, 'MMM dd, yyyy')}
        </p>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No expenses found"
          description="Car expenses will appear here once they are recorded"
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
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
                  <TableCell className="font-medium">
                    {format(parseISO(expense.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="text-right font-semibold">
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
                        onClick={() => setEditingExpense(expense)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingExpense(expense)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
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
          onUpdateExpense={(expenseId, updates) => {
            updateCarExpense(expenseId, updates);
            setEditingExpense(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingExpense && (
        <DeleteCarExpenseAlertDialog
          open={!!deletingExpense}
          onOpenChange={(open) => !open && setDeletingExpense(null)}
          onConfirmDelete={() => {
            removeCarExpense(deletingExpense.id);
            setDeletingExpense(null);
          }}
          category={deletingExpense.category}
          amount={deletingExpense.amount}
        />
      )}
    </div>
  );
}
