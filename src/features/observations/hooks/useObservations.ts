import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  observationsService,
  type CreateObservationInput,
} from "@/shared/api/clinical/observations.service";

export function useCreateObservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateObservationInput) =>
      observationsService.create(input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["patient-teeth", vars.patientId] });
      qc.invalidateQueries({ queryKey: ["patient-profile", vars.patientId] });
    },
  });
}