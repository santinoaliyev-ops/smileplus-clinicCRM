import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinicDay, useClinicScheduleRealtime, useScheduleActions } from "@/features/schedule/hooks/useSchedule";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";
import type { ScheduleAppointment } from "@/shared/api/schedule/schedule.service";
import type { AppointmentStatus } from "@/shared/api/appointments/appointments.service";

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

type FilterKey = "all" | "pending" | "confirmed" | "arrived" | "in_progress" | "completed" | "cancelled" | "no_show";

function matchesFilter(a: ScheduleAppointment, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "arrived") return !!a.arrivedAt && a.status !== "in_progress" && a.status !== "completed";
  return a.status === (filter as AppointmentStatus);
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-orange-100 text-orange-700",
  confirmed: "bg-teal-100 text-teal-700",
  in_progress: "bg-sky-100 text-sky-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-500 line-through",
  no_show: "bg-red-100 text-red-700",
};

export function AppointmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [day, setDay] = useState(() => new Date());
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data: appointments = [], isLoading } = useClinicDay(day);
  useClinicScheduleRealtime();
  const { confirm, markArrived } = useScheduleActions();

  const filtered = useMemo(
    () =>
      appointments
        .filter((a) => matchesFilter(a, filter))
        .slice()
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [appointments, filter]
  );

  const FILTERS: { key: FilterKey; labelKey: string }[] = [
    { key: "all", labelKey: "appointmentsPage.filters.all" },
    { key: "pending", labelKey: "schedule.statuses.pending" },
    { key: "confirmed", labelKey: "schedule.statuses.confirmed" },
    { key: "arrived", labelKey: "adminDashboard.queue.arrived" },
    { key: "in_progress", labelKey: "schedule.statuses.in_progress" },
    { key: "completed", labelKey: "schedule.statuses.completed" },
    { key: "cancelled", labelKey: "schedule.statuses.cancelled" },
    { key: "no_show", labelKey: "schedule.statuses.no_show" },
  ];

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900">{t("appointmentsPage.title")}</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setDay((d) => addDays(d, -1))} className="rounded-xl px-2.5 py-1.5 text-gray-500 hover:bg-gray-100">←</button>
            <button
              onClick={() => setDay(new Date())}
              className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              {t("schedule.today")}
            </button>
            <button onClick={() => setDay((d) => addDays(d, 1))} className="rounded-xl px-2.5 py-1.5 text-gray-500 hover:bg-gray-100">→</button>
            <span className="ml-2 text-sm font-medium text-gray-600">
              {day.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                filter === f.key ? "bg-teal-600 font-semibold text-white" : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("appointmentsPage.empty")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50">
                  <span className="w-14 shrink-0 text-sm font-semibold text-gray-700">
                    {new Date(a.scheduledAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    onClick={() => navigate(`/patient/${a.patient.id}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-medium text-gray-800">
                      {a.patient.fullName ?? a.patient.phone}
                    </div>
                    <div className="truncate text-xs text-gray-400">{a.doctorName ?? "—"}</div>
                  </button>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[a.status]}`}>
                    {t(`schedule.statuses.${a.status}`)}
                  </span>
                  {a.arrivedAt && <span className="shrink-0 text-green-600">✓</span>}
                  {a.status === "pending" && (
                    <button
                      onClick={() => confirm.mutate(a.id)}
                      className="shrink-0 rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                    >
                      {t("schedule.confirm")}
                    </button>
                  )}
                  {!a.arrivedAt && a.status === "confirmed" && (
                    <button
                      onClick={() => markArrived.mutate(a.id)}
                      className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      {t("doctorDesk.markArrived")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
