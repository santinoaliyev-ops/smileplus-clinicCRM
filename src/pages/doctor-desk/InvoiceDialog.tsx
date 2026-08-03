import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import {
  useClinicProcedures,
  useCreateInvoice,
} from "@/features/doctor-dashboard/hooks/useInvoice";
import type { ClinicProcedure } from "@/shared/api/invoices/invoice.service";
import type { DoctorAppointment } from "@/shared/api/appointments/appointments.service";

interface SelectedItem {
  procedure: ClinicProcedure;
  toothNumbers: string; // через запятую: "11, 12"
  manualDiscountPct: string;
  manualDiscountReason: string;
}

interface Props {
  appointment: DoctorAppointment;
  doctorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceDialog({
  appointment,
  doctorId,
  onClose,
  onSuccess,
}: Props) {
  const { t, i18n } = useTranslation();
  const { clinic } = useClinic();
  const create = useCreateInvoice();

  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: proceduresData, isLoading } = useClinicProcedures(
    clinic?.clinicId,
    appointment.patient.id
  );

  const lang = i18n.language as "az" | "ru" | "en";

  const getProcedureName = (p: ClinicProcedure) => {
    if (lang === "ru") return p.nameRu;
    if (lang === "en") return p.nameEn;
    return p.nameAz;
  };

  const addProcedure = (p: ClinicProcedure) => {
    setSelected((prev) => [
      ...prev,
      {
        procedure: p,
        toothNumbers: "",
        manualDiscountPct: "",
        manualDiscountReason: "",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (
    idx: number,
    field: keyof Omit<SelectedItem, "procedure">,
    value: string
  ) => {
    setSelected((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  // Суммы для превью (из предпросмотра от get-clinic-procedures, не финальный расчёт)
  const totalPatient = selected.reduce(
    (sum, item) => sum + item.procedure.patientPrice,
    0
  );
  const totalCovered = selected.reduce(
    (sum, item) => sum + item.procedure.coveredPrice,
    0
  );

  const validate = (): string | null => {
    if (selected.length === 0) return t("invoice.empty");

    for (const item of selected) {
      if (
        !proceduresData?.hasSubscription &&
        item.manualDiscountPct &&
        !item.manualDiscountReason.trim()
      ) {
        return t("invoice.discountReasonRequired");
      }
    }
    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!clinic) return;
    setError(null);

    try {
      await create.mutateAsync({
        doctorId,
        userId: appointment.patient.id,
        clinicId: clinic.clinicId,
        appointmentId: appointment.id,
        items: selected.map((item) => ({
          procedureId: item.procedure.procedureId,
          toothNumbers: item.toothNumbers
            ? item.toothNumbers
                .split(",")
                .map((n) => parseInt(n.trim()))
                .filter((n) => !isNaN(n))
            : [],
          manualDiscountPct: item.manualDiscountPct
            ? parseFloat(item.manualDiscountPct)
            : null,
          manualDiscountReason: item.manualDiscountReason || null,
        })),
      });
      onSuccess();
    } catch {
      setError(t("invoice.error"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t("invoice.title")}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {appointment.patient.fullName ?? appointment.patient.phone}
              {proceduresData && (
                <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                  {proceduresData.hasSubscription
                    ? t("invoice.plan", {
                        plan: proceduresData.plan?.toUpperCase(),
                      })
                    : t("invoice.noSubscription")}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Левая колонка: каталог процедур */}
          <div className="flex w-64 shrink-0 flex-col border-r border-gray-100">
            <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("invoice.addProcedure")}
            </p>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  {t("common.loading")}
                </div>
              ) : (
                proceduresData?.procedures.map((p) => (
                  <button
                    key={p.procedureId}
                    onClick={() => addProcedure(p)}
                    className="flex w-full flex-col px-4 py-3 text-left transition hover:bg-teal-50"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {getProcedureName(p)}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-sm font-semibold text-teal-700">
                        {p.patientPrice} ₼
                      </span>
                      {p.coveredPrice > 0 && (
                        <span className="text-xs text-gray-400">
                          +{p.coveredPrice} ₼ {t("invoice.covered")}
                        </span>
                      )}
                    </div>
                    {p.label && (
                      <span className="mt-0.5 text-xs text-teal-600">
                        {p.label}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Правая колонка: выбранные позиции */}
          <div className="flex flex-1 flex-col">
            <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("invoice.selectedProcedures")}
            </p>

            <div className="flex-1 overflow-y-auto px-4">
              {selected.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  {t("invoice.empty")}
                </div>
              ) : (
                <div className="space-y-3">
                  {selected.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {getProcedureName(item.procedure)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.procedure.patientPrice} ₼
                            {item.procedure.coveredPrice > 0 &&
                              ` + ${item.procedure.coveredPrice} ₼`}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Зубы */}
                      <input
                        value={item.toothNumbers}
                        onChange={(e) =>
                          updateItem(idx, "toothNumbers", e.target.value)
                        }
                        placeholder={t("invoice.addTeeth") + " (11, 12…)"}
                        className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-teal-500"
                      />

                      {/* Ручная скидка — только без подписки */}
                      {!proceduresData?.hasSubscription && (
                        <div className="space-y-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.manualDiscountPct}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "manualDiscountPct",
                                e.target.value
                              )
                            }
                            placeholder={t("invoice.discount")}
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-teal-500"
                          />
                          {item.manualDiscountPct && (
                            <input
                              value={item.manualDiscountReason}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "manualDiscountReason",
                                  e.target.value
                                )
                              }
                              placeholder={t("invoice.discountReason")}
                              className="w-full rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-orange-400"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Итого + кнопка */}
            {selected.length > 0 && (
              <div className="border-t border-gray-100 p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t("invoice.covered")}</span>
                  <span className="font-medium text-teal-600">
                    {totalCovered} ₼
                  </span>
                </div>
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-800">
                    {t("invoice.patient")}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {totalPatient} ₼
                  </span>
                </div>
                <p className="mb-3 text-xs text-gray-400">
                  * {t("invoice.subtitle")}
                </p>

                {error && (
                  <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                  </p>
                )}

                <button
                  onClick={submit}
                  disabled={create.isPending}
                  className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition"
                >
                  {create.isPending
                    ? t("invoice.submitting")
                    : t("invoice.submit")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}