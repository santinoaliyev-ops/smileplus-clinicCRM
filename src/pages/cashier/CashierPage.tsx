import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/app/providers/auth";
import { useClinic } from "@/app/providers/clinic";
import {
  useCashierInvoices,
  useCashierRealtime,
} from "@/features/cashier/hooks/useCashier";
import { InvoiceDetailPanel } from "./InvoiceDetailPanel";

type Filter = "unpaid" | "partial" | "paid" | "all";

export function CashierPage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { clinic } = useClinic();

  const [filter, setFilter] = useState<Filter>("unpaid");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useCashierInvoices();
  useCashierRealtime();

  const filtered = useMemo(() => {
    switch (filter) {
      case "unpaid":
        return invoices.filter((i) => i.status === "sent" && i.totalPaid === 0);
      case "partial":
        return invoices.filter((i) => i.status === "sent" && i.totalPaid > 0);
      case "paid":
        return invoices.filter((i) => i.status === "paid");
      default:
        return invoices;
    }
  }, [invoices, filter]);

  const selected = useMemo(
    () => invoices.find((i) => i.id === selectedId) ?? null,
    [invoices, selectedId]
  );

  // Касса за сегодня — сумма всех платежей, принятых сегодня
  const todayPaid = useMemo(() => {
    const today = new Date().toDateString();
    return invoices.reduce(
      (sum, inv) =>
        sum +
        inv.payments
          .filter((p) => new Date(p.paidAt).toDateString() === today)
          .reduce((s, p) => s + p.amount, 0),
      0
    );
  }, [invoices]);

  const FILTERS: { key: Filter; labelKey: string }[] = [
    { key: "unpaid", labelKey: "cashier.filterUnpaid" },
    { key: "partial", labelKey: "cashier.filterPartial" },
    { key: "paid", labelKey: "cashier.filterPaid" },
    { key: "all", labelKey: "cashier.filterAll" },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Шапка */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900">
            {t("cashier.title")}
          </h1>
          <span className="text-sm font-medium text-teal-600">
            {clinic?.clinicName}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-teal-50 px-4 py-1.5 text-sm">
            <span className="text-gray-500">{t("cashier.todayTotal")}: </span>
            <span className="font-bold text-teal-700">{todayPaid} ₼</span>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold text-gray-800">
              {user?.account.fullName}
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            {t("common.logout")}
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-3 overflow-hidden p-3">
        {/* Список инвойсов */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Фильтры */}
          <div className="flex shrink-0 gap-1 border-b border-gray-100 p-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  filter === f.key
                    ? "bg-teal-600 font-semibold text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>

          {/* Заголовок таблицы */}
          <div className="grid shrink-0 grid-cols-[1fr_140px_110px_110px_110px] border-b border-gray-200 bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <span>{t("cashier.patient")}</span>
            <span>{t("cashier.doctor")}</span>
            <span className="text-right">{t("cashier.amount")}</span>
            <span className="text-right">{t("cashier.paid")}</span>
            <span className="text-right">{t("cashier.remaining")}</span>
          </div>

          {/* Строки */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-gray-400">
                {t("common.loading")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                {t("cashier.empty")}
              </div>
            ) : (
              filtered.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={`grid w-full grid-cols-[1fr_140px_110px_110px_110px] items-center border-b border-gray-50 px-4 py-2.5 text-left transition hover:bg-teal-50 ${
                    selectedId === inv.id ? "bg-teal-50" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {inv.patientName ?? inv.patientPhone}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(inv.createdAt).toLocaleString(
                        i18n.language === "ru" ? "ru-RU" : "az-Latn-AZ",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                  <span className="truncate text-sm text-gray-600">
                    {inv.doctorName ?? "—"}
                  </span>
                  <span className="text-right text-sm font-semibold text-gray-900">
                    {inv.patientAmount} ₼
                  </span>
                  <span className="text-right text-sm text-teal-600">
                    {inv.totalPaid > 0 ? `${inv.totalPaid} ₼` : "—"}
                  </span>
                  <span
                    className={`text-right text-sm font-semibold ${
                      inv.status === "paid" ? "text-teal-600" : "text-orange-600"
                    }`}
                  >
                    {inv.status === "paid" ? "✓" : `${inv.remaining} ₼`}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Панель деталей */}
        {selected && (
          <InvoiceDetailPanel
            invoice={selected}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}