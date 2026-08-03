import { supabase } from "@/shared/lib/supabase";

export interface ClinicProcedure {
  procedureId: string;
  code: string;
  categoryCode: string | null;
  nameAz: string;
  nameRu: string;
  nameEn: string;
  basePrice: number;
  pricingType: string;
  patientPrice: number;
  coveredPrice: number;
  label: string | null;
}

export interface ClinicProceduresResponse {
  plan: string | null;
  hasSubscription: boolean;
  procedures: ClinicProcedure[];
}

export interface InvoiceItem {
  procedureId: string;
  description?: string | null;
  toothNumbers?: number[];
  manualDiscountPct?: number | null;
  manualDiscountAmount?: number | null;
  manualDiscountReason?: string | null;
}

export interface CreateInvoiceInput {
  doctorId: string;
  userId: string;
  clinicId: string;
  appointmentId: string | null;
  notes?: string | null;
  items: InvoiceItem[];
}

export interface CreatedInvoice {
  id: string;
  totalAmount: number;
  coveredAmount: number;
  patientAmount: number;
}

class InvoiceService {
  async getClinicProcedures(
    clinicId: string,
    userId: string
  ): Promise<ClinicProceduresResponse> {
    const { data, error } = await supabase.functions.invoke(
      "get-clinic-procedures",
      { body: { clinic_id: clinicId, user_id: userId } }
    );

    if (error) throw error;
    if (!data?.success)
      throw new Error(data?.error ?? "Failed to load procedures");

    return {
      plan: data.plan ?? null,
      hasSubscription: data.has_subscription ?? false,
      procedures: (data.procedures ?? []).map(
        (p: {
          procedure_id: string;
          code: string;
          category_code?: string;
          name_az: string;
          name_ru: string;
          name_en: string;
          base_price: number;
          pricing_type: string;
          patient_price: number;
          covered_price: number;
          label?: string;
        }) => ({
          procedureId: p.procedure_id,
          code: p.code,
          categoryCode: p.category_code ?? null,
          nameAz: p.name_az,
          nameRu: p.name_ru,
          nameEn: p.name_en,
          basePrice: p.base_price,
          pricingType: p.pricing_type,
          patientPrice: p.patient_price,
          coveredPrice: p.covered_price,
          label: p.label ?? null,
        })
      ),
    };
  }

  /** Есть ли у приёма хотя бы один выставленный счёт (для блокировки завершения приёма без счёта) */
  async hasInvoice(appointmentId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("appointment_id", appointmentId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async create(input: CreateInvoiceInput): Promise<CreatedInvoice> {
    const { data, error } = await supabase.functions.invoke("invoice-create", {
      body: {
        doctor_id: input.doctorId,
        actor_id: input.doctorId,
        user_id: input.userId,
        clinic_id: input.clinicId,
        appointment_id: input.appointmentId,
        notes: input.notes ?? null,
        items: input.items.map((item) => ({
          procedure_id: item.procedureId,
          description: item.description ?? null,
          tooth_numbers: item.toothNumbers ?? [],
          manual_discount_pct: item.manualDiscountPct ?? null,
          manual_discount_amount: item.manualDiscountAmount ?? null,
          manual_discount_reason: item.manualDiscountReason ?? null,
        })),
      },
    });

    if (error) throw error;
    if (!data?.success)
      throw new Error(data?.error ?? "Failed to create invoice");

    return {
      id: data.invoice.id,
      totalAmount: data.invoice.total_amount,
      coveredAmount: data.invoice.covered_amount,
      patientAmount: data.invoice.patient_amount,
    };
  }
}

export const invoiceService = new InvoiceService();