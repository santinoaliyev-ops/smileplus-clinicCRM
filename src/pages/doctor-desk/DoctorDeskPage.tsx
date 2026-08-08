import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DoctorDeskLayout } from "./DoctorDeskLayout";
import { useClinic } from "@/app/providers/clinic";
import { useDoctorProfile } from "@/features/doctor-dashboard/hooks/useDoctorProfile";
import {
  useAppointmentActions,
  useDoctorDay,
} from "@/features/doctor-dashboard/hooks/useDoctorDay";
import { useAppointmentsRealtime } from "@/features/doctor-dashboard/hooks/useAppointmentsRealtime";
import { useNow } from "@/shared/hooks/use-now";
import { splitDay } from "@/features/doctor-dashboard/lib/desk-utils";
import { CurrentAppointmentPanel } from "./CurrentAppointmentPanel";
import { AppointmentManagement } from "./AppointmentManagement";
import { NextAppointmentCard } from "./NextAppointmentCard";
import { QueueList } from "./QueueList";
import { DeskMiniCalendar } from "./DeskMiniCalendar";
import { DayAgendaList } from "./DayAgendaList";

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

// toLocaleDateString({weekday:"long"}) не поддерживает az-Latn-AZ в этом окружении
// (возвращает нечитаемое "M08 3, Mon") — используем ручные таблицы, как в SchedulePage.tsx
const WEEKDAYS: Record<string, string[]> = {
  az: ["bazar", "bazar ertəsi", "çərşənbə axşamı", "çərşənbə", "cümə axşamı", "cümə", "şənbə"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
const MONTHS: Record<string, string[]> = {
  az: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export function DoctorDeskPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "az" | "ru" | "en";
  const { clinic } = useClinic();
  const now = useNow();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const { data: doctor, isLoading: doctorLoading } = useDoctorProfile();
  const { data: appointments = [], isLoading } = useDoctorDay(doctor?.id, selectedDate);
  useAppointmentsRealtime(doctor?.id);
  const { setStatus, markArrived } = useAppointmentActions();

  const isToday = isSameDay(selectedDate, now);

  if (doctorLoading || isLoading) {
    return (
      <DoctorDeskLayout>
        <div className="flex h-full items-center justify-center text-gray-400">
          {t("common.loading")}
        </div>
      </DoctorDeskLayout>
    );
  }

  if (!doctor) {
    return (
      <DoctorDeskLayout>
        <div className="flex h-full items-center justify-center text-gray-500">
          Профиль врача не найден в клинике {clinic?.clinicName}
        </div>
      </DoctorDeskLayout>
    );
  }

  const { current, next, queue } = splitDay(appointments);

  return (
    <DoctorDeskLayout>

      <div className="flex h-full gap-4">
        {/* Левая колонка: текущий приём (сегодня) или агенда выбранного дня */}
        <div className="flex flex-1 flex-col gap-4">
          {isToday ? (
            <>
              {/* Заголовок секции */}
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${current ? "bg-teal-500 animate-pulse" : "bg-gray-300"}`} />
                <span className="text-sm font-semibold text-gray-700">
                  {t("doctorDesk.currentAppointment")}
                </span>
              </div>

              {current ? (
                <div className="flex gap-4 flex-1">
                  {/* Инфо о приёме */}
                  <CurrentAppointmentPanel
                    appointment={current}
                    onFinish={() =>
                      setStatus.mutate({ id: current.id, status: "completed" })
                    }
                  />
                  {/* Управление приёмом */}
                  <AppointmentManagement
                    appointment={current}
                    onFinish={() =>
                      setStatus.mutate({ id: current.id, status: "completed" })
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white text-gray-400">
                  <span className="text-4xl mb-3">🦷</span>
                  <p className="text-sm font-medium">
                    {appointments.length === 0
                      ? t("doctorDesk.noAppointmentsToday")
                      : t("doctorDesk.noCurrentAppointments")}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold capitalize text-gray-700">
                  {WEEKDAYS[lang]?.[selectedDate.getDay()] ?? ""}, {selectedDate.getDate()}{" "}
                  {MONTHS[lang]?.[selectedDate.getMonth()] ?? ""}
                </span>
              </div>
              <DayAgendaList appointments={appointments} />
            </>
          )}
        </div>

        {/* Правая колонка: календарь + (сегодня — следующий/очередь) */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <DeskMiniCalendar
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
            }}
            doctorId={doctor.id}
            viewMonth={viewMonth}
            onPrevMonth={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            onNextMonth={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          />

          {isToday && (
            <>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-sm font-semibold text-gray-700">
                  {t("doctorDesk.nextAppointment")}
                </span>
              </div>

              {next ? (
                <NextAppointmentCard
                  appointment={next}
                  now={now}
                  canStart={!current}
                  onStart={() =>
                    setStatus.mutate({ id: next.id, status: "in_progress" })
                  }
                  onArrived={() => markArrived.mutate(next.id)}
                  onNoShow={() =>
                    setStatus.mutate({ id: next.id, status: "no_show" })
                  }
                />
              ) : (
                <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
                  {t("doctorDesk.noAppointmentsToday")}
                </div>
              )}

              <QueueList appointments={queue} />
            </>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}