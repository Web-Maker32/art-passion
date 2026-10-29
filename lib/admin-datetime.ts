const TIME_ZONE = "Asia/Karachi";
// Pakistan Standard Time is a fixed UTC+05:00 offset (no daylight saving).
const KARACHI_OFFSET = "+05:00";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatKarachiDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

export function formatKarachiDate(date: Date): string {
  return dateFormatter.format(date);
}

/** The Karachi calendar date (YYYY-MM-DD) for a given instant. */
export function karachiCalendarDate(now: Date = new Date()): string {
  return isoDateFormatter.format(now);
}

/** UTC instant marking the start of the current Karachi calendar day. */
export function getKarachiDayStart(now: Date = new Date()): Date {
  return new Date(`${karachiCalendarDate(now)}T00:00:00.000${KARACHI_OFFSET}`);
}

/** UTC instant marking the start of the current Karachi calendar month. */
export function getKarachiMonthStart(now: Date = new Date()): Date {
  const [year, month] = karachiCalendarDate(now).split("-");
  return new Date(`${year}-${month}-01T00:00:00.000${KARACHI_OFFSET}`);
}
