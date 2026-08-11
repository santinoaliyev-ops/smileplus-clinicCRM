import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useClosedPeriods, useClosePeriod } from "@/features/accounting/hooks/usePeriodClosing";
import { UserRole } from "@/shared/types/auth";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

function previousMonthStr(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function AccountingPeriodClosingPage() {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const isManager = clinic?.role === UserRole.Manager;

  const { data: periods = [], isLoading } = useClosedPeriods(clinic?.clinicId);
  const closePeriod = useClosePeriod(clinic?.clinicId);

  const [selectedMonth, setSelectedMonth] = useState(previousMonthStr());

  const closedMonthSet = useMemo(
    () => new Set(periods.map((p) => p.periodMonth.slice(0, 7))),
    [periods]
  );

  const isFuture = selectedMonth >= currentMonthStr();
  const alreadyClosed = closedMonthSet.has(selectedMonth);
  const canClose = isManager && !isFuture && !alreadyClosed;

  const submit = async () => {
    if (!clinic || !canClose) return;
    await closePeriod.mutateAsync({
      periodMonth: `${selectedMonth}-01`,
      closedBy: clinic.clinicStaffId,
    });
  };

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <h1 className="shrink-0 text-xl font-extrabold text-gray-900">{t("accountingPeriodClosing.title")}</h1>

        {isManager && (
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50/40 p-3">
            <input
              type="month"
              value={selectedMonth}
              max={currentMonthStr()}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <button
              onClick={submit}
              disabled={!canClose || closePeriod.isPending}
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
            >
              {t("accountingPeriodClosing.close")}
            </button>
            {isFuture && (
              <span className="text-xs text-gray-500">{t("accountingPeriodClosing.cannotCloseFuture")}</span>
            )}
            {!isFuture && alreadyClosed && (
              <span className="text-xs text-gray-500">{t("accountingPeriodClosing.alreadyClosed")}</span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : periods.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("accountingPeriodClosing.empty")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              <div className="flex items-center gap-3 px-4 py-2 text-xs font-semibold uppercase text-gray-400">
                <span className="w-28 shrink-0">{t("accountingPeriodClosing.columns.month")}</span>
                <span className="min-w-0 flex-1">{t("accountingPeriodClosing.columns.closedBy")}</span>
                <span className="w-40 shrink-0 text-right">{t("accountingPeriodClosing.columns.closedAt")}</span>
              </div>
              {periods.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-28 shrink-0 text-sm font-semibold text-gray-900">
                    {p.periodMonth.slice(0, 7)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{p.closedByName ?? "—"}</span>
                  <span className="w-40 shrink-0 text-right text-xs text-gray-400">
                    {new Date(p.closedAt).toLocaleString()}
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
