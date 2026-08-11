import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app/providers/auth";
import { useClinic } from "@/app/providers/clinic";
import { UserRole } from "@/shared/types/auth";
import { PatientSearchBox } from "./PatientSearchBox";

export function DoctorDeskLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { clinic } = useClinic();
  const navigate = useNavigate();
  const location = useLocation();

  const isDoctor = clinic?.role === UserRole.Doctor;
  const isManager = clinic?.role === UserRole.Manager;
  const isReceptionist = clinic?.role === UserRole.Receptionist;
  const isAccountant = clinic?.role === UserRole.Accountant;

  const doctorNavItems = [
    { icon: "🦷", key: "desk",     path: "/doctor",   active: true, title: t("doctorDesk.title") },
    { icon: "📅", key: "schedule", path: "/schedule", active: true, title: t("schedule.title") },
    { icon: "🗂️", key: "patients", path: "/patients", active: true, title: t("patientList.title") },
    { icon: "🧾", key: "invoices", path: "/doctor/invoices", active: true, title: t("doctorInvoices.title") },
    { icon: "📊", key: "reports",  path: null,        active: false, title: t("common.comingSoon") },
  ];

  const managerNavItems = [
    { icon: "🏠", key: "home",          path: "/admin",    active: true,  title: t("adminDashboard.title") },
    { icon: "👥", key: "patients",      path: "/patients", active: true,  title: t("patientList.title") },
    { icon: "📅", key: "schedule",      path: "/schedule", active: true,  title: t("schedule.title") },
    { icon: "🦷", key: "appointments",  path: "/appointments",  active: true, title: t("appointmentsPage.title") },
    { icon: "👨‍⚕️", key: "doctors",      path: "/doctors",       active: true, title: t("doctorsPage.title") },
    { icon: "💳", key: "cashier",       path: "/cashier",  active: true,  title: t("cashier.title") },
    { icon: "⭐", key: "subscriptions", path: "/subscriptions", active: true, title: t("subscriptionsPage.title") },
    { icon: "📦", key: "documents",     path: "/documents",     active: true, title: t("documentsPage.title") },
    { icon: "🏷️", key: "services",      path: "/admin/services", active: true, title: t("adminServices.title") },
    { icon: "💸", key: "expenses",      path: "/accounting/expenses", active: true, title: t("accountingExpenses.title") },
    { icon: "💬", key: "messages",      path: null,        active: false, title: t("common.comingSoon") },
    { icon: "🔔", key: "notifications", path: null,        active: false, title: t("common.comingSoon") },
  ];

  // Ресепшен: операционка (очередь/запись/касса), без управленческих
  // разделов (подписки, документы, услуги/цены) — те только у директора.
  const receptionistNavItems = [
    { icon: "🏠", key: "home",          path: "/reception", active: true,  title: t("receptionDashboard.title") },
    { icon: "👥", key: "patients",      path: "/patients", active: true,  title: t("patientList.title") },
    { icon: "📅", key: "schedule",      path: "/schedule", active: true,  title: t("schedule.title") },
    { icon: "🦷", key: "appointments",  path: "/appointments",  active: true, title: t("appointmentsPage.title") },
    { icon: "👨‍⚕️", key: "doctors",      path: "/doctors",       active: true, title: t("doctorsPage.title") },
    { icon: "💳", key: "cashier",       path: "/cashier",  active: true,  title: t("cashier.title") },
    { icon: "💬", key: "messages",      path: null,        active: false, title: t("common.comingSoon") },
    { icon: "🔔", key: "notifications", path: null,        active: false, title: t("common.comingSoon") },
  ];

  const cashierNavItems = [
    { icon: "💳", key: "cashier", path: "/cashier", active: true, title: t("cashier.title") },
  ];

  // Бухгалтер: только финансовый учёт (счета/отчёты/подписки/фин.документы),
  // без пациентов/расписания/приёмов/врачей — вне его зоны по концепции роли.
  const accountantNavItems = [
    { icon: "🏠", key: "home",          path: "/accounting",           active: true, title: t("accountingDashboard.title") },
    { icon: "🧾", key: "invoices",      path: "/accounting/invoices",  active: true, title: t("accountingInvoices.title") },
    { icon: "📊", key: "reports",       path: "/accounting/reports",   active: true, title: t("accountingReports.title") },
    { icon: "⭐", key: "subscriptions", path: "/subscriptions",        active: true, title: t("subscriptionsPage.title") },
    { icon: "📦", key: "documents",     path: "/accounting/documents", active: true, title: t("accountingDocuments.title") },
    { icon: "💸", key: "expenses",      path: "/accounting/expenses",  active: true, title: t("accountingExpenses.title") },
  ];

  const navItems = isDoctor
    ? doctorNavItems
    : isManager
    ? managerNavItems
    : isReceptionist
    ? receptionistNavItems
    : isAccountant
    ? accountantNavItems
    : clinic?.role === UserRole.Cashier
    ? cashierNavItems
    : [];

  const isSettingsActive = location.pathname === "/settings";

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Сайдбар */}
      <nav className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-gray-200 bg-white py-4">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white">
          S+
        </div>
        {navItems.map((item) => {
          const isActive = item.path && location.pathname === item.path;
          return (
            <button
              key={item.key}
              onClick={() => item.path && navigate(item.path)}
              disabled={!item.active}
              title={item.title}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                isActive
                  ? "bg-teal-600 text-white ring-1 ring-teal-700"
                  : item.active
                  ? "bg-teal-50 text-teal-600 ring-1 ring-teal-200 hover:bg-teal-100 cursor-pointer"
                  : "cursor-not-allowed text-gray-300"
              }`}
            >
              {item.icon}
            </button>
          );
        })}

        <button
          onClick={() => navigate("/settings")}
          title={t("settings.title")}
          className={`mt-auto flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
            isSettingsActive
              ? "bg-teal-600 text-white ring-1 ring-teal-700"
              : "bg-teal-50 text-teal-600 ring-1 ring-teal-200 hover:bg-teal-100 cursor-pointer"
          }`}
        >
          ⚙️
        </button>
      </nav>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Шапка */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">
              {isDoctor ? t("doctorDesk.title") : t("adminDashboard.workspaceTitle")}
            </span>
            <span className="text-gray-300">·</span>
            {(user?.clinics.length ?? 0) > 1 ? (
              <button
                onClick={() => navigate("/select-clinic")}
                title={t("selectClinic.switch")}
                className="text-sm font-medium text-teal-600 underline decoration-dotted underline-offset-2 hover:text-teal-700"
              >
                {clinic?.clinicName}
              </button>
            ) : (
              <span className="text-sm font-medium text-teal-600">
                {clinic?.clinicName}
              </span>
            )}
          </div>

          <PatientSearchBox />

          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-semibold text-gray-800">
                {user?.account.fullName}
              </div>
              <div className="text-xs text-gray-500">
                {clinic ? t(`roles.${clinic.role}`) : t("doctorDesk.roleLabel")}
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

        <main className="flex-1 overflow-hidden p-4">{children}</main>
      </div>
    </div>
  );
}