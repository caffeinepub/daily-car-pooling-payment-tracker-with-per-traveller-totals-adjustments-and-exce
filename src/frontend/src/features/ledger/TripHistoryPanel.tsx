import { useState } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey, formatDisplayDate } from '../../utils/dateRange';
import { isDateIncludedForCalculation } from '../../utils/weekendInclusion';
import { formatCurrency } from '../../utils/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '../../components/EmptyState';
import { History, Edit, Trash2 } from 'lucide-react';
import { parseISO } from 'date-fns';
import { toast } from 'sonner';
import EditTripHistoryTravellerDialog from './EditTripHistoryTravellerDialog';
import CoTravellerIncomeDialog from './CoTravellerIncomeDialog';
import DeleteTripHistoryEntryAlertDialog from './DeleteTripHistoryEntryAlertDialog';

interface TripEntry {
  date: string;
  displayDate: string;
  name: string;
  count: number;
  amount: number;
  type: 'traveller' | 'coTraveller';
  travellerId?: string;
  coTravellerIncomeId?: string;
  morning?: boolean;
  evening?: boolean;
}

export default function TripHistoryPanel() {
  const {
    travellers,
    dateRange,
    dailyData,
    ratePerTrip,
    includeSaturday,
    includeSunday,
    coTravellerIncomes,
    updateTravellerTrip,
    removeCoTravellerIncome,
  } = useLedgerState();

  const [editTravellerDialogOpen, setEditTravellerDialogOpen] = useState(false);
  const [editCoTravellerDialogOpen, setEditCoTravellerDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TripEntry | null>(null);

  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Build trip entries
  const tripEntries: TripEntry[] = [];

  // Add traveller trips
  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    const isIncluded = isDateIncludedForCalculation(day, includeSaturday, includeSunday, dateKey, dailyData);
    if (!isIncluded) return;

    travellers.forEach((traveller) => {
      const tripData = dailyData[dateKey]?.[traveller.id];
      if (tripData) {
        const count = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
        if (count > 0) {
          tripEntries.push({
            date: dateKey,
            displayDate: formatDisplayDate(day),
            name: traveller.name,
            count,
            amount: count * ratePerTrip,
            type: 'traveller',
            travellerId: traveller.id,
            morning: tripData.morning,
            evening: tripData.evening,
          });
        }
      }
    });
  });

  // Add co-traveller income entries
  coTravellerIncomes.forEach((income) => {
    try {
      const incomeDate = parseISO(income.date);
      if (incomeDate >= dateRange.start && incomeDate <= dateRange.end) {
        tripEntries.push({
          date: income.date,
          displayDate: formatDisplayDate(incomeDate),
          name: 'Other Co-Traveller',
          count: 1,
          amount: income.amount,
          type: 'coTraveller',
          coTravellerIncomeId: income.id,
        });
      }
    } catch {
      // Skip invalid dates
    }
  });

  // Sort by date
  tripEntries.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate total
  const totalTrips = tripEntries.reduce((sum, entry) => sum + entry.count, 0);
  const totalAmount = tripEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const handleEditTraveller = (entry: TripEntry) => {
    setSelectedEntry(entry);
    setEditTravellerDialogOpen(true);
  };

  const handleEditCoTraveller = (entry: TripEntry) => {
    const income = coTravellerIncomes.find((i) => i.id === entry.coTravellerIncomeId);
    if (income) {
      setSelectedEntry(entry);
      setEditCoTravellerDialogOpen(true);
    }
  };

  const handleDeleteEntry = (entry: TripEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedEntry) return;

    if (selectedEntry.type === 'traveller' && selectedEntry.travellerId) {
      // Clear morning and evening for this traveller on this date
      updateTravellerTrip(selectedEntry.date, selectedEntry.travellerId, false, false);
      toast.success('Trip entry deleted successfully');
    } else if (selectedEntry.type === 'coTraveller' && selectedEntry.coTravellerIncomeId) {
      removeCoTravellerIncome(selectedEntry.coTravellerIncomeId);
      toast.success('Co-traveller income entry deleted successfully');
    }

    setDeleteDialogOpen(false);
    setSelectedEntry(null);
  };

  if (tripEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Trip History
          </CardTitle>
          <CardDescription>View all trips within the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={History}
            title="No trips recorded"
            description="Trip data will appear here once you mark trips in the Daily Participation grid or add Other Co-Traveller income"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Trip History
          </CardTitle>
          <CardDescription>All trips within the selected date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Count</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripEntries.map((entry, idx) => (
                  <TableRow key={`${entry.date}-${entry.name}-${idx}`}>
                    <TableCell className="font-medium">{entry.displayDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.name}
                        {entry.type === 'coTraveller' && (
                          <Badge variant="outline" className="text-xs">
                            Other
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{entry.count}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(entry.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            entry.type === 'traveller' ? handleEditTraveller(entry) : handleEditCoTraveller(entry)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEntry(entry)}
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

          {/* Total Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Trips:</span>
              <Badge variant="default" className="text-base px-3 py-1">
                {totalTrips}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialogs */}
      <EditTripHistoryTravellerDialog
        open={editTravellerDialogOpen}
        onOpenChange={setEditTravellerDialogOpen}
        entry={
          selectedEntry && selectedEntry.type === 'traveller'
            ? {
                dateKey: selectedEntry.date,
                displayDate: selectedEntry.displayDate,
                travellerId: selectedEntry.travellerId!,
                travellerName: selectedEntry.name,
                morning: selectedEntry.morning || false,
                evening: selectedEntry.evening || false,
              }
            : null
        }
      />

      <CoTravellerIncomeDialog
        open={editCoTravellerDialogOpen}
        onOpenChange={setEditCoTravellerDialogOpen}
        mode="edit"
        existingIncome={
          selectedEntry && selectedEntry.type === 'coTraveller' && selectedEntry.coTravellerIncomeId
            ? coTravellerIncomes.find((i) => i.id === selectedEntry.coTravellerIncomeId)
            : undefined
        }
      />

      <DeleteTripHistoryEntryAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entryType={selectedEntry?.type || 'traveller'}
        entryName={selectedEntry?.name || ''}
        entryDate={selectedEntry?.displayDate || ''}
        onConfirmDelete={handleConfirmDelete}
      />
    </>
  );
}
