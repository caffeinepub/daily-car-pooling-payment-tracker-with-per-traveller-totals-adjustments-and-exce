import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface TripsPaymentYearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export default function TripsPaymentYearSelector({ selectedYear, onYearChange }: TripsPaymentYearSelectorProps) {
  const currentYear = new Date().getFullYear();
  // Generate a range of years: 5 years back, current year, and 2 years forward
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value, 10))}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
