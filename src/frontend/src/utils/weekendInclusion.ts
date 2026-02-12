export function isWeekendDay(date: Date): { isSaturday: boolean; isSunday: boolean } {
  const day = date.getDay();
  return {
    isSaturday: day === 6,
    isSunday: day === 0,
  };
}

export function isDateIncluded(
  date: Date,
  includeSaturday: boolean,
  includeSunday: boolean
): boolean {
  const { isSaturday, isSunday } = isWeekendDay(date);
  
  if (isSaturday && !includeSaturday) return false;
  if (isSunday && !includeSunday) return false;
  
  return true;
}

export function isDateEditable(
  date: Date,
  includeSaturday: boolean,
  includeSunday: boolean
): boolean {
  return isDateIncluded(date, includeSaturday, includeSunday);
}
