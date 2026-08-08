import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import {
  useClinicDay,
  useClinicDoctors,
} from "@/features/schedule/hooks/useSchedule";
import { useDoctorScheduleRules } from "@/features/admin-dashboard/hooks/useAdminDashboard";
import { useClinicRooms } from "@/features/clinic-rooms/hooks/useClinicRooms";
import { computeFreeSlots } from "@/shared/api/schedule/doctor-schedule.service";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";
import { CreatePatientDialog } from "@/pages/schedule/CreatePatientDialog";
import type { ScheduleAppointment } from "@/shared/api/schedule/schedule.service";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Дашборд ресепшена — операционный (очередь, чек-ин, быстрая запись),
 * без финансовых/управленческих метрик директорского AdminDashboardPage
 * (нет "неоплаченных счетов", нет "последних действий").
 */
export function ReceptionDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clinic } = useClinic();

  const [createPatientOpen, setCreatePatientOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

  const { data: appointments = [], isLoading } = useClinicDay(today);
  const { data: doctors = [] } = useClinicDoctors();
  const { data: scheduleRules = [] } = useDoctorScheduleRules(clinic?.clinicId);
  const { data: rooms = [] } = useClinicRooms(clinic?.clinicId);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const active = useMemo(
    () => appointments.filter((a) => a.status !== "cancelled"),
    [appointments]
  );

  const arrivedCount = active.filter((a) => a.arrivedAt).length;
  const lateAppointments = active.filter((a) => {
    if (a.arrivedAt || a.status === "completed" || a.status === "no_show") return false;
    const startMin = new Date(a.scheduledAt).getHours() * 60 + new Date(a.scheduledAt).getMinutes();
    return startMin < nowMin;
  });
  const waitingAppointments = active.filter((a) => {
    if (a.arrivedAt || a.status === "completed" || a.status === "no_show") return false;
    const startMin = new Date(a.scheduledAt).getHours() * 60 + new Date(a.scheduledAt).getMinutes();
    return startMin >= nowMin;
  });

  // Свободные слоты по каждому врачу на сегодня
  const freeSlotsByDoctor = useMemo(() => {
    const dow = today.getDay();
    return doctors.map((doc) => {
      const rule = scheduleRules.find((r) => r.doctorId === doc.id && r.dayOfWeek === dow);
      const booked = active
        .filter((a) => a.doctorId === doc.id)
        .map((a) => {
          const d = new Date(a.scheduledAt);
          return { startMin: d.getHours() * 60 + d.getMinutes(), durationMin: a.durationMin };
        });
      return { doctor: doc, slots: computeFreeSlots(rule, booked, nowMin) };
    });
  }, [doctors, scheduleRules, active, today, nowMin]);

  const totalFreeSlots = freeSlotsByDoctor.reduce((s, d) => s + d.slots.length, 0);

  // Кабинет свободен, если у него нет закреплённого врача или тот сейчас не на приёме
  const freeRooms = rooms.filter(
    (r) => !r.doctorId || !active.some((a) => a.doctorId === r.doctorId && a.status === "in_progress")
  );

  const queueGroups: { key: string; icon: string; labelKey: string; items: ScheduleAppointment[] }[] = [
    { key: "arrived", icon: "🟢", labelKey: "adminDashboard.queue.arrived", items: active.filter((a) => a.arrivedAt && a.status !== "in_progress" && a.status !== "completed") },
    { key: "waiting", icon: "🟡", labelKey: "adminDashboard.queue.waiting", items: waitingAppointments },
    { key: "inProgress", icon: "🔵", labelKey: "adminDashboard.queue.inProgress", items: active.filter((a) => a.status === "in_progress") },
    { key: "completed", icon: "⚫", labelKey: "adminDashboard.queue.completed", items: active.filter((a) => a.status === "completed") },
    { key: "noShow", icon: "🔴", labelKey: "adminDashboard.queue.noShow", items: active.filter((a) => a.status === "no_show") },
  ];

  const kpis = [
    { label: t("adminDashboard.kpi.patients"), value: active.length },
    { label: t("adminDashboard.kpi.arrived"), value: arrivedCount },
    { label: t("adminDashboard.kpi.waiting"), value: waitingAppointments.length },
    { label: t("adminDashboard.kpi.late"), value: lateAppointments.length, danger: lateAppointments.length > 0 },
    { label: t("adminDashboard.kpi.freeSlots"), value: totalFreeSlots },
    ...(rooms.length > 0 ? [{ label: t("adminDashboard.kpi.freeRooms"), value: freeRooms.length }] : []),
  ];

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-4 overflow-y-auto pb-4">
        <h1 className="text-xl font-extrabold text-gray-900">{t("receptionDashboard.title")}</h1>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-400">{k.label}</p>
              <p className={`text-2xl font-bold ${k.danger ? "text-red-600" : "text-gray-900"}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Расписание на сегодня */}
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm lg:col-span-2">
            <div className="shrink-0 border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">{t("adminDashboard.todaySchedule")}</span>
            </div>
            <div className="max-h-96 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center text-sm text-gray-400">{t("common.loading")}</div>
              ) : active.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">{t("adminDashboard.noAppointmentsToday")}</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {active
                    .slice()
                    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                    .map((a) => (
                      <button
                        key={a.id}
                        onClick={() => navigate(`/patient/${a.patient.id}`)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-teal-50"
                      >
                        <span className="w-14 shrink-0 text-sm font-semibold text-gray-700">
                          {timeLabel(a.scheduledAt)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-800">
                            {a.patient.fullName ?? a.patient.phone}
                          </div>
                          <div className="truncate text-xs text-gray-400">{a.doctorName ?? "—"}</div>
                        </div>
                        <StatusPill appointment={a} />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">{t("adminDashboard.quickActions")}</span>
            </div>
            <div className="flex flex-col gap-2 p-3">
              <button
                onClick={() => setCreatePatientOpen(true)}
                className="rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                + {t("adminDashboard.actions.newPatient")}
              </button>
              <button
                onClick={() => navigate("/schedule")}
                className="rounded-xl border border-teal-300 bg-teal-50 py-2.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
              >
                + {t("adminDashboard.actions.bookPatient")}
              </button>
              <button
                onClick={() => navigate("/patients")}
                className="rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                {t("adminDashboard.actions.findPatient")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Очередь */}
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">{t("adminDashboard.queueTitle")}</span>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {queueGroups.map((g) => (
                <div key={g.key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-gray-700">
                    <span>{g.icon}</span>
                    {t(g.labelKey)}
                  </span>
                  <span className="font-semibold text-gray-900">{g.items.length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Свободные окна */}
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">{t("adminDashboard.freeSlots")}</span>
            </div>
            <div className="max-h-64 flex-1 overflow-y-auto p-3">
              {freeSlotsByDoctor.every((d) => d.slots.length === 0) ? (
                <p className="p-3 text-center text-sm text-gray-400">{t("adminDashboard.noFreeSlots")}</p>
              ) : (
                <div className="space-y-3">
                  {freeSlotsByDoctor
                    .filter((d) => d.slots.length > 0)
                    .map(({ doctor, slots }) => (
                      <div key={doctor.id}>
                        <p className="mb-1 text-xs font-semibold text-gray-600">{doctor.fullName}</p>
                        <div className="flex flex-wrap gap-1">
                          {slots.slice(0, 6).map((s) => (
                            <span
                              key={`${s.hour}:${s.minute}`}
                              className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[11px] font-medium text-teal-700"
                            >
                              {String(s.hour).padStart(2, "0")}:{String(s.minute).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {createPatientOpen && (
        <CreatePatientDialog
          onCreated={(patient) => {
            setCreatePatientOpen(false);
            navigate(`/patient/${patient.id}`);
          }}
          onClose={() => setCreatePatientOpen(false)}
        />
      )}
    </DoctorDeskLayout>
  );
}

function StatusPill({ appointment }: { appointment: ScheduleAppointment }) {
  const { t } = useTranslation();
  if (appointment.status === "in_progress") {
    return <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">{t("adminDashboard.queue.inProgress")}</span>;
  }
  if (appointment.status === "completed") {
    return <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{t("adminDashboard.queue.completed")}</span>;
  }
  if (appointment.status === "no_show") {
    return <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">{t("adminDashboard.queue.noShow")}</span>;
  }
  if (appointment.arrivedAt) {
    return <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">{t("adminDashboard.queue.arrived")}</span>;
  }
  return <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{t("adminDashboard.queue.waiting")}</span>;
}
