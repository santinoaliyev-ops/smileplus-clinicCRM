import { useQuery } from "@tanstack/react-query";
import { patientsService } from "@/shared/api/patients/patients.service";

export function usePatientsForDoctor(clinicId: string | undefined, doctorId: string | undefined) {
  return useQuery({
    queryKey: ["doctor-patients", clinicId, doctorId],
    queryFn: () => patientsService.listForDoctor(clinicId!, doctorId!),
    enabled: !!clinicId && !!doctorId,
    staleTime: 60_000,
  });
}
