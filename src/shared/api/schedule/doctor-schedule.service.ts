import { supabase } from "@/shared/lib/supabase";

export interface DoctorScheduleRule {
  doctorId: string;
  dayOfWeek: number; // 0 = воскресенье .. 6 = суббота (JS Date.getDay())
  startTime: string; // "09:00:00"
  endTime: string;
  slotDuration: number; // минут
}

class DoctorScheduleService {
  async getForClinic(clinicId: string): Promise<DoctorScheduleRule[]> {
    const { data, error } = await supabase
      .from("doctor_schedule")
      .select("doctor_id, day_of_week, start_time, end_time, slot_duration")
      .eq("clinic_id", clinicId)
      .eq("is_active", true);

    if (error) throw error;

    return (data ?? []).map((r) => ({
      doctorId: r.doctor_id,
      dayOfWeek: r.day_of_week,
      startTime: r.start_time,
      endTime: r.end_time,
      slotDuration: r.slot_duration,
    }));
  }
}

export const doctorScheduleService = new DoctorScheduleService();

/**
 * Свободные слоты врача на день с учётом уже занятых интервалов.
 * referenceNowMin — минуты "сейчас" (часы*60+минуты), слоты до этого момента
 * отсекаются как прошедшие; передайте null, если день не сегодняшний и
 * отсекать по текущему времени не нужно (иначе слоты "будущего" дня
 * ошибочно резались бы по часам сегодняшнего).
 */
export function computeFreeSlots(
  rule: DoctorScheduleRule | undefined,
  booked: { startMin: number; durationMin: number }[],
  referenceNowMin: number | null
): { hour: number; minute: number }[] {
  if (!rule) return [];

  const [startH, startM] = rule.startTime.split(":").map(Number);
  const [endH, endM] = rule.endTime.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  const step = rule.slotDuration || 30;

  const slots: { hour: number; minute: number }[] = [];

  for (let t = startMin; t + step <= endMin; t += step) {
    if (referenceNowMin !== null && t < referenceNowMin) continue;
    const overlaps = booked.some((b) => t < b.startMin + b.durationMin && t + step > b.startMin);
    if (!overlaps) slots.push({ hour: Math.floor(t / 60), minute: t % 60 });
  }
  return slots;
}
