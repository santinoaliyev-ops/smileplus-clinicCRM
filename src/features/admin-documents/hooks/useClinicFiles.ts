import { useQuery } from "@tanstack/react-query";
import { patientFilesService } from "@/shared/api/patients/patient-files.service";

export function useClinicFiles(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-files", clinicId],
    queryFn: () => patientFilesService.listByClinic(clinicId!),
    enabled: !!clinicId,
  });
}
