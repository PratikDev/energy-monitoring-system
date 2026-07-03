export const DHAKA_UTC_OFFSET_MS = 6 * 60 * 60 * 1000;

export function getDhakaHour(timestamp: number): number {
  return new Date(timestamp + DHAKA_UTC_OFFSET_MS).getUTCHours();
}

export function getDhakaStartOfDayUtcMs(timestamp: number): number {
  const shifted = new Date(timestamp + DHAKA_UTC_OFFSET_MS);

  return (
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ) - DHAKA_UTC_OFFSET_MS
  );
}

export function isAfterOfficeHours(timestamp: number): boolean {
  const hour = getDhakaHour(timestamp);
  return hour < 9 || hour >= 17;
}
