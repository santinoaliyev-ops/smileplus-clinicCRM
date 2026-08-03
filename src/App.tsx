import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/dashboard";
import { DoctorDeskPage } from "@/pages/doctor-desk";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { RoleHome } from "@/app/routes/RoleHome";
import { SchedulePage } from "@/pages/schedule";
import { InvoicePage } from "@/pages/invoice";
import { CashierPage } from "@/pages/cashier";
import { PatientCardPage } from "@/pages/patient-card";
import { TreatmentPlanPage } from "@/pages/treatment-plan";
import { PatientListPage } from "@/pages/patient-list";
import { SettingsPage } from "@/pages/settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleHome />} />
        <Route path="/doctor" element={<DoctorDeskPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/patients" element={<PatientListPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/doctor/invoice/:appointmentId" element={<InvoicePage />} />
        <Route path="/doctor/treatment-plan/:patientId" element={<TreatmentPlanPage />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/patient/:patientId" element={<PatientCardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}