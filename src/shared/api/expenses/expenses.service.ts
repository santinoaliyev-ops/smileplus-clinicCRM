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
export type ExpenseStatus = "pending" | "approved" | "rejected";

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
  status: ExpenseStatus;
  rejectionReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface CreateExpenseInput {
  clinicId: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  vendor?: string | null;
  paymentMethod?: ExpensePaymentMethod | null;
  comment?: string | null;
  status: "pending" | "approved";
}

const num = (v: unknown): number =>
  typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) || 0 : 0;

class ExpensesService {
  async listForClinic(clinicId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select(
        "id, clinic_id, category, amount, expense_date, vendor, payment_method, comment, created_at, status, rejection_reason, approved_by, approved_at"
      )
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
      status: r.status,
      rejectionReason: r.rejection_reason,
      approvedBy: r.approved_by,
      approvedAt: r.approved_at,
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
      status: input.status,
    });
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  }

  async approve(id: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .update({ status: "approved", approved_by: approvedBy, approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  async reject(id: string, approvedBy: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .update({
        status: "rejected",
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", id);
    if (error) throw error;
  }
}

export const expensesService = new ExpensesService();
