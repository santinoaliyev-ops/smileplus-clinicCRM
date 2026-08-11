import { supabase } from "@/shared/lib/supabase";

export type ExpenseCategory =
  | "rent"
  | "salary"
  | "doctor_payout"
  | "supplies"
  | "lab"
  | "equipment"
  | "repair"
  | "utilities"
  | "marketing"
  | "software"
  | "tax"
  | "bank_fee"
  | "other";

export type ExpensePaymentMethod = "cash" | "card" | "transfer";

export interface Expense {
  id: string;
  clinicId: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  vendor: string | null;
  paymentMethod: ExpensePaymentMethod | null;
  comment: string | null;
  createdAt: string;
}

export interface CreateExpenseInput {
  clinicId: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  vendor?: string | null;
  paymentMethod?: ExpensePaymentMethod | null;
  comment?: string | null;
}

const num = (v: unknown): number =>
  typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) || 0 : 0;

class ExpensesService {
  async listForClinic(clinicId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("id, clinic_id, category, amount, expense_date, vendor, payment_method, comment, created_at")
      .eq("clinic_id", clinicId)
      .order("expense_date", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((r) => ({
      id: r.id,
      clinicId: r.clinic_id,
      category: r.category,
      amount: num(r.amount),
      expenseDate: r.expense_date,
      vendor: r.vendor,
      paymentMethod: r.payment_method,
      comment: r.comment,
      createdAt: r.created_at,
    }));
  }

  async create(input: CreateExpenseInput): Promise<void> {
    const { error } = await supabase.from("expenses").insert({
      clinic_id: input.clinicId,
      category: input.category,
      amount: input.amount,
      expense_date: input.expenseDate,
      vendor: input.vendor ?? null,
      payment_method: input.paymentMethod ?? null,
      comment: input.comment ?? null,
    });
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  }
}

export const expensesService = new ExpensesService();
