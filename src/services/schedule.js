import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { SALON } from "../data/salon";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function getAvailableHours(date, service, reservations = []) {
  if (!date || !service) return [];

  const dayKey = DAY_KEYS[dayjs(date).day()];
  const schedule = SALON.operationSchedule[dayKey];
  if (!schedule) return [];

  const start = dayjs(`${date} ${schedule.open}`, "YYYY-MM-DD HH:mm");
  const end = dayjs(`${date} ${schedule.close}`, "YYYY-MM-DD HH:mm");
  const duration = service.duration;
  const hours = [];
  let current = start;

  while (current.add(duration, "hour").isSameOrBefore(end)) {
    const slot = current.format("HH:mm");
    const conflict = reservations.some((r) => {
      const rHour = r.hour || r.time;
      if (!rHour || !r.date) return false;
      const rStart = dayjs(`${r.date} ${rHour}`, "YYYY-MM-DD HH:mm");
      const rEnd = rStart.add(r.duration || 1, "hour");
      const cEnd = current.add(duration, "hour");
      return current.isBefore(rEnd) && cEnd.isAfter(rStart);
    });

    if (!conflict) hours.push(slot);
    current = current.add(30, "minute");
  }

  return hours;
}

export function minBookingDate() {
  return dayjs().format("YYYY-MM-DD");
}
