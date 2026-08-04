import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  patientFilesService,
  type UploadPatientFileInput,
} from "@/shared/api/patients/patient-files.service";

export function usePatientFiles(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-files", patientId],
    queryFn: () => patientFilesService.listByPatient(patientId!),
    enabled: !!patientId,
  });
}

export function useUploadPatientFile(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<UploadPatientFileInput, "patientId">) =>
      patientFilesService.upload({ ...input, patientId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient-files", patientId] }),
  });
}

export function useDeletePatientFile(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) =>
      patientFilesService.remove(id, storagePath),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient-files", patientId] }),
  });
}
