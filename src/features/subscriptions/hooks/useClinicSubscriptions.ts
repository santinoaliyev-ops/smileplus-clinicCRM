import { useQuery } from "@tanstack/react-query";
import { subscriptionsService } from "@/shared/api/subscriptions/subscriptions.service";

export function useClinicSubscriptions(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-subscriptions", clinicId],
    queryFn: () => subscriptionsService.getForClinic(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}
