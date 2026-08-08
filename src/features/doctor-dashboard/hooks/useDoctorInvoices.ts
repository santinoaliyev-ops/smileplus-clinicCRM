import { useQuery } from "@tanstack/react-query";
import { cashierService } from "@/shared/api/cashier/cashier.service";

export function useDoctorInvoices(clinicId: string | undefined, doctorId: string | undefined) {
  return useQuery({
    queryKey: ["doctor-invoices", clinicId, doctorId],
    queryFn: () => cashierService.listInvoices(clinicId!, doctorId!),
    enabled: !!clinicId && !!doctorId,
    refetchInterval: 60_000,
  });
}
