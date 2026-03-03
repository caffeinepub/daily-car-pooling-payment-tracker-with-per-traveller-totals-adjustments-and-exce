import { useState } from 'react';
import { useLedgerState } from './LedgerStateContext';
import { getDaysInRange, formatDateKey, formatDisplayDate } from '../../utils/dateRange';
import { isDateEditable, isWeekendDay } from '../../utils/weekendInclusion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import ResponsiveTableShell from '../../components/ResponsiveTableShell';
import EmptyState from '../../components/EmptyState';
import { Calendar, Save, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/money';
import { toast } from 'sonner';

interface DailyParticipationGridProps {
  dateRange: { start: Date; end: Date };
  onSaveAndNext?: () => void;
}

export default function DailyParticipationGrid({ dateRange, onSaveAndNext }: DailyParticipationGridProps) {
  const { 
    travellers, 
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

  // Local state for participation edit toggle
  const [allowParticipationEdit, setAllowParticipationEdit] = useState(false);

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
    if (!isTodayEditable) return;
    
    if (allTravellersMarkedForToday) {
      // Uncheck all
      setDraftTripsForAllTravellers(todayDateKey, false, false);
    } else {
      // Check all
      setDraftTripsForAllTravellers(todayDateKey, true, true);
    }
  };

  // Per-date bulk checkbox handler
  const handlePerDateBulkToggle = (dateKey: string) => {
    // Check if all travellers have both AM and PM for this date
    const allMarked = travellers.length > 0 && travellers.every((t) => {
      const tripData = draftDailyData[dateKey]?.[t.id];
      return tripData?.morning && tripData?.evening;
    });

    if (allMarked) {
      // Uncheck all
      setDraftTripsForAllTravellers(dateKey, false, false);
    } else {
      // Check all
      setDraftTripsForAllTravellers(dateKey, true, true);
    }
  };

  const handleSave = () => {
    saveDraftDailyData();
    toast.success('Daily participation saved successfully');
  };

  const handleSaveAndNext = () => {
    saveDraftDailyData();
    toast.success('Daily participation saved successfully');
    onSaveAndNext?.();
  };

  if (travellers.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No Travellers Added"
        description="Add travellers first to start tracking daily participation."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Daily Participation</CardTitle>
            <CardDescription>Track morning and evening trips for each traveller</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSave} disabled={!hasUnsavedChanges} className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button onClick={handleSaveAndNext} disabled={!hasUnsavedChanges} variant="default" className="gap-2">
              Save & Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-saturday"
                checked={includeSaturday}
                onCheckedChange={(checked) => setIncludeSaturday(!!checked)}
              />
              <Label htmlFor="include-saturday" className="cursor-pointer">
                Include Saturday
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-sunday"
                checked={includeSunday}
                onCheckedChange={(checked) => setIncludeSunday(!!checked)}
              />
              <Label htmlFor="include-sunday" className="cursor-pointer">
                Include Sunday
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="allow-edit"
              checked={allowParticipationEdit}
              onCheckedChange={setAllowParticipationEdit}
            />
            <Label htmlFor="allow-edit" className="cursor-pointer">
              Allow Participation Edit
            </Label>
          </div>
        </div>

        {/* Mark all travellers for today checkbox */}
        {isTodayEditable && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Checkbox
              id="mark-all-today"
              checked={allTravellersMarkedForToday}
              onCheckedChange={handleBulkToggle}
            />
            <Label htmlFor="mark-all-today" className="cursor-pointer font-medium">
              Mark all travellers for today (AM & PM)
            </Label>
          </div>
        )}

        {/* Grid */}
        <ResponsiveTableShell>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-semibold sticky left-0 bg-muted/50 z-10">Traveller</th>
                {days.map((day) => {
                  const dateKey = formatDateKey(day);
                  const isWeekend = isWeekendDay(day);
                  const editable = isDateEditable(day, includeSaturday, includeSunday);
                  
                  // Check if all travellers have both AM and PM for this date
                  const allMarked = travellers.length > 0 && travellers.every((t) => {
                    const tripData = draftDailyData[dateKey]?.[t.id];
                    return tripData?.morning && tripData?.evening;
                  });

                  return (
                    <th
                      key={dateKey}
                      className={`p-3 text-center font-semibold min-w-[120px] ${
                        isWeekend ? 'bg-muted/30' : ''
                      } ${!editable ? 'opacity-50' : ''}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-sm">{formatDisplayDate(day)}</div>
                        {editable && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Checkbox
                              checked={allMarked}
                              onCheckedChange={() => handlePerDateBulkToggle(dateKey)}
                              className="h-3 w-3"
                            />
                            <span className="text-xs text-muted-foreground">All</span>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {travellers.map((traveller) => (
                <tr key={traveller.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium sticky left-0 bg-background z-10">{traveller.name}</td>
                  {days.map((day) => {
                    const dateKey = formatDateKey(day);
                    const tripData = draftDailyData[dateKey]?.[traveller.id] || { morning: false, evening: false };
                    const isWeekend = isWeekendDay(day);
                    const editable = isDateEditable(day, includeSaturday, includeSunday);
                    const canEdit = editable && allowParticipationEdit;

                    const tripCount = (tripData.morning ? 1 : 0) + (tripData.evening ? 1 : 0);
                    const amount = tripCount * ratePerTrip;

                    return (
                      <td
                        key={dateKey}
                        className={`p-3 text-center ${isWeekend ? 'bg-muted/30' : ''} ${
                          !editable ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1">
                              <Checkbox
                                id={`${traveller.id}-${dateKey}-morning`}
                                checked={tripData.morning}
                                onCheckedChange={() => toggleDraftTrip(dateKey, traveller.id, 'morning')}
                                disabled={!canEdit}
                              />
                              <Label
                                htmlFor={`${traveller.id}-${dateKey}-morning`}
                                className="text-xs cursor-pointer"
                              >
                                AM
                              </Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <Checkbox
                                id={`${traveller.id}-${dateKey}-evening`}
                                checked={tripData.evening}
                                onCheckedChange={() => toggleDraftTrip(dateKey, traveller.id, 'evening')}
                                disabled={!canEdit}
                              />
                              <Label
                                htmlFor={`${traveller.id}-${dateKey}-evening`}
                                className="text-xs cursor-pointer"
                              >
                                PM
                              </Label>
                            </div>
                          </div>
                          {tripCount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {tripCount} × {formatCurrency(ratePerTrip)} = {formatCurrency(amount)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableShell>
      </CardContent>
    </Card>
  );
}
