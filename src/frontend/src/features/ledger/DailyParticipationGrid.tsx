import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey, formatDisplayDate } from '../../utils/dateRange';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import ResponsiveTableShell from '../../components/ResponsiveTableShell';
import EmptyState from '../../components/EmptyState';
import { Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/money';

export default function DailyParticipationGrid() {
  const { travellers, dateRange, dailyData, toggleTrip, ratePerTrip } = useLedgerState();

  const days = getDaysInRange(dateRange.start, dateRange.end);

  if (travellers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Participation</CardTitle>
          <CardDescription>Track who travelled each day</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Calendar}
            title="Add travellers first"
            description="You need to add travellers before tracking daily participation"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Participation</CardTitle>
        <CardDescription>
          Mark Morning and/or Evening trips for each traveller. Each checked AM box counts as 1 trip and each checked PM box counts as 1 trip. Each trip is charged at {formatCurrency(ratePerTrip)} per trip.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveTableShell>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-semibold sticky left-0 bg-muted/50 z-10 min-w-[120px]">
                  Date
                </th>
                {travellers.map((t) => (
                  <th key={t.id} className="p-3 text-center text-sm font-semibold min-w-[120px]">
                    <div>{t.name}</div>
                    <div className="text-xs font-normal text-muted-foreground mt-1">AM / PM</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, idx) => {
                const dateKey = formatDateKey(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <tr
                    key={dateKey}
                    className={`border-b hover:bg-accent/30 transition-colors ${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    } ${isWeekend ? 'opacity-50' : ''}`}
                  >
                    <td className="p-3 text-sm font-medium sticky left-0 bg-inherit z-10">
                      {formatDisplayDate(day)}
                    </td>
                    {travellers.map((t) => {
                      const tripData = dailyData[dateKey]?.[t.id] || { morning: false, evening: false };
                      return (
                        <td key={t.id} className="p-3">
                          <div className="flex justify-center items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <Checkbox
                                checked={tripData.morning}
                                onCheckedChange={() => toggleTrip(dateKey, t.id, 'morning')}
                                disabled={isWeekend}
                                aria-label={`${t.name} morning trip on ${formatDisplayDate(day)}`}
                              />
                            </div>
                            <div className="text-muted-foreground">/</div>
                            <div className="flex flex-col items-center gap-1">
                              <Checkbox
                                checked={tripData.evening}
                                onCheckedChange={() => toggleTrip(dateKey, t.id, 'evening')}
                                disabled={isWeekend}
                                aria-label={`${t.name} evening trip on ${formatDisplayDate(day)}`}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTableShell>
      </CardContent>
    </Card>
  );
}
