import type { DayLoadColor } from "./schedule-constants";

/**
 * ЗАГЛУШКА. Реальная логика (см. ТЗ "Синхронизируем на нашу шкалу"):
 * - тянет doctor_schedule по day_of_week для total_slots
 * - тянет appointments дня (по Баку UTC+4, status != cancelled) для filled_slots
 * - проверяет "все приёмы — follow_up/consultation/checkup" — до процентных порогов (синий)
 * - пороги: 0 или <20% — зелёный, 20–80% — жёлтый, >80% — красный
 * - нет записи в doctor_schedule / is_active=false — серый
 *
 * TODO: заменить на реальный хук useDoctorMonthLoad(doctorId, year, month) после
 * добавления сервиса doctor-schedule.service.ts (таблица doctor_schedule уже есть на бэке).
 */
export function getDayLoadColorStub(dateKey: string, hasAppointments: boolean): DayLoadColor {
  const day = new Date(dateKey).getDay();
  if (day === 0) return "gray"; // воскресенье — заглушка "выходной"
  if (!hasAppointments) return "green";

  // детерминированная псевдо-загрузка по дате, чтобы UI выглядел живо до подключения реальных данных
  const seed = new Date(dateKey).getDate() % 10;
  if (seed < 3) return "green";
  if (seed < 7) return "yellow";
  return "red";
}
