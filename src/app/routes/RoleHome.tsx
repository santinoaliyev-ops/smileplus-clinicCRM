import { Navigate } from "react-router-dom";
import { useClinic } from "@/app/providers/clinic";
import { UserRole } from "@/shared/types/auth";

export function RoleHome() {
  const { clinic } = useClinic();

  if (!clinic) return null;

  switch (clinic.role) {
    case UserRole.Doctor:
        return <Navigate to="/doctor" replace />;
    case UserRole.Receptionist:
        return <Navigate to="/reception" replace />;
    case UserRole.Manager:
        return <Navigate to="/admin" replace />;
    case UserRole.Cashier:
      return <Navigate to="/cashier" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}