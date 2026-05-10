/**
 * Days of the week used for scheduling and working hours
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/**
 * Type representing a day of the week as a string (e.g., 'monday', 'tuesday')
 */
export type DayOfWeekString = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

/**
 * Converts a DayOfWeek enum value to its string representation
 */
export function dayOfWeekToString(day: DayOfWeek): DayOfWeekString {
  return DayOfWeek[day].toLowerCase() as DayOfWeekString;
}

/**
 * Converts a string day to DayOfWeek enum value
 */
export function stringToDayOfWeek(day: string): DayOfWeek {
  const normalizedDay = day.toUpperCase();
  return DayOfWeek[normalizedDay as keyof typeof DayOfWeek];
}

/**
 * Gets an array of all days of the week in order
 */
export function getAllDaysOfWeek(): DayOfWeek[] {
  return [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];
}

/**
 * Gets an array of weekdays (Monday-Friday)
 */
export function getWeekdays(): DayOfWeek[] {
  return [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
}

/**
 * Gets an array of weekend days (Saturday-Sunday)
 */
export function getWeekendDays(): DayOfWeek[] {
  return [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];
}

/**
 * Gets the name of the day in a readable format
 */
export function getDayName(day: DayOfWeek): string {
  return DayOfWeek[day].charAt(0) + DayOfWeek[day].slice(1).toLowerCase();
}

/**
 * Gets the short name of the day (e.g., 'Mon', 'Tue')
 */
export function getShortDayName(day: DayOfWeek): string {
  return DayOfWeek[day].substring(0, 3);
}

/**
 * Gets the next occurrence of a specific day of the week
 * @param day The day of the week to find
 * @param fromDate The date to start from (defaults to now)
 * @returns The next occurrence of the specified day
 */
export function getNextDay(day: DayOfWeek, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);
  const currentDay = fromDate.getDay();
  const distance = (day - currentDay + 7) % 7;
  result.setDate(result.getDate() + distance);
  return result;
}

/**
 * Checks if two dates are on the same day of the week
 */
export function isSameDayOfWeek(date1: Date, date2: Date): boolean {
  return date1.getDay() === date2.getDay();
}
