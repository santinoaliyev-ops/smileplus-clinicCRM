import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  useClinicDay,
  useClinicDoctors,
  useClinicMonth,
  useClinicScheduleRealtime,
} from "@/features/schedule/hooks/useSchedule";
import { useDoctorExceptions } from "@/features/schedule/hooks/useScheduleExceptions";
import { useClinic } from "@/app/providers/clinic";
import { useDoctorProfile } from "@/features/doctor-dashboard/hooks/useDoctorProfile";
import { UserRole } from "@/shared/types/auth";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

import { DoctorSelector } from "./DoctorSelector";
import { DoctorTimeline } from "./DoctorTimeline";
import { MonthLoadCalendar } from "./MonthLoadCalendar";
import { SelectedAppointmentPanel } from "./SelectedAppointmentPanel";
import { CreateAppointmentDialog } from "./CreateAppointmentDialog";
import { DoctorExceptionsDialog } from "./DoctorExceptionsDialog";
import type { ScheduleAppointment, ScheduleDoctor } from "@/shared/api/schedule/schedule.service";

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

const WEEKDAYS: Record<string, string[]> = {
  az: ["bazar","bazar ertəsi","çərşənbə axşamı","çərşənbə","cümə axşamı","cümə","şənbə"],
  ru: ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"],
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
};
const MONTHS: Record<string, string[]> = {
  az: ["yanvar","fevral","mart","aprel","may","iyun","iyul","avqust","sentyabr","oktyabr","noyabr","dekabr"],
  ru: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};

export function SchedulePage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = i18n.language as "az" | "ru" | "en";

  const preselectPatientId =
    (location.state as { preselectPatientId?: string } | null)?.preselectPatientId ?? null;

  const [day, setDay] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScheduleAppointment | null>(null);
  const [createSlot, setCreateSlot] = useState<{ hour: number; minute: number } | null>(null);
  const [exceptionsDoctor, setExceptionsDoctor] = useState<ScheduleDoctor | null>(null);

  const { clinic } = useClinic();
  const { data: doctorProfile } = useDoctorProfile();
  const { data: doctors = [] } = useClinicDoctors();
  const { data: appointments = [], isLoading } = useClinicDay(day);
  useClinicScheduleRealtime();

  const visibleDoctors = useMemo(() => {
    if (clinic?.role === UserRole.Doctor && doctorProfile) {
      return doctors.filter((d) => d.id === doctorProfile.id);
    }
    return doctors;
  }, [doctors, clinic?.role, doctorProfile]);

  // автовыбор врача: свой профиль для роли врача, иначе первый из списка
  const selectedDoctor = useMemo(() => {
    const byId = selectedDoctorId ? visibleDoctors.find((d) => d.id === selectedDoctorId) : undefined;
    return byId ?? visibleDoctors[0] ?? null;
  }, [visibleDoctors, selectedDoctorId]);

  // загрузка календаря считается по выбранному врачу, а не по всей клинике
  const { data: monthDates = [] } = useClinicMonth(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    selectedDoctor?.id
  );
  const { data: doctorExceptions = [] } = useDoctorExceptions(selectedDoctor?.id);

  const dateLabel = `${WEEKDAYS[lang]?.[day.getDay()] ?? ""}, ${day.getDate()} ${MONTHS[lang]?.[day.getMonth()] ?? ""}`;
  const appointmentDays = useMemo(() => new Set(monthDates), [monthDates]);

  const doctorAppointments = useMemo(
    () => appointments.filter((a) => a.doctorId === selectedDoctor?.id),
    [appointments, selectedDoctor]
  );

  const dayStats = useMemo(
    () => ({
      total: doctorAppointments.filter((a) => !["cancelled"].includes(a.status)).length,
      free: 0, // TODO: из doctor_schedule.slot_duration после подключения реальной логики
      premium: 0,
    }),
    [doctorAppointments]
  );

  const handleDaySelect = (d: Date) => {
    setDay(d);
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  return (
    <DoctorDeskLayout>
      <div className="flex h-full gap-4 overflow-hidden">
        {/* Левая панель */}
        <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto pr-1">
          <MonthLoadCalendar
            selected={day}
            onSelect={handleDaySelect}
            appointmentDays={appointmentDays}
            viewMonth={viewMonth}
            onPrevMonth={() => setViewMonth((m) => addMonths(m, -1))}
            onNextMonth={() => setViewMonth((m) => addMonths(m, 1))}
          />
          <DoctorSelector
            doctors={visibleDoctors}
            selectedId={selectedDoctor?.id ?? null}
            onSelect={(d: ScheduleDoctor) => setSelectedDoctorId(d.id)}
          />
        </div>

        {/* Центр: таймлайн выбранного врача */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="mb-1 flex shrink-0 items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">{t("schedule.title")}</h1>
              <p className="text-sm capitalize text-gray-400">{dateLabel}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setDay((d) => addDays(d, -1))} className="rounded-xl px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition">←</button>
              <button
                onClick={() => { const t0 = new Date(); setDay(t0); setViewMonth(new Date(t0.getFullYear(), t0.getMonth(), 1)); }}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                {t("schedule.today")}
              </button>
              <button onClick={() => setDay((d) => addDays(d, 1))} className="rounded-xl px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition">→</button>
              {selectedDoctor && (
                <button
                  onClick={() => setExceptionsDoctor(selectedDoctor)}
                  className="ml-1 rounded-xl border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition"
                  title={t("scheduleExceptions.title")}
                >
                  📅
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto rounded-3xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            {isLoading ? (
              <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
            ) : !selectedDoctor ? (
              <div className="p-10 text-center text-gray-400">{t("schedule.selectDoctorHint")}</div>
            ) : (
              <DoctorTimeline
                appointments={doctorAppointments}
                exceptions={doctorExceptions}
                day={day}
                onSelect={setSelected}
                onSlotClick={setCreateSlot}
              />
            )}
          </div>
        </div>

        {/* Правая панель */}
        <SelectedAppointmentPanel
          appointment={selected}
          dayStats={dayStats}
          onAddPatient={() => setCreateSlot({ hour: DAY_DEFAULT_HOUR, minute: 0 })}
        />
      </div>

      {createSlot && selectedDoctor && (
        <CreateAppointmentDialog
          doctor={selectedDoctor}
          day={day}
          time={createSlot}
          preselectPatientId={preselectPatientId}
          onClose={() => setCreateSlot(null)}
        />
      )}
      {exceptionsDoctor && (
        <DoctorExceptionsDialog doctor={exceptionsDoctor} onClose={() => setExceptionsDoctor(null)} />
      )}
    </DoctorDeskLayout>
  );
}

const DAY_DEFAULT_HOUR = 9;
