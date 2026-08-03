import { useTranslation } from "react-i18next";

import { useAuth } from "@/app/providers/auth";
import { useClinic } from "@/app/providers/clinic";
import { setLanguage } from "@/shared/i18n";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

const LANGUAGES: { code: "az" | "ru" | "en"; label: string }[] = [
  { code: "az", label: "Azərbaycan" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { clinic } = useClinic();

  const lang = i18n.language as "az" | "ru" | "en";

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col overflow-y-auto">
        <h1 className="mb-4 text-xl font-extrabold text-gray-900">{t("settings.title")}</h1>

        <div className="flex max-w-xl flex-col gap-3">
          {/* Язык */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("settings.language")}
            </p>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    lang === l.code
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Аккаунт */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("settings.account")}
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("settings.fullName")}</span>
                <span className="font-medium text-gray-800">{user?.account.fullName ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("settings.email")}</span>
                <span className="font-medium text-gray-800">{user?.account.email ?? "—"}</span>
              </div>
              {user?.account.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("settings.phone")}</span>
                  <span className="font-medium text-gray-800">{user.account.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">{t("settings.role")}</span>
                <span className="font-medium text-gray-800">
                  {clinic ? t(`roles.${clinic.role}`) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("settings.clinic")}</span>
                <span className="font-medium text-gray-800">{clinic?.clinicName ?? "—"}</span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="mt-4 w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t("common.logout")}
            </button>
          </div>
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
