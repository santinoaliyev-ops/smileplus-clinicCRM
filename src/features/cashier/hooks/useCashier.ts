import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  cashierService,
  type AddPaymentInput,
} from "@/shared/api/cashier/cashier.service";
import { useClinic } from "@/app/providers/clinic";
import { supabase } from "@/shared/lib/supabase";

export function useCashierInvoices() {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["cashier-invoices", clinic?.clinicId],
    queryFn: () => cashierService.listInvoices(clinic!.clinicId),
    enabled: !!clinic,
    refetchInterval: 60_000,
  });
}

/** Realtime: новые инвойсы и платежи появляются сразу */
export function useCashierRealtime() {
  const { clinic } = useClinic();
  const qc = useQueryClient();

  useEffect(() => {
    if (!clinic) return;
    const channel = supabase
      .channel(`cashier-invoices-${clinic.clinicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `clinic_id=eq.${clinic.clinicId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["cashier-invoices"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinic, qc]);
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPaymentInput) => cashierService.addPayment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cashier-invoices"] }),
  });
}