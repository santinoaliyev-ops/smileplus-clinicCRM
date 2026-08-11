import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bankService,
  type CreateBankAccountInput,
  type CreateBankTransactionInput,
} from "@/shared/api/accounting/bank.service";

export function useBankAccounts(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["bank-accounts", clinicId],
    queryFn: () => bankService.listAccounts(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}

export function useCreateBankAccount(clinicId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBankAccountInput) => bankService.createAccount(clinicId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", clinicId] });
    },
  });
}

export function useBankTransactions(bankAccountId: string | undefined) {
  return useQuery({
    queryKey: ["bank-transactions", bankAccountId],
    queryFn: () => bankService.listTransactions(bankAccountId!),
    enabled: !!bankAccountId,
    staleTime: 30_000,
  });
}

export function useCreateBankTransaction(bankAccountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBankTransactionInput) => bankService.createTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions", bankAccountId] });
    },
  });
}

export function useDeleteBankTransaction(bankAccountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bankService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions", bankAccountId] });
    },
  });
}

export function useMatchBankTransaction(bankAccountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentId, expenseId }: { id: string; paymentId?: string; expenseId?: string }) =>
      paymentId ? bankService.matchToPayment(id, paymentId) : bankService.matchToExpense(id, expenseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions", bankAccountId] });
    },
  });
}

export function useUnmatchBankTransaction(bankAccountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bankService.unmatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions", bankAccountId] });
    },
  });
}
