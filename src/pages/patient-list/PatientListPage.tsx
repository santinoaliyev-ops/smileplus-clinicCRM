import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useDoctorProfile } from "@/features/doctor-dashboard/hooks/useDoctorProfile";
import { usePatientsForDoctor } from "@/features/patient-list/hooks/usePatientList";
import { getAge } from "@/features/doctor-dashboard/lib/desk-utils";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

export function PatientListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const { data: doctor } = useDoctorProfile();
  const { data: patients = [], isLoading } = usePatientsForDoctor(clinic?.clinicId, doctor?.id);

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.fullName?.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.finCode?.toLowerCase().includes(q)
    );
  }, [patients, query]);

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{t("patientList.title")}</h1>
            <p className="text-xs text-gray-400">{t("patientList.count", { count: patients.length })}</p>
          </div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("patientList.searchPlaceholder")}
            className="w-80 rounded-xl border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              {patients.length === 0 ? t("patientList.empty") : t("patientList.noResults")}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((p) => {
                const age = getAge(p.birthDate);
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/patient/${p.id}`)}
                    className="flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-teal-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-xs font-bold text-teal-700">
                      {(p.fullName ?? p.phone).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {p.fullName ?? "—"}
                        </span>
                        {age !== null && (
                          <span className="shrink-0 text-xs text-gray-400">
                            ({t("common.years_old", { count: age })})
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{p.phone}</span>
                    </div>
                    {p.finCode && (
                      <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        {p.finCode}
                      </span>
                    )}
                    <span className="shrink-0 text-gray-300">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
