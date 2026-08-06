import {
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import { ClinicContext } from "./ClinicContext";
import { useAuth } from "@/app/providers/auth";
import type { ClinicStaff, CurrentClinic } from "@/shared/types/auth";

interface Props {
  children: ReactNode;
}

const STORAGE_KEY = "smileplus.currentClinic";

function toCurrentClinic(staff: ClinicStaff): CurrentClinic {
  return {
    clinicId: staff.clinicId,
    clinicStaffId: staff.id,
    clinicName: staff.clinic.name,
    role: staff.role,
  };
}

export function ClinicProvider({ children }: Props) {
  const { user } = useAuth();

  // Явный выбор пользователя (переключение клиники в UI)
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  // Активная клиника вычисляется из user + выбора, без эффектов.
  // Если клиника ровно одна — выбирать нечего, используем её всегда.
  // Если их несколько — нужен явный выбор (см. SelectClinicPage), пока
  // его нет (или сохранённый выбор больше не входит в список пользователя) — null.
  const clinic = useMemo<CurrentClinic | null>(() => {
    if (!user || user.clinics.length === 0) return null;

    if (user.clinics.length === 1) {
      return toCurrentClinic(user.clinics[0]);
    }

    const selected = user.clinics.find((c) => c.clinicId === selectedClinicId);
    return selected ? toCurrentClinic(selected) : null;
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