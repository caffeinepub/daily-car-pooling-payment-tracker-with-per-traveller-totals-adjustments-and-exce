import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey, formatDisplayDate } from '../../utils/dateRange';
import { isDateEditable, isWeekendDay } from '../../utils/weekendInclusion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ResponsiveTableShell from '../../components/ResponsiveTableShell';
import EmptyState from '../../components/EmptyState';
import { Calendar, Save, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/money';

interface DailyParticipationGridProps {
  onSaveAndNext?: () => void;
}

export default function DailyParticipationGrid({ onSaveAndNext }: DailyParticipationGridProps) {
  const { 
    travellers, 
    dateRange, 
    draftDailyData, 
    toggleDraftTrip, 
    ratePerTrip, 
    setDraftTripsForAllTravellers,
    saveDraftDailyData,
    hasDraftChanges,
    includeSaturday,
    setIncludeSaturday,
    includeSunday,
    setIncludeSunday,
  } = useLedgerState();

  const days = getDaysInRange(dateRange.start, dateRange.end);

  // Get today's date key
  const todayDateKey = formatDateKey(new Date());
  const today = new Date();
  const isTodayEditable = isDateEditable(today, includeSaturday, includeSunday);

  // Check if all travellers have both AM and PM selected for today
  const allTravellersMarkedForToday = travellers.length > 0 && travellers.every((t) => {
    const tripData = draftDailyData[todayDateKey]?.[t.id];
    return tripData?.morning && tripData?.evening;
  });

  const hasUnsavedChanges = hasDraftChanges();

  const handleBulkToggle = () => {
    if (allTravellersMarkedForToday) {
      // Uncheck all
      setDraftTripsForAllTravellers(todayDateKey, false, false);
    } else {
      // Check all
      setDraftTripsForAllTravellers(todayDateKey, true, true);
    }
  };

  const handleSave = () => {
    saveDraftDailyData();
  };

  const handleSaveAndNext = () => {
    saveDraftDailyData();
    if (onSaveAndNext) {
      onSaveAndNext();
    }
  };

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
      <CardContent className="space-y-4">
        {/* Weekend Inclusion Controls */}
        <div className="flex flex-col sm:flex-row gap-3 p-3 bg-accent/30 rounded-lg border">
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-saturday"
              checked={includeSaturday}
              onCheckedChange={(checked) => setIncludeSaturday(checked === true)}
            />
            <Label
              htmlFor="include-saturday"
              className="text-sm font-medium cursor-pointer"
            >
              Include Saturday
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-sunday"
              checked={includeSunday}
              onCheckedChange={(checked) => setIncludeSunday(checked === true)}
            />
            <Label
              htmlFor="include-sunday"
              className="text-sm font-medium cursor-pointer"
            >
              Include Sunday
            </Label>
          </div>
        </div>

        {/* Bulk checkbox for today */}
        <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg border">
          <Checkbox
            id="bulk-today"
            checked={allTravellersMarkedForToday}
            onCheckedChange={handleBulkToggle}
            disabled={!isTodayEditable}
          />
          <Label
            htmlFor="bulk-today"
            className="text-sm font-medium cursor-pointer"
          >
            Mark all travellers for today (AM + PM)
          </Label>
        </div>

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
                const isEditable = isDateEditable(day, includeSaturday, includeSunday);
                const { isSaturday, isSunday } = isWeekendDay(day);
                const isWeekend = isSaturday || isSunday;

                return (
                  <tr
                    key={dateKey}
                    className={`border-b hover:bg-accent/30 transition-colors ${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    } ${!isEditable ? 'opacity-50' : ''}`}
                  >
                    <td className="p-3 text-sm font-medium sticky left-0 bg-inherit z-10">
                      {formatDisplayDate(day)}
                    </td>
                    {travellers.map((t) => {
                      const tripData = draftDailyData[dateKey]?.[t.id] || { morning: false, evening: false };
                      return (
                        <td key={t.id} className="p-3">
                          <div className="flex justify-center items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <Checkbox
                                checked={tripData.morning}
                                onCheckedChange={() => toggleDraftTrip(dateKey, t.id, 'morning')}
                                disabled={!isEditable}
                                aria-label={`${t.name} morning trip on ${formatDisplayDate(day)}`}
                              />
                            </div>
                            <div className="text-muted-foreground">/</div>
                            <div className="flex flex-col items-center gap-1">
                              <Checkbox
                                checked={tripData.evening}
                                onCheckedChange={() => toggleDraftTrip(dateKey, t.id, 'evening')}
                                disabled={!isEditable}
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

        {/* Save Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="flex-1 sm:flex-none"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          
          {onSaveAndNext && (
            <Button
              onClick={handleSaveAndNext}
              disabled={!hasUnsavedChanges}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              Save & Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          
          {hasUnsavedChanges && (
            <span className="text-sm text-muted-foreground self-center">
              You have unsaved changes
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
