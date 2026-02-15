import { useLedgerState } from './LedgerStateContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function DateRangePicker() {
  const { dateRange, setDateRange } = useLedgerState();

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <span className="text-sm font-medium whitespace-nowrap">Date Range:</span>
      <div className="flex flex-wrap gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal min-w-[140px]">
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{format(dateRange.start, 'MMM dd, yyyy')}</span>
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

        <span className="text-sm text-muted-foreground">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start text-left font-normal min-w-[140px]">
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{format(dateRange.end, 'MMM dd, yyyy')}</span>
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
