import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeSettingsService } from "@/shared/api/accounting/finance-settings.service";

export function useApprovalThreshold(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["expense-approval-threshold", clinicId],
    queryFn: () => financeSettingsService.getThreshold(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}

export function useSetApprovalThreshold(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: number | null) => financeSettingsService.setThreshold(clinicId!, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-approval-threshold", clinicId] });
    },
  });
}
