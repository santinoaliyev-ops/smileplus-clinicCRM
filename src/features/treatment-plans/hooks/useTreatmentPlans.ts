import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  treatmentPlansService,
  type CreatePlanInput,
  type TreatmentPlanStatus,
} from "@/shared/api/treatment-plans/treatment-plans.service";

export function usePatientPlans(patientId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-plans", patientId],
    queryFn: () => treatmentPlansService.getByPatient(patientId!),
    enabled: !!patientId,
  });
}

export function useCreatePlan(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => treatmentPlansService.create(input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["treatment-plans", patientId] }),
  });
}

export function usePlanActions(patientId: string) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["treatment-plans", patientId] });

  const updateStatus = useMutation({
    mutationFn: ({ planId, status }: { planId: string; status: TreatmentPlanStatus }) =>
      treatmentPlansService.updateStatus(planId, status),
    onSuccess: invalidate,
  });

  const markCompleted = useMutation({
    mutationFn: (itemId: string) => treatmentPlansService.markItemCompleted(itemId),
    onSuccess: invalidate,
  });

  return { updateStatus, markCompleted };
}