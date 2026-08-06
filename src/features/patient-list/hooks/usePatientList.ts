import { useQuery } from "@tanstack/react-query";
import { patientsService } from "@/shared/api/patients/patients.service";

export function usePatientsForDoctor(clinicId: string | undefined, doctorId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-patients", clinicId, doctorId],
    queryFn: () => patientsService.listForClinic(clinicId!, doctorId),
    enabled: !!clinicId && !!doctorId,
    staleTime: 60_000,
  });
}

export function usePatientsForClinic(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-patients", clinicId, undefined],
    queryFn: () => patientsService.listForClinic(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}
