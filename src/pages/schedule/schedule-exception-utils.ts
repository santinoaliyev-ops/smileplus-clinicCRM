import type { ScheduleException } from "@/shared/api/schedule/schedule-exceptions.service";

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toMinutes(hms: string): number {
  const [h, m] = hms.split(":").map(Number);
  return h * 60 + m;
}

export interface TimeRange {
  startMin: number;
  endMin: number;
}

/** Исключения врача (отпуск/больничный/т.д.), затрагивающие указанную дату. */
export function getDayExceptions(exceptions: ScheduleException[], dateKey: string): ScheduleException[] {
  return exceptions.filter((ex) => dateKey >= ex.dateFrom && dateKey <= ex.dateTo);
}

/** Первое исключение, блокирующее указанную дату (и опционально пересекающееся с диапазоном времени). */
export function findBlockingException(
  exceptions: ScheduleException[],
  dateKey: string,
  time?: TimeRange
): ScheduleException | null {
  for (const ex of getDayExceptions(exceptions, dateKey)) {
    if (!ex.timeFrom || !ex.timeTo) return ex; // блок на весь день
    if (!time) return ex;
    const exStart = toMinutes(ex.timeFrom);
    const exEnd = toMinutes(ex.timeTo);
    if (time.startMin < exEnd && time.endMin > exStart) return ex;
  }
  return null;
}
