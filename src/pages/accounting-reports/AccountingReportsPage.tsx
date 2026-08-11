import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useAccountingInvoices } from "@/features/accounting/hooks/useAccountingInvoices";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

type Tab = "day" | "doctor" | "category";

interface Row {
  key: string;
  label: string;
  billed: number;
  collected?: number;
  count?: number;
}

export function AccountingReportsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "az" | "ru" | "en";
  const { clinic } = useClinic();
  const { data: invoices = [], isLoading } = useAccountingInvoices(clinic?.clinicId);

  const [tab, setTab] = useState<Tab>("day");

  const byDay = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const inv of invoices) {
      const key = new Date(inv.createdAt).toLocaleDateString(
        lang === "ru" ? "ru-RU" : "az-Latn-AZ",
        { day: "2-digit", month: "2-digit", year: "numeric" }
      );
      const row = map.get(key) ?? { key, label: key, billed: 0, collected: 0, count: 0 };
      row.billed += inv.patientAmount;
      row.collected = (row.collected ?? 0) + inv.totalPaid;
      row.count = (row.count ?? 0) + 1;
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [invoices, lang]);

  const byDoctor = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const inv of invoices) {
      const key = inv.doctorName ?? "—";
      const row = map.get(key) ?? { key, label: key, billed: 0, collected: 0, count: 0 };
      row.billed += inv.patientAmount;
      row.collected = (row.collected ?? 0) + inv.totalPaid;
      row.count = (row.count ?? 0) + 1;
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => b.billed - a.billed);
  }, [invoices]);

  const byCategory = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const label =
          (lang === "ru" ? item.categoryNameRu : lang === "en" ? item.categoryNameEn : item.categoryNameAz) ??
          t("accountingReports.uncategorized");
        const key = item.categoryCode ?? "uncategorized";
        const row = map.get(key) ?? { key, label, billed: 0 };
        row.billed += item.amountPatient;
        map.set(key, row);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.billed - a.billed);
  }, [invoices, lang, t]);

  const rows = tab === "day" ? byDay : tab === "doctor" ? byDoctor : byCategory;

  const TABS: { key: Tab; labelKey: string }[] = [
    { key: "day", labelKey: "accountingReports.tabs.day" },
    { key: "doctor", labelKey: "accountingReports.tabs.doctor" },
    { key: "category", labelKey: "accountingReports.tabs.category" },
  ];

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <h1 className="shrink-0 text-xl font-extrabold text-gray-900">{t("accountingReports.title")}</h1>

        <div className="flex shrink-0 gap-2">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                tab === tb.key ? "bg-teal-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t(tb.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("accountingReports.empty")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">{r.label}</div>
                    {r.count !== undefined && (
                      <div className="text-xs text-gray-400">
                        {t("accountingReports.invoiceCount", { count: r.count })}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-right">
                    <div>
                      <div className="text-xs text-gray-400">{t("accountingReports.billed")}</div>
                      <div className="text-sm font-bold text-gray-900">{r.billed} ₼</div>
                    </div>
                    {r.collected !== undefined && (
                      <div>
                        <div className="text-xs text-gray-400">{t("accountingReports.collected")}</div>
                        <div className="text-sm font-bold text-teal-600">{r.collected} ₼</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
