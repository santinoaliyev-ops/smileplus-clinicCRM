import { useClinic } from "@/app/providers/clinic";
import {
  hasPermission,
  type Permission,
} from "@/shared/types/auth";

export function usePermission() {
  const { clinic } = useClinic();

  const can = (permission: Permission): boolean => {
    if (!clinic) return false;
    return hasPermission(clinic.role, permission);
  };

  return { can, role: clinic?.role ?? null };
}