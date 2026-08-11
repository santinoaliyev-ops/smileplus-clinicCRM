import { supabase } from "@/shared/lib/supabase";

export interface CashierInvoiceItem {
  procedureName: string;
  categoryCode: string | null;
  categoryNameAz: string | null;
  categoryNameRu: string | null;
  categoryNameEn: string | null;
  toothNumbers: number[];
  amountTotal: number;
  amountCovered: number;
  amountPatient: number;
  isFree: boolean;
}

export interface CashierPayment {
  amount: number;
  paymentMethod: string;
  paidAt: string;
}

export interface CashierInvoice {
  id: string;
  createdAt: string;
  status: "sent" | "paid";
  patientName: string | null;
  patientPhone: string;
  doctorId: string | null;
  doctorName: string | null;
  totalAmount: number;
  coveredAmount: number;
  patientAmount: number;
  totalPaid: number;
  remaining: number;
  items: CashierInvoiceItem[];
  payments: CashierPayment[];
}

export interface AddPaymentInput {
  clinicId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: "cash" | "card" | "transfer";
  receivedBy: string; // clinic_staff.id
}

export interface AddPaymentResult {
  invoiceStatus: "sent" | "paid";
  totalPaid: number;
  remaining: number;
}

const num = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
};

class CashierService {
  async listInvoices(clinicId: string, doctorId?: string): Promise<CashierInvoice[]> {
    const { data, error } = await supabase.functions.invoke("clinic-invoices", {
      body: {
        action: "list",
        clinic_id: clinicId,
        status: "all",
        ...(doctorId ? { doctor_id: doctorId } : {}),
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error ?? "Failed to load invoices");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.invoices ?? []).map((inv: any) => ({
      id: inv.id,
      createdAt: inv.created_at,
      status: inv.status,
      patientName: inv.patient?.full_name ?? null,
      patientPhone: inv.patient?.phone ?? "",
      doctorId: inv.doctor?.id ?? null,
      doctorName: inv.doctor?.full_name ?? null,
      totalAmount: num(inv.total_amount),
      coveredAmount: num(inv.covered_amount),
      patientAmount: num(inv.patient_amount),
      totalPaid: num(inv.total_paid),
      remaining: num(inv.remaining),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (inv.items ?? []).map((it: any) => ({
        procedureName: it.procedure_name ?? "—",
        categoryCode: it.category_code ?? null,
        categoryNameAz: it.category_name_az ?? null,
        categoryNameRu: it.category_name_ru ?? null,
        categoryNameEn: it.category_name_en ?? null,
        toothNumbers: it.tooth_numbers ?? [],
        amountTotal: num(it.amount_total),
        amountCovered: num(it.amount_covered),
        amountPatient: num(it.amount_patient),
        isFree: it.is_free ?? false,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payments: (inv.payments ?? []).map((p: any) => ({
        amount: num(p.amount),
        paymentMethod: p.payment_method,
        paidAt: p.paid_at,
      })),
    }));
  }

  async addPayment(input: AddPaymentInput): Promise<AddPaymentResult> {
    const { data, error } = await supabase.functions.invoke("clinic-invoices", {
      body: {
        action: "add_payment",
        clinic_id: input.clinicId,
        invoice_id: input.invoiceId,
        amount: input.amount,
        payment_method: input.paymentMethod,
        received_by: input.receivedBy,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error ?? "PAYMENT_FAILED");

    return {
      invoiceStatus: data.invoice_status,
      totalPaid: num(data.total_paid),
      remaining: num(data.remaining),
    };
  }
}

export const cashierService = new CashierService();