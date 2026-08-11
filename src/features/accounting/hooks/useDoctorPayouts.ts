import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  doctorPayoutsService,
  type UpdateDoctorPayoutRateInput,
} from "@/shared/api/accounting/doctor-payouts.service";

export function useDoctorPayoutRates(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["doctor-payout-rates", clinicId],
    queryFn: () => doctorPayoutsService.listRates(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}

export function useUpdateDoctorPayoutRate(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, input }: { doctorId: string; input: UpdateDoctorPayoutRateInput }) =>
      doctorPayoutsService.updateRate(doctorId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-payout-rates", clinicId] });
    },
  });
}
