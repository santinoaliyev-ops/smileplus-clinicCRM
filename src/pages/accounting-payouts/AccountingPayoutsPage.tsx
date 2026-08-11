import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useClinicDoctors } from "@/features/schedule/hooks/useSchedule";
import { useAccountingInvoices } from "@/features/accounting/hooks/useAccountingInvoices";
import {
  useDoctorPayoutRates,
  useUpdateDoctorPayoutRate,
} from "@/features/accounting/hooks/useDoctorPayouts";
import type { PayoutType } from "@/shared/api/accounting/doctor-payouts.service";
import { UserRole } from "@/shared/types/auth";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

interface EditDraft {
  payoutType: PayoutType;
  rate: string;
}

function isSameMonth(dateStr: string, now: Date) {
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function AccountingPayoutsPage() {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const isManager = clinic?.role === UserRole.Manager;

  const { data: doctors = [], isLoading: doctorsLoading } = useClinicDoctors();
  const { data: invoices = [], isLoading: invoicesLoading } = useAccountingInvoices(clinic?.clinicId);
  const { data: rates = [], isLoading: ratesLoading } = useDoctorPayoutRates(clinic?.clinicId);
  const updateRate = useUpdateDoctorPayoutRate(clinic?.clinicId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>({ payoutType: "percent", rate: "" });

  const collectedByDoctor = useMemo(() => {
    const now = new Date();
    const map = new Map<string, number>();
    for (const inv of invoices) {
      if (!inv.doctorId || !isSameMonth(inv.createdAt, now)) continue;
      map.set(inv.doctorId, (map.get(inv.doctorId) ?? 0) + inv.totalPaid);
    }
    return map;
  }, [invoices]);

  const rateByDoctor = useMemo(() => {
    const map = new Map<string, (typeof rates)[number]>();
    for (const r of rates) map.set(r.doctorId, r);
    return map;
  }, [rates]);

  const rows = useMemo(() => {
    return doctors
      .map((d) => {
        const collected = collectedByDoctor.get(d.id) ?? 0;
        const rate = rateByDoctor.get(d.id);
        let accrued = 0;
        if (rate?.payoutType === "percent" && rate.payoutPercent !== null) {
          accrued = (collected * rate.payoutPercent) / 100;
        } else if (rate?.payoutType === "fixed" && rate.payoutFixedAmount !== null) {
          accrued = rate.payoutFixedAmount;
        }
        return { doctor: d, collected, rate: rate ?? null, accrued };
      })
      .sort((a, b) => a.doctor.fullName.localeCompare(b.doctor.fullName));
  }, [doctors, collectedByDoctor, rateByDoctor]);

  const totalAccrued = useMemo(() => rows.reduce((s, r) => s + r.accrued, 0), [rows]);

  const startEdit = (doctorId: string) => {
    const rate = rateByDoctor.get(doctorId);
    setDraft({
      payoutType: rate?.payoutType ?? "percent",
      rate:
        rate?.payoutType === "fixed"
          ? String(rate.payoutFixedAmount ?? "")
          : String(rate?.payoutPercent ?? ""),
    });
    setEditingId(doctorId);
  };

  const saveEdit = async (doctorId: string) => {
    const rateNum = parseFloat(draft.rate);
    if (isNaN(rateNum) || rateNum < 0 || !clinic) return;
    await updateRate.mutateAsync({
      doctorId,
      actorId: clinic.clinicStaffId,
      input: {
        payoutType: draft.payoutType,
        payoutPercent: draft.payoutType === "percent" ? rateNum : null,
        payoutFixedAmount: draft.payoutType === "fixed" ? rateNum : null,
      },
    });
    setEditingId(null);
  };

  const isLoading = doctorsLoading || invoicesLoading || ratesLoading;

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <h1 className="shrink-0 text-xl font-extrabold text-gray-900">{t("accountingPayouts.title")}</h1>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("accountingPayouts.empty")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              <div className="flex items-center gap-3 px-4 py-2 text-xs font-semibold uppercase text-gray-400">
                <span className="min-w-0 flex-1">{t("accountingPayouts.columns.doctor")}</span>
                <span className="w-40 shrink-0 text-right">{t("accountingPayouts.columns.collected")}</span>
                <span className="w-56 shrink-0">{t("accountingPayouts.columns.scheme")}</span>
                <span className="w-32 shrink-0 text-right">{t("accountingPayouts.columns.accrued")}</span>
                {isManager && <span className="w-16 shrink-0" />}
              </div>
              {rows.map(({ doctor, collected, rate, accrued }) => (
                <div key={doctor.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">{doctor.fullName}</div>
                    <div className="truncate text-xs text-gray-400">{doctor.specialization}</div>
                  </div>
                  <span className="w-40 shrink-0 text-right text-sm text-gray-700">{collected} ₼</span>

                  <div className="w-56 shrink-0">
                    {editingId === doctor.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={draft.payoutType}
                          onChange={(e) => setDraft((d) => ({ ...d, payoutType: e.target.value as PayoutType }))}
                          className="rounded-lg border border-gray-200 px-1.5 py-1 text-xs outline-none focus:border-teal-500"
                        >
                          <option value="percent">{t("accountingPayouts.scheme.percent")}</option>
                          <option value="fixed">{t("accountingPayouts.scheme.fixed")}</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={draft.rate}
                          onChange={(e) => setDraft((d) => ({ ...d, rate: e.target.value }))}
                          className="w-16 rounded-lg border border-gray-200 px-1.5 py-1 text-xs outline-none focus:border-teal-500"
                        />
                        <button
                          onClick={() => saveEdit(doctor.id)}
                          disabled={updateRate.isPending}
                          className="rounded-lg bg-teal-600 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
                        >
                          {t("common.save")}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    ) : rate?.payoutType === "percent" ? (
                      <span className="text-sm text-gray-700">
                        {t("accountingPayouts.scheme.percent")} · {rate.payoutPercent}%
                      </span>
                    ) : rate?.payoutType === "fixed" ? (
                      <span className="text-sm text-gray-700">
                        {t("accountingPayouts.scheme.fixed")} · {rate.payoutFixedAmount} ₼
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">{t("accountingPayouts.scheme.notConfigured")}</span>
                    )}
                  </div>

                  <span className="w-32 shrink-0 text-right text-sm font-bold text-teal-600">{accrued.toFixed(2)} ₼</span>

                  {isManager && editingId !== doctor.id && (
                    <button
                      onClick={() => startEdit(doctor.id)}
                      className="w-16 shrink-0 text-right text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      {t("common.edit")}
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 text-sm font-semibold text-gray-500">
                  {t("accountingPayouts.total")}
                </span>
                <span className="text-sm font-extrabold text-gray-900">{totalAccrued.toFixed(2)} ₼</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
