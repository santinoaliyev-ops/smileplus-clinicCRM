import { useQuery } from "@tanstack/react-query";
import { patientTeethService } from "@/shared/api/patients/patient-teeth.service";

export function usePatientTeeth(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-teeth", patientId],
    queryFn: () => patientTeethService.getByPatient(patientId!),
    enabled: !!patientId,
    staleTime: 60_000,
  });
}