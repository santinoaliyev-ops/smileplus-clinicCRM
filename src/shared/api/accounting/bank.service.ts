import { supabase } from "@/shared/lib/supabase";

export type BankTransactionDirection = "in" | "out";

export interface BankAccount {
  id: string;
  clinicId: string;
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  currency: string;
  openingBalance: number;
  isActive: boolean;
}

export interface CreateBankAccountInput {
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  currency: string;
  openingBalance: number;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  direction: BankTransactionDirection;
  amount: number;
  transactionDate: string;
  description: string | null;
  matchedPaymentId: string | null;
  matchedExpenseId: string | null;
}

export interface CreateBankTransactionInput {
  bankAccountId: string;
  clinicId: string;
  direction: BankTransactionDirection;
  amount: number;
  transactionDate: string;
  description: string | null;
}

class BankService {
  async listAccounts(clinicId: string): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("id, clinic_id, name, bank_name, account_number, currency, opening_balance, is_active")
      .eq("clinic_id", clinicId)
      .order("name");

    if (error) throw error;

    return (data ?? []).map((a) => ({
      id: a.id,
      clinicId: a.clinic_id,
      name: a.name,
      bankName: a.bank_name,
      accountNumber: a.account_number,
      currency: a.currency,
      openingBalance: Number(a.opening_balance),
      isActive: a.is_active,
    }));
  }

  async createAccount(clinicId: string, input: CreateBankAccountInput): Promise<void> {
    const { error } = await supabase.from("bank_accounts").insert({
      clinic_id: clinicId,
      name: input.name,
      bank_name: input.bankName,
      account_number: input.accountNumber,
      currency: input.currency,
      opening_balance: input.openingBalance,
    });
    if (error) throw error;
  }

  async listTransactions(bankAccountId: string): Promise<BankTransaction[]> {
    const { data, error } = await supabase
      .from("bank_transactions")
      .select("id, bank_account_id, direction, amount, transaction_date, description, matched_payment_id, matched_expense_id")
      .eq("bank_account_id", bankAccountId)
      .order("transaction_date", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((t) => ({
      id: t.id,
      bankAccountId: t.bank_account_id,
      direction: t.direction as BankTransactionDirection,
      amount: Number(t.amount),
      transactionDate: t.transaction_date,
      description: t.description,
      matchedPaymentId: t.matched_payment_id,
      matchedExpenseId: t.matched_expense_id,
    }));
  }

  async createTransaction(input: CreateBankTransactionInput): Promise<void> {
    const { error } = await supabase.from("bank_transactions").insert({
      bank_account_id: input.bankAccountId,
      clinic_id: input.clinicId,
      direction: input.direction,
      amount: input.amount,
      transaction_date: input.transactionDate,
      description: input.description,
    });
    if (error) throw error;
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from("bank_transactions").delete().eq("id", id);
    if (error) throw error;
  }

  async matchToPayment(id: string, paymentId: string): Promise<void> {
    const { error } = await supabase
      .from("bank_transactions")
      .update({ matched_payment_id: paymentId, matched_expense_id: null })
      .eq("id", id);
    if (error) throw error;
  }

  async matchToExpense(id: string, expenseId: string): Promise<void> {
    const { error } = await supabase
      .from("bank_transactions")
      .update({ matched_expense_id: expenseId, matched_payment_id: null })
      .eq("id", id);
    if (error) throw error;
  }

  async unmatch(id: string): Promise<void> {
    const { error } = await supabase
      .from("bank_transactions")
      .update({ matched_payment_id: null, matched_expense_id: null })
      .eq("id", id);
    if (error) throw error;
  }
}

export const bankService = new BankService();
