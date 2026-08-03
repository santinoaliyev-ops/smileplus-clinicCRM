import type { DoctorAppointment } from "@/shared/api/appointments/appointments.service";

export function getAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function endTime(iso: string, durationMin: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + durationMin);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export interface DeskState {
  current: DoctorAppointment | null;   // in_progress
  next: DoctorAppointment | null;      // ближайший pending/confirmed
  queue: DoctorAppointment[];          // остальные после next
}

export function splitDay(appointments: DoctorAppointment[]): DeskState {
  const current =
    appointments.find((a) => a.status === "in_progress") ?? null;

  const upcoming = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );

  return {
    current,
    next: upcoming[0] ?? null,
    queue: upcoming.slice(1),
  };
}

export type TimerTone = "blue" | "yellow" | "red";

export interface NextTimer {
  tone: TimerTone;
  /** минуты: до начала (blue) или задержки (yellow/red) */
  minutes: number;
  /** пациент пришёл и ждёт N минут (null — не пришёл) */
  waitingMinutes: number | null;
  /** прогресс последнего часа ожидания, 0..1 (для шкалы) */
  progress: number | null;
}

export function getNextTimer(
  appointment: DoctorAppointment,
  now: Date
): NextTimer {
  const scheduled = new Date(appointment.scheduledAt).getTime();
  const diffMin = Math.round((scheduled - now.getTime()) / 60_000);

  const waitingMinutes = appointment.arrivedAt
    ? Math.max(
        0,
        Math.round((now.getTime() - new Date(appointment.arrivedAt).getTime()) / 60_000)
      )
    : null;

  if (diffMin >= 0) {
    return {
      tone: "blue",
      minutes: diffMin,
      waitingMinutes,
      progress: diffMin <= 60 ? 1 - diffMin / 60 : null,
    };
  }

  // время прошло
  return {
    tone: waitingMinutes !== null ? "red" : "yellow",
    minutes: -diffMin,
    waitingMinutes,
    progress: null,
  };
}