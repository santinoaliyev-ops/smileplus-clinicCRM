import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  expensesService,
  type CreateExpenseInput,
  type RemoveExpenseContext,
} from "@/shared/api/expenses/expenses.service";

export function useExpenses(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["expenses", clinicId],
    queryFn: () => expensesService.listForClinic(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}

export function useCreateExpense(clinicId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateExpenseInput, "clinicId">) =>
      expensesService.create({ ...input, clinicId: clinicId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", clinicId] }),
  });
}

export function useDeleteExpense(clinicId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...ctx }: { id: string } & Omit<RemoveExpenseContext, "clinicId">) =>
      expensesService.remove(id, { ...ctx, clinicId: clinicId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", clinicId] }),
  });
}

export function useApproveExpense(clinicId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      expensesService.approve(id, clinicId!, approvedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", clinicId] }),
  });
}

export function useRejectExpense(clinicId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approvedBy, reason }: { id: string; approvedBy: string; reason: string }) =>
      expensesService.reject(id, clinicId!, approvedBy, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", clinicId] }),
  });
}
