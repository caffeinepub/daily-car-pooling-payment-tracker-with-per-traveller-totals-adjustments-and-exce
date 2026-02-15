import { useMemo, useState } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getDaysInRange } from '../../utils/dateRange';
import ResponsiveTableShell from '../../components/ResponsiveTableShell';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../../utils/money';
import { getChargeClassName, getPaymentClassName } from '../../utils/paymentStatus';
import EditTripHistoryTravellerDialog from './EditTripHistoryTravellerDialog';
import EditCoTravellerIncomeDialog from './EditCoTravellerIncomeDialog';
import DeleteTripHistoryRowAlertDialog from './DeleteTripHistoryRowAlertDialog';
import { toast } from 'sonner';

interface TripHistoryRow {
  travellerName: string;
  travellerId?: string;
  date: string;
  tripCount: number;
  amount: number;
  type: 'traveller' | 'coTraveller';
  incomeId?: string;
  morning?: boolean;
  evening?: boolean;
  note?: string;
}

export default function TripHistoryPanel() {
  const {
    dateRange,
    dailyData,
    travellers,
    coTravellerIncomes,
    ratePerTrip,
    updateTravellerParticipation,
    deleteTravellerParticipation,
    updateCoTravellerIncome,
    removeCoTravellerIncome,
  } = useLedgerState();

  const [editTravellerDialog, setEditTravellerDialog] = useState<{
    open: boolean;
    travellerName: string;
    travellerId: string;
    date: string;
    morning: boolean;
    evening: boolean;
  } | null>(null);

  const [editIncomeDialog, setEditIncomeDialog] = useState<{
    open: boolean;
    incomeId: string;
    amount: number;
    date: string;
    note?: string;
  } | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'traveller' | 'coTraveller';
    travellerName: string;
    date: string;
    onConfirm: () => void;
  } | null>(null);

  const tripHistory = useMemo(() => {
    const rows: TripHistoryRow[] = [];
    const datesInRange = getDaysInRange(dateRange.start, dateRange.end);

    // Process regular traveller trips
    datesInRange.forEach((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayData = dailyData[dateKey];

      if (dayData) {
        travellers.forEach((traveller) => {
          const tripData = dayData[traveller.id];
          if (tripData && (tripData.morning || tripData.evening)) {
            const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
            const amount = tripCount * ratePerTrip;
            rows.push({
              travellerName: traveller.name,
              travellerId: traveller.id,
              date: dateKey,
              tripCount,
              amount,
              type: 'traveller',
              morning: tripData.morning,
              evening: tripData.evening,
            });
          }
        });
      }
    });

    // Process co-traveller income entries
    coTravellerIncomes.forEach((income) => {
      try {
        const incomeDate = parseISO(income.date);
        if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
          rows.push({
            travellerName: 'Other Co-Traveller',
            date: income.date,
            tripCount: 1,
            amount: income.amount,
            type: 'coTraveller',
            incomeId: income.id,
            note: income.note,
          });
        }
      } catch {
        // Skip invalid dates
      }
    });

    // Sort by date descending, then by name
    rows.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.travellerName.localeCompare(b.travellerName);
    });

    return rows;
  }, [dateRange, dailyData, travellers, coTravellerIncomes, ratePerTrip]);

  const totals = useMemo(() => {
    const totalTrips = tripHistory.reduce((sum, row) => sum + row.tripCount, 0);
    const totalAmount = tripHistory.reduce((sum, row) => sum + row.amount, 0);
    return { totalTrips, totalAmount };
  }, [tripHistory]);

  const handleEditTraveller = (row: TripHistoryRow) => {
    if (row.type === 'traveller' && row.travellerId) {
      setEditTravellerDialog({
        open: true,
        travellerName: row.travellerName,
        travellerId: row.travellerId,
        date: row.date,
        morning: row.morning || false,
        evening: row.evening || false,
      });
    }
  };

  const handleSaveTravellerEdit = (travellerId: string, date: string, morning: boolean, evening: boolean) => {
    updateTravellerParticipation(travellerId, date, morning, evening);
    toast.success('Trip updated successfully');
  };

  const handleDeleteTraveller = (row: TripHistoryRow) => {
    if (row.type === 'traveller' && row.travellerId) {
      setDeleteDialog({
        open: true,
        type: 'traveller',
        travellerName: row.travellerName,
        date: format(parseISO(row.date), 'MMM dd, yyyy'),
        onConfirm: () => {
          deleteTravellerParticipation(row.travellerId!, row.date);
          toast.success('Trip deleted successfully');
        },
      });
    }
  };

  const handleEditIncome = (row: TripHistoryRow) => {
    if (row.type === 'coTraveller' && row.incomeId) {
      setEditIncomeDialog({
        open: true,
        incomeId: row.incomeId,
        amount: row.amount,
        date: row.date,
        note: row.note,
      });
    }
  };

  const handleSaveIncomeEdit = (incomeId: string, amount: number, date: string, note?: string) => {
    updateCoTravellerIncome(incomeId, amount, date, note);
    toast.success('Co-traveller income updated successfully');
  };

  const handleDeleteIncome = (row: TripHistoryRow) => {
    if (row.type === 'coTraveller' && row.incomeId) {
      setDeleteDialog({
        open: true,
        type: 'coTraveller',
        travellerName: row.travellerName,
        date: format(parseISO(row.date), 'MMM dd, yyyy'),
        onConfirm: () => {
          removeCoTravellerIncome(row.incomeId!);
          toast.success('Co-traveller income deleted successfully');
        },
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trip History
          </CardTitle>
          <CardDescription>
            View and manage trip entries by traveller and date for the selected range
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tripHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trips recorded in the selected date range</p>
            </div>
          ) : (
            <ResponsiveTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Traveller Name</TableHead>
                    <TableHead>Trip Date</TableHead>
                    <TableHead className="text-right">Trip Count</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tripHistory.map((row, index) => (
                    <TableRow key={`${row.date}-${row.travellerName}-${index}`}>
                      <TableCell className="font-medium">
                        {row.travellerName}
                        {row.type === 'coTraveller' && (
                          <span className="ml-2 text-xs text-muted-foreground">(Income)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(row.date), 'MMM dd, yyyy (EEE)')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.tripCount}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${row.type === 'traveller' ? getChargeClassName() : getPaymentClassName()}`}>
                        {formatCurrency(row.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => row.type === 'traveller' ? handleEditTraveller(row) : handleEditIncome(row)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => row.type === 'traveller' ? handleDeleteTraveller(row) : handleDeleteIncome(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {totals.totalTrips}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(totals.totalAmount)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </ResponsiveTableShell>
          )}
        </CardContent>
      </Card>

      {editTravellerDialog && (
        <EditTripHistoryTravellerDialog
          open={editTravellerDialog.open}
          onOpenChange={(open) => !open && setEditTravellerDialog(null)}
          travellerName={editTravellerDialog.travellerName}
          travellerId={editTravellerDialog.travellerId}
          date={editTravellerDialog.date}
          currentMorning={editTravellerDialog.morning}
          currentEvening={editTravellerDialog.evening}
          onSave={handleSaveTravellerEdit}
        />
      )}

      {editIncomeDialog && (
        <EditCoTravellerIncomeDialog
          open={editIncomeDialog.open}
          onOpenChange={(open) => !open && setEditIncomeDialog(null)}
          incomeId={editIncomeDialog.incomeId}
          currentAmount={editIncomeDialog.amount}
          currentDate={editIncomeDialog.date}
          currentNote={editIncomeDialog.note}
          onSave={handleSaveIncomeEdit}
        />
      )}

      {deleteDialog && (
        <DeleteTripHistoryRowAlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => !open && setDeleteDialog(null)}
          rowType={deleteDialog.type}
          travellerName={deleteDialog.travellerName}
          date={deleteDialog.date}
          onConfirmDelete={deleteDialog.onConfirm}
        />
      )}
    </>
  );
}
