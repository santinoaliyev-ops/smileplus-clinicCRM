import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinicDay, useClinicDoctorsDetailed } from "@/features/schedule/hooks/useSchedule";
import { useDoctorScheduleRules } from "@/features/admin-dashboard/hooks/useAdminDashboard";
import { useClinicRooms, useClinicRoomActions } from "@/features/clinic-rooms/hooks/useClinicRooms";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";
import { useClinic } from "@/app/providers/clinic";
import { UserRole } from "@/shared/types/auth";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function DoctorsPage() {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);

  const { clinic } = useClinic();
  const isManager = clinic?.role === UserRole.Manager;
  const { data: doctors = [], isLoading } = useClinicDoctorsDetailed();
  const { data: appointments = [] } = useClinicDay(today);
  const { data: rules = [] } = useDoctorScheduleRules(clinic?.clinicId);
  const { data: rooms = [] } = useClinicRooms(clinic?.clinicId);
  const { createRoom, assignDoctor } = useClinicRoomActions(clinic?.clinicId);

  const [newRoomName, setNewRoomName] = useState("");

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dow = today.getDay();

  const roomByDoctor = new Map(rooms.filter((r) => r.doctorId).map((r) => [r.doctorId as string, r]));

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900">{t("doctorsPage.title")}</h1>
          {isManager && (
            <div className="flex items-center gap-2">
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder={t("doctorsPage.newRoomPlaceholder")}
                className="w-40 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
              />
              <button
                onClick={() => {
                  if (!newRoomName.trim()) return;
                  createRoom.mutate(newRoomName.trim());
                  setNewRoomName("");
                }}
                disabled={createRoom.isPending || !newRoomName.trim()}
                className="rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-100 disabled:opacity-40"
              >
                + {t("doctorsPage.addRoom")}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : doctors.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("doctorsPage.empty")}</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doc) => {
                const todayAppts = appointments.filter((a) => a.doctorId === doc.id && a.status !== "cancelled");
                const rule = rules.find((r) => r.doctorId === doc.id && r.dayOfWeek === dow);

                const nextPatient = todayAppts
                  .filter((a) => {
                    const startMin = new Date(a.scheduledAt).getHours() * 60 + new Date(a.scheduledAt).getMinutes();
                    return startMin >= nowMin && a.status !== "completed" && a.status !== "no_show";
                  })
                  .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

                let loadPct: number | null = null;
                let hoursLabel = t("doctorsPage.dayOff");
                if (rule) {
                  const [sh, sm] = rule.startTime.split(":").map(Number);
                  const [eh, em] = rule.endTime.split(":").map(Number);
                  const totalSlots = Math.max(1, Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / rule.slotDuration));
                  loadPct = Math.min(100, Math.round((todayAppts.length / totalSlots) * 100));
                  hoursLabel = `${rule.startTime.slice(0, 5)}–${rule.endTime.slice(0, 5)}`;
                }

                const room = roomByDoctor.get(doc.id) ?? null;
                const availableRooms = rooms.filter((r) => !r.doctorId || r.id === room?.id);

                return (
                  <div key={doc.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      {doc.avatarUrl ? (
                        <img src={doc.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-sm font-bold text-teal-700">
                          {initials(doc.fullName)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-gray-900">{doc.fullName}</span>
                          {doc.isVerified && <span title={t("doctorsPage.verified")}>✅</span>}
                        </div>
                        <span className="truncate text-xs text-gray-500">{doc.specialization}</span>
                      </div>
                      {!doc.isAccepting && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          {t("doctorsPage.notAccepting")}
                        </span>
                      )}
                    </div>

                    {doc.ratingCount > 0 && (
                      <div className="text-xs text-amber-600">
                        ⭐ {doc.rating.toFixed(1)} ({doc.ratingCount}) · {t("doctorsPage.experience", { count: doc.experienceYears })}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">{t("doctorsPage.todayCount")}</p>
                        <p className="font-semibold text-gray-800">{todayAppts.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t("doctorsPage.load")}</p>
                        <p className="font-semibold text-gray-800">{loadPct !== null ? `${loadPct}%` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t("doctorsPage.workingHours")}</p>
                        <p className="font-semibold text-gray-800">{hoursLabel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t("doctorsPage.nextPatient")}</p>
                        <p className="truncate font-semibold text-gray-800">
                          {nextPatient
                            ? `${new Date(nextPatient.scheduledAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} · ${nextPatient.patient.fullName ?? nextPatient.patient.phone}`
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <span className="text-xs text-gray-400">{t("doctorsPage.room")}</span>
                      {isManager ? (
                        <select
                          value={room?.id ?? ""}
                          onChange={(e) => assignDoctor.mutate({ doctorId: doc.id, roomId: e.target.value || null })}
                          disabled={assignDoctor.isPending}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-teal-500"
                        >
                          <option value="">{t("doctorsPage.noRoom")}</option>
                          {availableRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm font-semibold text-gray-800">{room?.name ?? "—"}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
