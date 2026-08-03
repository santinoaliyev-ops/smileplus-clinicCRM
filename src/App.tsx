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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleHome />} />
        <Route path="/doctor" element={<DoctorDeskPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/doctor/invoice/:appointmentId" element={<InvoicePage />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/patient/:patientId" element={<PatientCardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}