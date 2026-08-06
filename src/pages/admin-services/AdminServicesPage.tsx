import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useSpecialties } from "@/features/services-catalog/hooks/useSpecialties";
import {
  useAdminCatalogProcedures,
  useSetProcedurePricing,
  useCreateCustomProcedure,
  useClinicPromotions,
  useCreatePromotion,
  useSetPromotionActive,
  useDeletePromotion,
} from "@/features/admin-services/hooks/useAdminServices";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/shared/api/clinic/clinic-procedures-admin.service";
import type { PromotionDiscountType } from "@/shared/api/promotions/promotions.service";
import type { Specialty } from "@/shared/api/specialties/specialties.service";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

type Tab = "services" | "promotions";

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  none: "Без подписки",
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

export function AdminServicesPage() {
  const { t, i18n } = useTranslation();
  const { clinic } = useClinic();
  const lang = i18n.language as "az" | "ru" | "en";

  const [tab, setTab] = useState<Tab>("services");
  const [activeSpecialtyId, setActiveSpecialtyId] = useState<string | null>(null);

  const { data: specialties = [] } = useSpecialties();
  const specId = activeSpecialtyId ?? specialties[0]?.id ?? null;

  const getSpecName = (s: Specialty) =>
    lang === "ru" ? s.nameRu : lang === "en" ? s.nameEn : s.nameAz;

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900">{t("adminServices.title")}</h1>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setTab("services")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === "services" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("adminServices.tabServices")}
            </button>
            <button
              onClick={() => setTab("promotions")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === "promotions" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("adminServices.tabPromotions")}
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 gap-px overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
          <aside className="flex w-56 shrink-0 flex-col overflow-y-auto bg-white">
            {specialties.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSpecialtyId(s.id)}
                className={`border-l-2 px-3 py-2.5 text-left text-sm transition ${
                  specId === s.id
                    ? "border-teal-600 bg-teal-50 font-semibold text-teal-800"
                    : "border-transparent text-gray-700 hover:bg-gray-50"
                }`}
              >
                {getSpecName(s)}
              </button>
            ))}
          </aside>

          <div className="flex-1 overflow-y-auto bg-white">
            {!clinic?.clinicId || !specId ? (
              <div className="p-6 text-center text-sm text-gray-400">{t("common.loading")}</div>
            ) : tab === "services" ? (
              <ServicesTab clinicId={clinic.clinicId} specialtyId={specId} lang={lang} />
            ) : (
              <PromotionsTab clinicId={clinic.clinicId} specialtyId={specId} lang={lang} />
            )}
          </div>
        </div>
      </div>
    </DoctorDeskLayout>
  );
}

function procName(
  p: { nameAz: string; nameRu: string; nameEn: string },
  lang: "az" | "ru" | "en"
) {
  return lang === "ru" ? p.nameRu : lang === "en" ? p.nameEn : p.nameAz;
}

function ServicesTab({
  clinicId,
  specialtyId,
  lang,
}: {
  clinicId: string;
  specialtyId: string;
  lang: "az" | "ru" | "en";
}) {
  const { t } = useTranslation();
  const { data: procedures = [], isLoading } = useAdminCatalogProcedures(clinicId, specialtyId);
  const setPricing = useSetProcedurePricing(clinicId, specialtyId);
  const createProcedure = useCreateCustomProcedure(clinicId, specialtyId);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nameAz: "", nameRu: "", nameEn: "", price: "", requiresTooth: true });

  const submitCreate = async () => {
    if (!form.nameRu.trim() || !form.price) return;
    await createProcedure.mutateAsync({
      nameAz: form.nameAz || form.nameRu,
      nameRu: form.nameRu,
      nameEn: form.nameEn || form.nameRu,
      requiresTooth: form.requiresTooth,
      price: parseFloat(form.price),
    });
    setForm({ nameAz: "", nameRu: "", nameEn: "", price: "", requiresTooth: true });
    setShowCreate(false);
  };

  if (isLoading) return <div className="p-6 text-center text-sm text-gray-400">{t("common.loading")}</div>;

  return (
    <div className="flex flex-col gap-3 p-4">
      {procedures.length === 0 && !showCreate && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {t("adminServices.emptySpecialty")}
        </p>
      )}

      {procedures.map((p) => (
        <div key={p.procedureId} className="rounded-xl border border-gray-100 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-gray-800">{procName(p, lang)}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                p.requiresTooth ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {p.requiresTooth ? t("adminServices.requiresTooth") : t("adminServices.noToothNeeded")}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PlanCell
                key={plan}
                plan={plan}
                value={p.pricing[plan]}
                defaultPrice={p.defaultPrice}
                onSave={(clinicPrice, isEnabled) =>
                  setPricing.mutate({ procedureId: p.procedureId, plan, clinicPrice, isEnabled })
                }
              />
            ))}
          </div>
        </div>
      ))}

      {showCreate ? (
        <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50/40 p-3">
          <div className="grid grid-cols-3 gap-2">
            <input
              value={form.nameRu}
              onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
              placeholder={t("adminServices.nameRu")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              value={form.nameAz}
              onChange={(e) => setForm((f) => ({ ...f, nameAz: e.target.value }))}
              placeholder={t("adminServices.nameAz")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              placeholder={t("adminServices.nameEn")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder={t("adminServices.price")}
              className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.requiresTooth}
                onChange={(e) => setForm((f) => ({ ...f, requiresTooth: e.target.checked }))}
              />
              {t("adminServices.requiresTooth")}
            </label>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={submitCreate}
                disabled={createProcedure.isPending}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl border border-dashed border-teal-300 py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50"
        >
          + {t("adminServices.addService")}
        </button>
      )}
    </div>
  );
}

function PlanCell({
  plan,
  value,
  defaultPrice,
  onSave,
}: {
  plan: SubscriptionPlan;
  value: { clinicPrice: number | null; isEnabled: boolean } | undefined;
  defaultPrice: number | null;
  onSave: (clinicPrice: number, isEnabled: boolean) => void;
}) {
  const { t } = useTranslation();
  const [price, setPrice] = useState(String(value?.clinicPrice ?? defaultPrice ?? 0));
  const [enabled, setEnabled] = useState(value?.isEnabled ?? false);

  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-500">{PLAN_LABELS[plan]}</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            onSave(parseFloat(price) || 0, e.target.checked);
          }}
          title={t("adminServices.enabled")}
        />
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => onSave(parseFloat(price) || 0, enabled)}
          disabled={!enabled}
          className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs outline-none focus:border-teal-500 disabled:bg-gray-100 disabled:text-gray-400"
        />
        <span className="text-[11px] text-gray-400">₼</span>
      </div>
    </div>
  );
}

function PromotionsTab({
  clinicId,
  specialtyId,
  lang,
}: {
  clinicId: string;
  specialtyId: string;
  lang: "az" | "ru" | "en";
}) {
  const { t } = useTranslation();
  const { data: procedures = [], isLoading } = useAdminCatalogProcedures(clinicId, specialtyId);
  const { data: promotions = [] } = useClinicPromotions(clinicId);
  const createPromotion = useCreatePromotion(clinicId);
  const setActive = useSetPromotionActive(clinicId);
  const removePromotion = useDeletePromotion(clinicId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ discountType: PromotionDiscountType; discountValue: string }>({
    discountType: "percent",
    discountValue: "",
  });

  if (isLoading) return <div className="p-6 text-center text-sm text-gray-400">{t("common.loading")}</div>;

  const startCreate = (procedureId: string) => {
    setEditingId(procedureId);
    setForm({ discountType: "percent", discountValue: "" });
  };

  const submit = async (procedureId: string) => {
    if (!form.discountValue) return;
    await createPromotion.mutateAsync({
      procedureId,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
    });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      {procedures.length === 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {t("adminServices.emptySpecialty")}
        </p>
      )}

      {procedures.map((p) => {
        const promo = promotions.find((pr) => pr.procedureId === p.procedureId);
        return (
          <div key={p.procedureId} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
            <span className="font-medium text-gray-800">{procName(p, lang)}</span>

            {promo ? (
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    promo.isActive ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {promo.discountType === "percent" ? `-${promo.discountValue}%` : `-${promo.discountValue} ₼`}
                </span>
                <button
                  onClick={() => setActive.mutate({ id: promo.id, isActive: !promo.isActive })}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  {promo.isActive ? t("adminServices.deactivate") : t("adminServices.activate")}
                </button>
                <button
                  onClick={() => removePromotion.mutate(promo.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ) : editingId === p.procedureId ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as PromotionDiscountType }))}
                  className="rounded-lg border border-gray-200 px-1.5 py-1 text-xs outline-none"
                >
                  <option value="percent">%</option>
                  <option value="fixed">₼</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => submit(p.procedureId)}
                  disabled={createPromotion.isPending}
                  className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
                >
                  {t("common.save")}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {t("common.cancel")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => startCreate(p.procedureId)}
                className="rounded-lg border border-dashed border-teal-300 px-2.5 py-1 text-xs font-medium text-teal-600 hover:bg-teal-50"
              >
                + {t("adminServices.addPromotion")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
