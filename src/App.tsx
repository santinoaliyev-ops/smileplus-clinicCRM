import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/dashboard";
import { DoctorDeskPage } from "@/pages/doctor-desk";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { RequireRole } from "@/app/routes/RequireRole";
import { RoleHome } from "@/app/routes/RoleHome";
import { UserRole } from "@/shared/types/auth";
import { SchedulePage } from "@/pages/schedule";
import { InvoicePage } from "@/pages/invoice";
import { CashierPage } from "@/pages/cashier";
import { PatientCardPage } from "@/pages/patient-card";
import { TreatmentPlanPage } from "@/pages/treatment-plan";
import { PatientListPage } from "@/pages/patient-list";
import { SettingsPage } from "@/pages/settings";
import { AdminDashboardPage } from "@/pages/admin-dashboard";
import { AppointmentsPage } from "@/pages/admin-appointments";
import { DoctorsPage } from "@/pages/admin-doctors";
import { SubscriptionsPage } from "@/pages/admin-subscriptions";
import { ClinicDocumentsPage } from "@/pages/admin-documents";
import { AdminServicesPage } from "@/pages/admin-services";
import { SelectClinicPage } from "@/pages/select-clinic";
import { DoctorInvoicesPage } from "@/pages/doctor-invoices";
import { ReceptionDashboardPage } from "@/pages/reception-dashboard";
import { AccountingDashboardPage } from "@/pages/accounting-dashboard";
import { AccountingInvoicesPage } from "@/pages/accounting-invoices";
import { AccountingReportsPage } from "@/pages/accounting-reports";
import { AccountingDocumentsPage } from "@/pages/accounting-documents";
import { AccountingExpensesPage } from "@/pages/accounting-expenses";
import { AccountingPayoutsPage } from "@/pages/accounting-payouts";
import { AccountingBankPage } from "@/pages/accounting-bank";
import { AccountingAuditLogPage } from "@/pages/accounting-audit-log";
import { AccountingPeriodClosingPage } from "@/pages/accounting-period-closing";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/select-clinic" element={<SelectClinicPage />} />
        <Route path="/" element={<RoleHome />} />
        <Route path="/doctor" element={<DoctorDeskPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/reception" element={<ReceptionDashboardPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />

        <Route element={<RequireRole roles={[UserRole.Manager]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/services" element={<AdminServicesPage />} />
          <Route path="/documents" element={<ClinicDocumentsPage />} />
        </Route>

        <Route element={<RequireRole roles={[UserRole.Manager, UserRole.Accountant]} />}>
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/accounting" element={<AccountingDashboardPage />} />
          <Route path="/accounting/invoices" element={<AccountingInvoicesPage />} />
          <Route path="/accounting/reports" element={<AccountingReportsPage />} />
          <Route path="/accounting/documents" element={<AccountingDocumentsPage />} />
          <Route path="/accounting/expenses" element={<AccountingExpensesPage />} />
          <Route path="/accounting/payouts" element={<AccountingPayoutsPage />} />
          <Route path="/accounting/bank" element={<AccountingBankPage />} />
          <Route path="/accounting/audit-log" element={<AccountingAuditLogPage />} />
          <Route path="/accounting/period-closing" element={<AccountingPeriodClosingPage />} />
        </Route>

        <Route path="/patients" element={<PatientListPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/doctor/invoice/:appointmentId" element={<InvoicePage />} />
        <Route path="/doctor/invoices" element={<DoctorInvoicesPage />} />
        <Route path="/doctor/treatment-plan/:patientId" element={<TreatmentPlanPage />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/patient/:patientId" element={<PatientCardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}