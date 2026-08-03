import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  invoiceService,
  type CreateInvoiceInput,
} from "@/shared/api/invoices/invoice.service";

export function useClinicProcedures(
  clinicId: string | undefined,
  patientId: string | undefined
) {
  return useQuery({
    queryKey: ["clinic-procedures", clinicId, patientId],
    queryFn: () => invoiceService.getClinicProcedures(clinicId!, patientId!),
    enabled: !!clinicId && !!patientId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => invoiceService.create(input),
    onSuccess: () => {
      // инвалидируем данные приёмов и инвойсов
      qc.invalidateQueries({ queryKey: ["doctor-day"] });
      qc.invalidateQueries({ queryKey: ["patient-summary"] });
    },
  });
}