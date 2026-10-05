// Event times are entered and shown in one fixed time zone. Without this the
// server (which runs in UTC) would treat "6:00 PM" as 6 PM UTC — 2 PM in New
// York — and calendar links would land at the wrong time.
export const EVENT_TIME_ZONE = "America/New_York";
export const EVENT_TIME_ZONE_LABEL = "ET";

// Offset (ms) of `timeZone` from UTC at the given instant.
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - instant.getTime();
}

// "2026-10-09T18:00" (a datetime-local value, meant as Eastern Time) -> ISO UTC.
export function eventLocalToIso(local: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle the offset changing across a DST boundary.
  let instant = naiveUtc - zoneOffsetMs(new Date(naiveUtc), EVENT_TIME_ZONE);
  instant = naiveUtc - zoneOffsetMs(new Date(instant), EVENT_TIME_ZONE);
  return new Date(instant).toISOString();
}

// ISO UTC -> "2026-10-09T18:00" in Eastern Time, for prefilling datetime-local inputs.
export function isoToEventLocal(iso: string | null): string {
  if (!iso) return "";
  const instant = new Date(iso);
  const shifted = new Date(instant.getTime() + zoneOffsetMs(instant, EVENT_TIME_ZONE));
  return shifted.toISOString().slice(0, 16);
}

const dateFmt = new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIME_ZONE, dateStyle: "full" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIME_ZONE, timeStyle: "short" });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIME_ZONE });

// "Thursday, October 9, 2026, 6:00 – 8:00 PM ET" (or with both dates when
// the event runs past midnight). "TBD" when no start is set.
export function formatEventRange(startIso: string | null, endIso: string | null): string {
  if (!startIso) return "TBD";
  const start = new Date(startIso);
  const startLabel = `${dateFmt.format(start)}, ${timeFmt.format(start)}`;
  if (!endIso) return `${startLabel} ${EVENT_TIME_ZONE_LABEL}`;
  const end = new Date(endIso);
  if (dayKey.format(start) === dayKey.format(end)) {
    return `${startLabel} – ${timeFmt.format(end)} ${EVENT_TIME_ZONE_LABEL}`;
  }
  return `${startLabel} – ${dateFmt.format(end)}, ${timeFmt.format(end)} ${EVENT_TIME_ZONE_LABEL}`;
}
