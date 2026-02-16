/**
 * Utility functions for calculating signature schedule requirements
 * Based on assignment duration and German labor law requirements
 */

/**
 * Calculates required signature dates for an assignment
 * Rules:
 * - For assignments up to 7 days: Signature required by day 7 or on Sunday within that period
 * - For longer assignments: Signature every Sunday + at the end
 */
export function calculateSignatureSchedule(
  startDate: Date,
  endDate: Date
): {
  requiredDates: Date[];
  nextRequiredDate: Date | null;
} {
  const requiredDates: Date[] = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Calculate days difference
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (daysDiff <= 7) {
    // For assignments up to 7 days: Signature by day 7 or on Sunday
    const day7 = new Date(start);
    day7.setDate(start.getDate() + 6); // Day 7 (0-indexed, so +6)

    // Find Sunday within the period
    const sundayInPeriod = findNextSunday(start, end);

    if (sundayInPeriod && sundayInPeriod <= day7) {
      requiredDates.push(sundayInPeriod);
    } else {
      requiredDates.push(day7);
    }
  } else {
    // For longer assignments: Every Sunday + end date
    let currentDate = new Date(start);
    
    // Find first Sunday
    const firstSunday = findNextSunday(start, end);
    if (firstSunday) {
      currentDate = new Date(firstSunday);
      
      // Add all Sundays in the period
      while (currentDate <= end) {
        requiredDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7); // Next Sunday
      }
    }

    // Always add end date
    requiredDates.push(new Date(end));
  }

  // Sort dates
  requiredDates.sort((a, b) => a.getTime() - b.getTime());

  // Find next required date (first date that hasn't been collected)
  const nextRequiredDate = requiredDates.length > 0 ? requiredDates[0] : null;

  return {
    requiredDates,
    nextRequiredDate,
  };
}

/**
 * Finds the next Sunday on or after the given date, within the end date
 */
function findNextSunday(startDate: Date, endDate: Date): Date | null {
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Find next Sunday
  const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  current.setDate(current.getDate() + daysUntilSunday);

  if (current <= end) {
    return current;
  }

  return null;
}

/**
 * Checks if a signature is required today for an assignment
 */
export function isSignatureRequiredToday(
  assignmentStartDate: Date,
  assignmentEndDate: Date,
  collectedDates: string[]
): boolean {
  const { requiredDates } = calculateSignatureSchedule(assignmentStartDate, assignmentEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today is a required date
  const todayStr = today.toISOString().split('T')[0];
  const isRequiredDate = requiredDates.some(date => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === todayStr;
  });

  // Check if already collected
  const alreadyCollected = collectedDates.includes(todayStr);

  return isRequiredDate && !alreadyCollected;
}

/**
 * Gets the next required signature date for an assignment
 */
export function getNextRequiredSignatureDate(
  assignmentStartDate: Date,
  assignmentEndDate: Date,
  collectedDates: string[]
): Date | null {
  const { requiredDates } = calculateSignatureSchedule(assignmentStartDate, assignmentEndDate);
  
  // Find first date that hasn't been collected
  for (const date of requiredDates) {
    const dateStr = date.toISOString().split('T')[0];
    if (!collectedDates.includes(dateStr)) {
      return date;
    }
  }

  return null;
}

