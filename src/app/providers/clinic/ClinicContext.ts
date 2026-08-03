import { createContext } from "react";
import type { CurrentClinic } from "@/shared/types/auth";

export interface ClinicContextValue {
  clinic: CurrentClinic | null;
  setClinic(clinic: CurrentClinic): void;
  clearClinic(): void;
}

export const ClinicContext =
  createContext<ClinicContextValue | null>(null);