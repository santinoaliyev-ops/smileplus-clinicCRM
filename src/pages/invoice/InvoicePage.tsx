import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { useClinic } from "@/app/providers/clinic";
import { useDoctorProfile } from "@/features/doctor-dashboard/hooks/useDoctorProfile";
import { usePatientTeeth } from "@/features/doctor-dashboard/hooks/usePatientTeeth";
import {
  useClinicProcedures,
  useCreateInvoice,
} from "@/features/doctor-dashboard/hooks/useInvoice";
import { useSpecialties } from "@/features/services-catalog/hooks/useSpecialties";
import { appointmentDetailService } from "@/shared/api/appointments/appointment-detail.service";
import type { ClinicProcedure } from "@/shared/api/invoices/invoice.service";
import type { Specialty } from "@/shared/api/specialties/specialties.service";
import { CompactToothBar } from "./CompactToothBar";

interface CartItem {
  id: string;
  procedure: ClinicProcedure;
  toothNumbers: number[];
  quantity: number;
}

export function InvoicePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { clinic } = useClinic();
  const { data: doctor } = useDoctorProfile();
  const lang = i18n.language as "az" | "ru" | "en";

  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPct, setDiscountPct] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: appointment } = useQuery({
    queryKey: ["appointment-detail", appointmentId],
    queryFn: () => appointmentDetailService.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  const { data: teethData = [] } = usePatientTeeth(appointment?.patient.id);
  const { data: proceduresData, isLoading: procLoading } = useClinicProcedures(
    clinic?.clinicId,
    appointment?.patient.id
  );
  const { data: specialties = [] } = useSpecialties();
  const createInvoice = useCreateInvoice();

  const activeCat = activeCategory ?? specialties[0]?.code ?? null;

  const getCatName = (cat: Specialty) =>
    lang === "ru" ? cat.nameRu : lang === "en" ? cat.nameEn : cat.nameAz;
  const getProcName = (p: ClinicProcedure) =>
    lang === "ru" ? p.nameRu : lang === "en" ? p.nameEn : p.nameAz;

  const visibleProcedures = useMemo(
    () =>
      proceduresData?.procedures.filter(
        (p) => p.categoryCode === activeCat
      ) ?? [],
    [proceduresData, activeCat]
  );

  const canAdd = (p: ClinicProcedure) => !p.requiresTooth || selectedTeeth.length > 0;

  const addToCart = (p: ClinicProcedure) => {
    if (!canAdd(p)) return;
    setError(null);
    setCart((prev) => [
      ...prev,
      { id: crypto.randomUUID(), procedure: p, toothNumbers: [...selectedTeeth], quantity: selectedTeeth.length || 1 },
    ]);
    setSelectedTeeth([]);
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const changeQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    );

  const totalPatient = cart.reduce((s, i) => s + i.procedure.patientPrice * i.quantity, 0);
  const totalCovered = cart.reduce((s, i) => s + i.procedure.coveredPrice * i.quantity, 0);

  const submit = async () => {
    if (!appointment || !clinic || !doctor) return;
    if (cart.length === 0) { setError(t("invoice.empty")); return; }
    if (!proceduresData?.hasSubscription && discountPct && !discountReason.trim()) {
      setError(t("invoice.discountReasonRequired")); return;
    }
    setError(null);
    try {
      await createInvoice.mutateAsync({
        doctorId: doctor.id,
        userId: appointment.patient.id,
        clinicId: clinic.clinicId,
        appointmentId: appointment.id,
        items: cart.flatMap((item) =>
          Array.from({ length: item.quantity }, () => ({
            procedureId: item.procedure.procedureId,
            toothNumbers: item.toothNumbers,
            manualDiscountPct: discountPct ? parseFloat(discountPct) : null,
            manualDiscountReason: discountReason || null,
          }))
        ),
      });
      navigate(-1);
    } catch {
      setError(t("invoice.error"));
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-sm">

      {/* ═══ ШАПКА: навигация + пациент + ЗУБНАЯ ФОРМУЛА в одну строку ═══ */}
      <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={() => navigate(-1)}
          className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          ←
        </button>

        <div className="shrink-0">
          <div className="text-sm font-bold text-gray-900">
            {appointment?.patient.fullName ?? appointment?.patient.phone ?? "…"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {t("invoice.title")}
            {proceduresData && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                proceduresData.hasSubscription
                  ? "bg-teal-100 text-teal-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {proceduresData.hasSubscription
                  ? proceduresData.plan?.toUpperCase()
                  : t("invoice.noSubscription")}
              </span>
            )}
          </div>
        </div>

        {/* Зубная формула — компактная строка */}
        <div className="flex-1 overflow-x-auto">
          <CompactToothBar
            teeth={teethData}
            selected={selectedTeeth}
            onChange={setSelectedTeeth}
          />
        </div>
      </header>

      {/* ═══ ЦЕНТР: категории | услуги ═══ */}
      <div className="flex min-h-0 flex-[3] gap-px bg-gray-200">
        {/* Категории — дерево слева */}
        <div className="flex w-52 shrink-0 flex-col overflow-y-auto bg-white">
          {specialties.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.code)}
              className={`border-l-2 px-3 py-2 text-left text-sm transition ${
                activeCat === cat.code
                  ? "border-teal-600 bg-teal-50 font-semibold text-teal-800"
                  : "border-transparent text-gray-700 hover:bg-gray-50"
              }`}
            >
              {getCatName(cat)}
            </button>
          ))}
        </div>

        {/* Услуги — таблица */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          <div className="grid shrink-0 grid-cols-[1fr_90px_90px_70px] border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <span>
              {t("invoice.addProcedure")}
              {selectedTeeth.length > 0 && (
                <span className="ml-2 normal-case tracking-normal rounded bg-teal-600 px-1.5 py-0.5 text-white">
                  🦷 {selectedTeeth.join(",")}
                </span>
              )}
            </span>
            <span className="text-right">{t("invoice.patient")}</span>
            <span className="text-right">{t("invoice.covered")}</span>
            <span />
          </div>
          <div className="flex-1 overflow-y-auto">
            {procLoading ? (
              <div className="p-4 text-center text-gray-400">{t("common.loading")}</div>
            ) : (
              visibleProcedures.map((p) => {
                const disabled = !canAdd(p);
                return (
                  <div
                    key={p.procedureId}
                    onDoubleClick={() => addToCart(p)}
                    title={disabled ? t("invoicePage.selectTeethFirst") : undefined}
                    className={`grid grid-cols-[1fr_90px_90px_70px] items-center border-b border-gray-50 px-3 py-1.5 transition ${
                      disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-teal-50"
                    }`}
                  >
                    <span className="truncate">
                      <span className="font-medium text-gray-800">{getProcName(p)}</span>
                      {p.label && <span className="ml-1.5 text-xs text-teal-600">{p.label}</span>}
                      {p.promotion && (
                        <span className="ml-1.5 rounded bg-orange-100 px-1 py-0.5 text-[10px] font-semibold text-orange-700">
                          {t("invoicePage.promotion")}
                        </span>
                      )}
                    </span>
                    <span className="text-right font-semibold text-gray-900">
                      {p.promotion && (
                        <span className="mr-1 text-xs font-normal text-gray-400 line-through">
                          {p.promotion.originalPrice} ₼
                        </span>
                      )}
                      {p.patientPrice} ₼
                    </span>
                    <span className="text-right text-teal-600">
                      {p.coveredPrice > 0 ? `+${p.coveredPrice}` : "—"}
                    </span>
                    <span className="text-right">
                      <button
                        onClick={() => addToCart(p)}
                        disabled={disabled}
                        className="rounded bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-teal-50 disabled:hover:text-teal-700"
                      >
                        +
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══ КОРЗИНА — во всю ширину ═══ */}
      <div className="flex min-h-0 flex-[2] flex-col border-t-2 border-gray-300 bg-white">
        <div className="grid shrink-0 grid-cols-[1fr_110px_90px_90px_90px_36px] border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <span>{t("invoice.selectedProcedures")} ({cart.length})</span>
          <span className="text-center">{t("invoice.teeth")}</span>
          <span className="text-center">Miqdar</span>
          <span className="text-right">{t("invoice.patient")}</span>
          <span className="text-right">{t("invoice.covered")}</span>
          <span />
        </div>
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              {t("invoicePage.cartEmpty")}
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_110px_90px_90px_90px_36px] items-center border-b border-gray-50 px-3 py-1.5"
              >
                <span className="truncate font-medium text-gray-800">
                  {getProcName(item.procedure)}
                </span>
                <span className="text-center text-xs text-gray-500">
                  {item.toothNumbers.length > 0 ? item.toothNumbers.join(";") : "—"}
                </span>
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => changeQty(item.id, -1)} className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-100">−</button>
                  <span className="w-5 text-center font-semibold">{item.quantity}</span>
                  <button onClick={() => changeQty(item.id, 1)} className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 text-xs hover:bg-gray-100">+</button>
                </div>
                <span className="text-right font-semibold text-gray-900">
                  {item.procedure.promotion && (
                    <span className="mr-1 text-xs font-normal text-gray-400 line-through">
                      {item.procedure.promotion.originalPrice * item.quantity} ₼
                    </span>
                  )}
                  {item.procedure.patientPrice * item.quantity} ₼
                </span>
                <span className="text-right text-teal-600">
                  {item.procedure.coveredPrice * item.quantity > 0
                    ? `+${item.procedure.coveredPrice * item.quantity}`
                    : "—"}
                </span>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">✕</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ НИЗ: скидка | итог + отправить ═══ */}
      <footer className="flex shrink-0 items-stretch gap-px border-t-2 border-gray-300 bg-gray-200">
        {/* Скидка */}
        <div className="flex w-80 shrink-0 items-center gap-2 bg-white px-3 py-2">
          <span className="text-[11px] font-semibold uppercase text-gray-500">
            {t("invoice.discount")}
          </span>
          <input
            type="number" min={0} max={100}
            value={discountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
            placeholder="0%"
            disabled={proceduresData?.hasSubscription}
            className="w-14 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-teal-500 disabled:bg-gray-50"
          />
          <input
            value={discountReason}
            onChange={(e) => setDiscountReason(e.target.value)}
            placeholder={t("invoice.discountReason")}
            disabled={!discountPct || proceduresData?.hasSubscription}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-orange-400 disabled:bg-gray-50"
          />
        </div>

        {/* Итог + кнопка */}
        <div className="flex flex-1 items-center justify-end gap-6 bg-white px-4 py-2">
          {error && (
            <span className="rounded bg-red-50 px-2.5 py-1 text-xs text-red-600">{error}</span>
          )}
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {t("invoice.covered")}: <span className="font-semibold text-teal-600">{totalCovered} ₼</span>
            </div>
            <div className="text-xs text-gray-500">
              {t("invoice.patient")}:{" "}
              <span className="text-lg font-bold text-gray-900">{totalPatient} ₼</span>
            </div>
          </div>
          <button
            onClick={submit}
            disabled={cart.length === 0 || createInvoice.isPending}
            className="rounded-xl bg-teal-600 px-6 py-2.5 font-bold text-white transition hover:bg-teal-700 disabled:opacity-40"
          >
            {createInvoice.isPending ? t("invoice.submitting") : t("invoice.submit")}
          </button>
        </div>
      </footer>
    </div>
  );
}