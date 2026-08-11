import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useAccountingInvoices } from "@/features/accounting/hooks/useAccountingInvoices";
import { useExpenses } from "@/features/accounting/hooks/useExpenses";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

export function AccountingDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const { data: invoices = [], isLoading } = useAccountingInvoices(clinic?.clinicId);
  const { data: expenses = [] } = useExpenses(clinic?.clinicId);

  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let revenueToday = 0;
    let revenueMonth = 0;
    for (const inv of invoices) {
      for (const p of inv.payments) {
        const paidAt = new Date(p.paidAt);
        if (paidAt.toDateString() === todayStr) revenueToday += p.amount;
        if (paidAt.getTime() >= monthStart) revenueMonth += p.amount;
      }
    }

    const expensesMonth = expenses
      .filter((e) => e.status === "approved" && new Date(e.expenseDate).getTime() >= monthStart)
      .reduce((s, e) => s + e.amount, 0);

    const unpaid = invoices.filter((i) => i.status === "sent" && i.totalPaid === 0);
    const partial = invoices.filter((i) => i.status === "sent" && i.totalPaid > 0);
    const receivables = invoices
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + i.remaining, 0);

    return {
      revenueToday,
      revenueMonth,
      expensesMonth,
      netMonth: revenueMonth - expensesMonth,
      unpaidCount: unpaid.length,
      partialCount: partial.length,
      receivables,
    };
  }, [invoices, expenses]);

  const overdue = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "sent")
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, 8),
    [invoices]
  );

  const kpis = [
    { label: t("accountingDashboard.kpi.revenueToday"), value: `${stats.revenueToday} ₼` },
    { label: t("accountingDashboard.kpi.revenueMonth"), value: `${stats.revenueMonth} ₼` },
    { label: t("accountingDashboard.kpi.expensesMonth"), value: `${stats.expensesMonth} ₼` },
    { label: t("accountingDashboard.kpi.netMonth"), value: `${stats.netMonth} ₼`, danger: stats.netMonth < 0 },
    { label: t("accountingDashboard.kpi.receivables"), value: `${stats.receivables} ₼`, danger: stats.receivables > 0 },
    { label: t("accountingDashboard.kpi.unpaid"), value: stats.unpaidCount, danger: stats.unpaidCount > 0 },
    { label: t("accountingDashboard.kpi.partial"), value: stats.partialCount },
  ];

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-4 overflow-y-auto pb-4">
        <h1 className="text-xl font-extrabold text-gray-900">{t("accountingDashboard.title")}</h1>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-400">{k.label}</p>
              <p className={`text-2xl font-bold ${k.danger ? "text-red-600" : "text-gray-900"}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="shrink-0 border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">{t("accountingDashboard.needsAttention")}</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-gray-400">{t("common.loading")}</div>
            ) : overdue.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">{t("accountingDashboard.noOutstanding")}</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {overdue.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => navigate("/accounting/invoices")}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-teal-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-800">
                        {inv.patientName ?? inv.patientPhone}
                      </div>
                      <div className="truncate text-xs text-gray-400">{inv.doctorName ?? "—"}</div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-orange-600">{inv.remaining} ₼</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
