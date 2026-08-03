import { useQuery } from "@tanstack/react-query";
import { toothHistoryService } from "@/shared/api/clinical/tooth-history.service";

export function useToothHistory(
  patientId: string | undefined,
  toothNumber: number | null
) {
  return useQuery({
    queryKey: ["tooth-history", patientId, toothNumber],
    queryFn: () =>
      toothHistoryService.get(patientId!, toothNumber!),
    enabled: !!patientId && toothNumber !== null,
  });
}