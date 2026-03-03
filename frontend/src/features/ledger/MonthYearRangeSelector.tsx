import { useMemo } from 'react';
import { classifyDateRange, getFullMonthRange, getFullYearRange } from '../../utils/dateRange';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

interface MonthYearRangeSelectorProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
}

export default function MonthYearRangeSelector({ value, onChange }: MonthYearRangeSelectorProps) {
  // Generate year options (5 years back to 2 years forward)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  }, [currentYear]);

  // Classify the current date range
  const classification = useMemo(() => {
    return classifyDateRange(value.start, value.end);
  }, [value]);

  // Derive selected month and year from classification
  const selectedMonth = classification.type === 'full-month' ? classification.month : null;
  const selectedYear = classification.year ?? value.start.getFullYear();

  const handleMonthChange = (newValue: string) => {
    if (newValue === 'all') {
      // Set to full year
      const fullYearRange = getFullYearRange(selectedYear);
      onChange(fullYearRange);
    } else if (newValue === 'custom') {
      // Do nothing, keep current custom range
      return;
    } else {
      // Set to specific month
      const month = parseInt(newValue, 10);
      const fullMonthRange = getFullMonthRange(selectedYear, month);
      onChange(fullMonthRange);
    }
  };

  const handleYearChange = (newValue: string) => {
    if (newValue === 'custom') {
      // Do nothing, keep current custom range
      return;
    }

    const year = parseInt(newValue, 10);

    if (classification.type === 'full-month' && classification.month) {
      // Update to the same month in the new year
      const fullMonthRange = getFullMonthRange(year, classification.month);
      onChange(fullMonthRange);
    } else if (classification.type === 'full-year') {
      // Update to full year of the new year
      const fullYearRange = getFullYearRange(year);
      onChange(fullYearRange);
    } else {
      // For custom ranges, set to full year of selected year
      const fullYearRange = getFullYearRange(year);
      onChange(fullYearRange);
    }
  };

  // Determine display values
  const monthDisplayValue = useMemo(() => {
    if (classification.type === 'full-month' && classification.month) {
      return classification.month.toString();
    } else if (classification.type === 'full-year') {
      return 'all';
    } else {
      return 'custom';
    }
  }, [classification]);

  const yearDisplayValue = useMemo(() => {
    // Check if range spans multiple years
    const startYear = value.start.getFullYear();
    const endYear = value.end.getFullYear();
    
    if (startYear !== endYear) {
      return 'custom';
    }
    
    return selectedYear.toString();
  }, [value, selectedYear]);

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <Select value={monthDisplayValue} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {MONTHS.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
          {classification.type === 'custom' && (
            <SelectItem value="custom">Custom</SelectItem>
          )}
        </SelectContent>
      </Select>

      <Select value={yearDisplayValue} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
          {yearDisplayValue === 'custom' && (
            <SelectItem value="custom">Custom</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
