import { useTranslation } from "react-i18next";
import type { CashierInvoice } from "@/shared/api/cashier/cashier.service";

interface Props {
  invoice: CashierInvoice;
  onClose: () => void;
}

/** Read-only панель — врач видит счёт, но не принимает оплату (в отличие от InvoiceDetailPanel кассира) */
export function DoctorInvoiceDetailPanel({ invoice, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex w-96 shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-gray-100 p-4">
        <div>
          <div className="font-semibold text-gray-900">
            {invoice.patientName ?? invoice.patientPhone}
          </div>
          <div className="text-xs text-gray-500">{invoice.patientPhone}</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

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

      <div className="border-t border-gray-100 p-4">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-500">{t("invoice.patient")}</span>
          <span className="font-semibold">{invoice.patientAmount} ₼</span>
        </div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-500">{t("cashier.paid")}</span>
          <span className="font-semibold text-teal-600">{invoice.totalPaid} ₼</span>
        </div>
        <div className="mb-1 flex justify-between">
          <span className="font-semibold text-gray-800">{t("cashier.remaining")}</span>
          <span className="text-xl font-bold text-orange-600">{invoice.remaining} ₼</span>
        </div>

        {invoice.status === "paid" && (
          <div className="mt-2 rounded-xl bg-teal-50 py-3 text-center font-semibold text-teal-700">
            ✓ {t("cashier.fullyPaid")}
          </div>
        )}
      </div>
    </div>
  );
}
