import {
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import { ClinicContext } from "./ClinicContext";
import { useAuth } from "@/app/providers/auth";
import type { CurrentClinic } from "@/shared/types/auth";

interface Props {
  children: ReactNode;
}

const STORAGE_KEY = "smileplus.currentClinic";

export function ClinicProvider({ children }: Props) {
  const { user } = useAuth();

  // Явный выбор пользователя (переключение клиники в UI)
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  // Активная клиника вычисляется из user + выбора, без эффектов
  const clinic = useMemo<CurrentClinic | null>(() => {
    if (!user || user.clinics.length === 0) return null;

    const selected =
      user.clinics.find((c) => c.clinicId === selectedClinicId) ??
      user.clinics[0];

    return {
      clinicId: selected.clinicId,
      clinicStaffId: selected.id,
      clinicName: selected.clinic.name,
      role: selected.role,
    };
  }, [user, selectedClinicId]);

  const setClinic = useCallback((next: CurrentClinic) => {
    setSelectedClinicId(next.clinicId);
    localStorage.setItem(STORAGE_KEY, next.clinicId);
  }, []);

  const clearClinic = useCallback(() => {
    setSelectedClinicId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ clinic, setClinic, clearClinic }),
    [clinic, setClinic, clearClinic]
  );

  return (
    <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
  );
}