import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { periodClosingService } from "@/shared/api/accounting/period-closing.service";

export function useClosedPeriods(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["closed-periods", clinicId],
    queryFn: () => periodClosingService.listClosedPeriods(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}

export function useClosePeriod(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ periodMonth, closedBy }: { periodMonth: string; closedBy: string }) =>
      periodClosingService.closePeriod(clinicId!, periodMonth, closedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closed-periods", clinicId] });
    },
  });
}
