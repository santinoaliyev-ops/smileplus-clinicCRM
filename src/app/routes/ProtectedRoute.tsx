import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/app/providers/auth";
import { useClinic } from "@/app/providers/clinic";

export function ProtectedRoute() {
  const { user, isAuthenticated, loading } = useAuth();
  const { clinic } = useClinic();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Загрузка…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Врач/директор с 2+ клиниками должен явно выбрать, в какую входит,
  // прежде чем попасть в любую clinic-зависимую часть приложения.
  const needsClinicSelection =
    !clinic && (user?.clinics.length ?? 0) > 1 && location.pathname !== "/select-clinic";

  if (needsClinicSelection) {
    return <Navigate to="/select-clinic" replace />;
  }

  return <Outlet />;
}