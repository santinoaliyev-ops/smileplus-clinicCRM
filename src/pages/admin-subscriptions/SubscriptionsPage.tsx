import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useClinicSubscriptions } from "@/features/subscriptions/hooks/useClinicSubscriptions";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";
import type { ClinicSubscriptionEntry } from "@/shared/api/subscriptions/subscriptions.service";

type Tab = "active" | "expiring" | "expired";

const DAY_MS = 24 * 60 * 60 * 1000;

function categorize(sub: ClinicSubscriptionEntry, now: number): Tab {
  if (sub.status !== "active" || !sub.endsAt) return "expired";
  const endsAt = new Date(sub.endsAt).getTime();
  if (endsAt < now) return "expired";
  if (endsAt - now <= 30 * DAY_MS) return "expiring";
  return "active";
}

export function SubscriptionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const { data: subscriptions = [], isLoading } = useClinicSubscriptions(clinic?.clinicId);

  const [tab, setTab] = useState<Tab>("active");

  const grouped = useMemo(() => {
    const now = new Date().getTime();
    const groups: Record<Tab, ClinicSubscriptionEntry[]> = { active: [], expiring: [], expired: [] };
    for (const s of subscriptions) groups[categorize(s, now)].push(s);
    return groups;
  }, [subscriptions]);

  const TABS: { key: Tab; labelKey: string; cls: string }[] = [
    { key: "active", labelKey: "subscriptionsPage.tabs.active", cls: "text-green-700" },
    { key: "expiring", labelKey: "subscriptionsPage.tabs.expiring", cls: "text-amber-700" },
    { key: "expired", labelKey: "subscriptionsPage.tabs.expired", cls: "text-red-600" },
  ];

  const visible = grouped[tab];

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <h1 className="shrink-0 text-xl font-extrabold text-gray-900">{t("subscriptionsPage.title")}</h1>

        <div className="flex shrink-0 gap-2">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                tab === tb.key ? "bg-teal-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t(tb.labelKey)} ({grouped[tb.key].length})
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("subscriptionsPage.empty")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {visible.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/patient/${s.patientId}`)}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-teal-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900">{s.patientName ?? s.patientPhone}</div>
                    <div className="text-xs text-gray-500">{s.patientPhone}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                    {s.plan.toUpperCase()}
                  </span>
                  <span className="w-24 shrink-0 text-right text-sm text-gray-600">
                    {s.coverageLimit - s.coverageUsed} ₼
                  </span>
                  <span className="w-28 shrink-0 text-right text-xs text-gray-400">
                    {s.endsAt
                      ? new Date(s.endsAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
