import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PatientHistoryEntry } from "@/shared/api/patients/patient-profile.service";

interface Props {
  history: PatientHistoryEntry[];
}

interface VisitGroup {
  key: string;
  date: string;
  clinicName: string | null;
  doctorName: string | null;
  isOwn: boolean;
  items: PatientHistoryEntry[];
}

function groupByVisit(history: PatientHistoryEntry[]): VisitGroup[] {
  const groups = new Map<string, VisitGroup>();
  for (const h of history) {
    const key = h.invoiceId ?? h.id;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(h);
    } else {
      groups.set(key, {
        key,
        date: h.date,
        clinicName: h.clinicName,
        doctorName: h.doctorName,
        isOwn: h.isOwn,
        items: [h],
      });
    }
  }
  return Array.from(groups.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function VisitHistoryTimeline({ history }: Props) {
  const { t } = useTranslation();
  const groups = useMemo(() => groupByVisit(history), [history]);

  if (groups.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">{t("patientCard.noVisits")}</div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {groups.map((g) => (
        <div key={g.key} className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">
              {new Date(g.date).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {g.isOwn ? (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                {t("patientCard.ownVisit")}
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                {g.clinicName ?? "—"}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">{g.doctorName ?? "—"}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {g.items.map((item) => (
              <span
                key={item.id}
                className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600"
              >
                {item.procedureName ?? "—"}
                {item.toothNumbers && item.toothNumbers.length > 0 && (
                  <span className="ml-1 text-gray-400">🦷 {item.toothNumbers.join(",")}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
