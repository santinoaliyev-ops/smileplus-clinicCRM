import { supabase } from "@/shared/lib/supabase";
import { auditLogService } from "@/shared/api/accounting/audit-log.service";

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
  createdBy: string;
}

export interface RemoveExpenseContext {
  clinicId: string;
  actorId: string;
  amount: number;
  category: ExpenseCategory;
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
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        clinic_id: input.clinicId,
        category: input.category,
        amount: input.amount,
        expense_date: input.expenseDate,
        vendor: input.vendor ?? null,
        payment_method: input.paymentMethod ?? null,
        comment: input.comment ?? null,
        status: input.status,
        created_by: input.createdBy,
      })
      .select("id")
      .single();
    if (error) throw error;

    await auditLogService.log(input.clinicId, input.createdBy, "expense", data.id, "create", {
      category: input.category,
      amount: input.amount,
    });
  }

  async remove(id: string, ctx: RemoveExpenseContext): Promise<void> {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;

    await auditLogService.log(ctx.clinicId, ctx.actorId, "expense", id, "delete", {
      category: ctx.category,
      amount: ctx.amount,
    });
  }

  async approve(id: string, clinicId: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .update({ status: "approved", approved_by: approvedBy, approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    await auditLogService.log(clinicId, approvedBy, "expense", id, "approve");
  }

  async reject(id: string, clinicId: string, approvedBy: string, reason: string): Promise<void> {
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

    await auditLogService.log(clinicId, approvedBy, "expense", id, "reject", { reason });
  }
}

export const expensesService = new ExpensesService();
