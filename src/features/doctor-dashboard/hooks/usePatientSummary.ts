import { useQuery } from "@tanstack/react-query";
import { patientSummaryService } from "@/shared/api/patients/patient-summary.service";

export function usePatientSummary(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-summary", patientId],
    queryFn: () => patientSummaryService.get(patientId!),
    enabled: !!patientId,
    staleTime: 60_000,
  });
}