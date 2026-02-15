import { useMemo } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getDaysInRange } from '../../utils/dateRange';
import ResponsiveTableShell from '../../components/ResponsiveTableShell';

interface TripHistoryRow {
  travellerName: string;
  date: string;
  tripCount: number;
  type: 'traveller' | 'coTraveller';
}

export default function TripHistoryPanel() {
  const { dateRange, dailyData, travellers, coTravellerIncomes } = useLedgerState();

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
            rows.push({
              travellerName: traveller.name,
              date: dateKey,
              tripCount,
              type: 'traveller',
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
            type: 'coTraveller',
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
  }, [dateRange, dailyData, travellers, coTravellerIncomes]);

  const totalTrips = useMemo(() => {
    return tripHistory.reduce((sum, row) => sum + row.tripCount, 0);
  }, [tripHistory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Trip History
        </CardTitle>
        <CardDescription>
          View trip counts by traveller and date for the selected range
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
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold">
                    Total Trips
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {totalTrips}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </ResponsiveTableShell>
        )}
      </CardContent>
    </Card>
  );
}
