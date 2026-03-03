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

/**
 * Determines if a date should be included in calculations.
 * A weekend date is included if:
 * 1. The relevant weekend checkbox is enabled, OR
 * 2. The date has saved trip data in dailyData
 */
export function isDateIncludedForCalculation(
  date: Date,
  includeSaturday: boolean,
  includeSunday: boolean,
  dateKey: string,
  dailyData: Record<string, any>
): boolean {
  const { isSaturday, isSunday } = isWeekendDay(date);
  
  // Weekdays are always included
  if (!isSaturday && !isSunday) return true;
  
  // Weekend: check if enabled OR has saved data
  if (isSaturday) {
    return includeSaturday || hasSavedTripData(dateKey, dailyData);
  }
  
  if (isSunday) {
    return includeSunday || hasSavedTripData(dateKey, dailyData);
  }
  
  return true;
}

/**
 * Helper to check if a date has any saved trip selections
 */
function hasSavedTripData(dateKey: string, dailyData: Record<string, any>): boolean {
  const dayData = dailyData[dateKey];
  if (!dayData) return false;
  
  // Check if any traveller has trip data for this date
  return Object.keys(dayData).some((travellerId) => {
    const tripData = dayData[travellerId];
    return tripData && (tripData.morning || tripData.evening);
  });
}
