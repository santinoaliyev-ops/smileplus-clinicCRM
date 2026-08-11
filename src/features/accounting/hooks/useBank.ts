import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bankService,
  type CreateBankAccountInput,
  type CreateBankTransactionInput,
  type DeleteBankTransactionContext,
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
    mutationFn: ({ actorId, input }: { actorId: string; input: CreateBankAccountInput }) =>
      bankService.createAccount(clinicId!, actorId, input),
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
    mutationFn: ({ id, ...ctx }: { id: string } & DeleteBankTransactionContext) =>
      bankService.deleteTransaction(id, ctx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions", bankAccountId] });
    },
  });
}

export function useMatchBankTransaction(bankAccountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      paymentId,
      expenseId,
      clinicId,
      actorId,
    }: {
      id: string;
      paymentId?: string;
      expenseId?: string;
      clinicId: string;
      actorId: string;
    }) =>
      paymentId
        ? bankService.matchToPayment(id, paymentId, clinicId, actorId)
        : bankService.matchToExpense(id, expenseId!, clinicId, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions", bankAccountId] });
    },
  });
}

export function useUnmatchBankTransaction(bankAccountId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clinicId, actorId }: { id: string; clinicId: string; actorId: string }) =>
      bankService.unmatch(id, clinicId, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions", bankAccountId] });
    },
  });
}
