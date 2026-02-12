import { useLedgerState } from './LedgerStateContext';
import { formatCurrency } from '../../utils/money';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import EmptyState from '../../components/EmptyState';
import { Receipt, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EditCashPaymentDialog from './EditCashPaymentDialog';
import DeleteCashPaymentAlertDialog from './DeleteCashPaymentAlertDialog';
import type { CashPayment } from '../../hooks/useLedgerLocalState';

export default function PaymentHistoryView() {
  const { travellers, cashPayments, dateRange, updateCashPayment, removeCashPayment } = useLedgerState();
  const [selectedTravellerId, setSelectedTravellerId] = useState<string>('all');
  const [editingPayment, setEditingPayment] = useState<CashPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<CashPayment | null>(null);

  // Filter payments by date range and selected traveller
  const filteredPayments = cashPayments
    .filter((payment) => {
      // Filter by traveller
      if (selectedTravellerId !== 'all' && payment.travellerId !== selectedTravellerId) {
        return false;
      }

      // Filter by date range
      try {
        const paymentDate = parseISO(payment.date);
        return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
      } catch {
        return false;
      }
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

  // Get traveller name by ID
  const getTravellerName = (travellerId: string): string => {
    const traveller = travellers.find((t) => t.id === travellerId);
    return traveller?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="traveller-filter">Filter by Traveller</Label>
        <Select value={selectedTravellerId} onValueChange={setSelectedTravellerId}>
          <SelectTrigger id="traveller-filter" className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select traveller" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All travellers</SelectItem>
            {travellers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Showing payments from {format(dateRange.start, 'MMM dd, yyyy')} to{' '}
          {format(dateRange.end, 'MMM dd, yyyy')}
        </p>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments recorded yet"
          description="Cash payments will appear here once they are recorded"
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Traveller</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {format(parseISO(payment.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{getTravellerName(payment.travellerId)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.note || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPayment(payment)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit payment</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingPayment(payment)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete payment</span>
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
      {editingPayment && (
        <EditCashPaymentDialog
          payment={editingPayment}
          travellerName={getTravellerName(editingPayment.travellerId)}
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
          onUpdatePayment={updateCashPayment}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPayment && (
        <DeleteCashPaymentAlertDialog
          open={!!deletingPayment}
          onOpenChange={(open) => !open && setDeletingPayment(null)}
          onConfirmDelete={() => removeCashPayment(deletingPayment.id)}
          travellerName={getTravellerName(deletingPayment.travellerId)}
          amount={deletingPayment.amount}
        />
      )}
    </div>
  );
}
