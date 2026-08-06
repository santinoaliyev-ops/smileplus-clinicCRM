import { Navigate, Outlet } from "react-router-dom";
import { useClinic } from "@/app/providers/clinic";
import { UserRole } from "@/shared/types/auth";

/** Пропускает дальше только перечисленные роли текущей клиники, иначе редиректит на fallback */
export function RequireRole({ roles, fallback = "/" }: { roles: UserRole[]; fallback?: string }) {
  const { clinic } = useClinic();

  if (!clinic || !roles.includes(clinic.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
