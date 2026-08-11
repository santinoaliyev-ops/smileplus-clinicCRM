import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useAuditLog } from "@/features/accounting/hooks/useAuditLog";
import type { FinanceAction, FinanceEntityType } from "@/shared/api/accounting/audit-log.service";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

const ENTITY_TYPES: FinanceEntityType[] = [
  "expense",
  "doctor_payout_rate",
  "bank_account",
  "bank_transaction",
  "finance_settings",
  "closed_period",
];

const ACTION_COLORS: Record<FinanceAction, string> = {
  create: "bg-teal-50 text-teal-600",
  update: "bg-blue-50 text-blue-600",
  delete: "bg-red-50 text-red-500",
  approve: "bg-teal-50 text-teal-600",
  reject: "bg-red-50 text-red-500",
  match: "bg-purple-50 text-purple-600",
  unmatch: "bg-gray-100 text-gray-500",
  close: "bg-amber-50 text-amber-600",
};

function detailsSummary(details: Record<string, unknown> | null): string {
  if (!details) return "—";
  return Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export function AccountingAuditLogPage() {
  const { t } = useTranslation();
  const { clinic } = useClinic();

  const { data: entries = [], isLoading } = useAuditLog(clinic?.clinicId);
  const [entityFilter, setEntityFilter] = useState<FinanceEntityType | "all">("all");

  const filtered = useMemo(
    () => (entityFilter === "all" ? entries : entries.filter((e) => e.entityType === entityFilter)),
    [entries, entityFilter]
  );

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <h1 className="shrink-0 text-xl font-extrabold text-gray-900">{t("accountingAuditLog.title")}</h1>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value as FinanceEntityType | "all")}
          className="w-fit shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
        >
          <option value="all">{t("cashier.filterAll")}</option>
          {ENTITY_TYPES.map((et) => (
            <option key={et} value={et}>
              {t(`accountingAuditLog.entityTypes.${et}`)}
            </option>
          ))}
        </select>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("accountingAuditLog.empty")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-36 shrink-0 text-xs text-gray-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                  <span className="w-32 shrink-0 truncate text-sm text-gray-700">
                    {entry.actorName ?? "—"}
                  </span>
                  <span className="w-40 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-center text-xs font-semibold text-gray-600">
                    {t(`accountingAuditLog.entityTypes.${entry.entityType}`)}
                  </span>
                  <span
                    className={`w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${ACTION_COLORS[entry.action]}`}
                  >
                    {t(`accountingAuditLog.actions.${entry.action}`)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
                    {detailsSummary(entry.details)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
