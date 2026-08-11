import { useQuery } from "@tanstack/react-query";
import { cashierService } from "@/shared/api/cashier/cashier.service";

/** Все счета клиники (не привязано к врачу) — общий источник для дашборда/списка/отчётов бухгалтера */
export function useAccountingInvoices(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["accounting-invoices", clinicId],
    queryFn: () => cashierService.listInvoices(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}
