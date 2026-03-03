import { useLedgerState } from './LedgerStateContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DateRangePickerProps {
  // Optional controlled mode props
  value?: { start: Date; end: Date };
  onChange?: (range: { start: Date; end: Date }) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { dateRange: contextDateRange, setDateRange: contextSetDateRange } = useLedgerState();

  // Use controlled props if provided, otherwise fall back to context
  const dateRange = value || contextDateRange;
  const setDateRange = onChange || contextSetDateRange;

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <span className="text-sm font-medium">Date Range:</span>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.start, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.start}
              onSelect={(date) => date && setDateRange({ ...dateRange, start: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-sm text-muted-foreground self-center">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.end, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.end}
              onSelect={(date) => date && setDateRange({ ...dateRange, end: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
