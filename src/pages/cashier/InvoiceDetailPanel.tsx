import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useAddPayment } from "@/features/cashier/hooks/useCashier";
import type { CashierInvoice } from "@/shared/api/cashier/cashier.service";

interface Props {
  invoice: CashierInvoice;
  onClose: () => void;
}

type PayMethod = "cash" | "card" | "transfer";

export function InvoiceDetailPanel({ invoice, onClose }: Props) {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const addPayment = useAddPayment();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!clinic) return;
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError(t("cashier.invalidAmount"));
      return;
    }
    if (value > invoice.remaining) {
      setError(t("cashier.overpayment", { remaining: invoice.remaining }));
      return;
    }
    setError(null);

    try {
      await addPayment.mutateAsync({
        clinicId: clinic.clinicId,
        invoiceId: invoice.id,
        amount: value,
        paymentMethod: method,
        receivedBy: clinic.clinicStaffId,
      });
      setAmount("");
    } catch (e) {
      setError(
        e instanceof Error && e.message === "OVERPAYMENT"
          ? t("cashier.overpayment", { remaining: invoice.remaining })
          : t("cashier.paymentError")
      );
    }
  };

  const payFull = () => setAmount(String(invoice.remaining));

  const METHODS: { key: PayMethod; labelKey: string; icon: string }[] = [
    { key: "cash", labelKey: "cashier.cash", icon: "💵" },
    { key: "card", labelKey: "cashier.card", icon: "💳" },
    { key: "transfer", labelKey: "cashier.transfer", icon: "🏦" },
  ];

  return (
    <div className="flex w-96 shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Шапка панели */}
      <div className="flex items-start justify-between border-b border-gray-100 p-4">
        <div>
          <div className="font-semibold text-gray-900">
            {invoice.patientName ?? invoice.patientPhone}
          </div>
          <div className="text-xs text-gray-500">{invoice.patientPhone}</div>
          {invoice.doctorName && (
            <div className="mt-1 text-xs text-teal-600">{invoice.doctorName}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* Позиции */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {t("invoice.selectedProcedures")}
        </p>
        <div className="space-y-2">
          {invoice.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-sm">
              <div>
                <div className="font-medium text-gray-800">{item.procedureName}</div>
                {item.toothNumbers.length > 0 && (
                  <div className="text-xs text-gray-400">
                    🦷 {item.toothNumbers.join(", ")}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{item.amountPatient} ₼</div>
                {item.amountCovered > 0 && (
                  <div className="text-xs text-teal-600">+{item.amountCovered} ₼</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* История платежей */}
        {invoice.payments.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {t("cashier.paymentHistory")}
            </p>
            <div className="space-y-1">
              {invoice.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between text-xs text-gray-600">
                  <span>
                    {t(`cashier.${p.paymentMethod}`)} ·{" "}
                    {new Date(p.paidAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-semibold">{p.amount} ₼</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Итоги + оплата */}
      <div className="border-t border-gray-100 p-4">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-500">{t("invoice.patient")}</span>
          <span className="font-semibold">{invoice.patientAmount} ₼</span>
        </div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-500">{t("cashier.paid")}</span>
          <span className="font-semibold text-teal-600">{invoice.totalPaid} ₼</span>
        </div>
        <div className="mb-3 flex justify-between">
          <span className="font-semibold text-gray-800">{t("cashier.remaining")}</span>
          <span className="text-xl font-bold text-orange-600">{invoice.remaining} ₼</span>
        </div>

        {invoice.status === "paid" ? (
          <div className="rounded-xl bg-teal-50 py-3 text-center font-semibold text-teal-700">
            ✓ {t("cashier.fullyPaid")}
          </div>
        ) : (
          <>
            {/* Способ оплаты */}
            <div className="mb-2 flex gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                    method === m.key
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {m.icon} {t(m.labelKey)}
                </button>
              ))}
            </div>

            {/* Сумма */}
            <div className="mb-2 flex gap-2">
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0 ₼"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-lg font-bold outline-none focus:border-teal-500"
              />
              <button
                onClick={payFull}
                className="rounded-xl border border-teal-300 bg-teal-50 px-3 text-xs font-semibold text-teal-700 hover:bg-teal-100"
              >
                {t("cashier.fullAmount")}
              </button>
            </div>

            {error && (
              <p className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={addPayment.isPending || !amount}
              className="w-full rounded-xl bg-teal-600 py-2.5 font-bold text-white transition hover:bg-teal-700 disabled:opacity-40"
            >
              {addPayment.isPending
                ? t("cashier.processing")
                : t("cashier.acceptPayment")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}