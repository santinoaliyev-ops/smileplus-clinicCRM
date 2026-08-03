import { supabase } from "@/shared/lib/supabase";

export type TreatmentPlanStatus = "draft" | "active" | "completed" | "archived";

export interface TreatmentPlanItem {
  id: string;
  planId: string;
  procedureId: string;
  procedureName: string;
  toothNumbers: number[];
  quantity: number;
  priceSnapshot: number;
  notes: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  title: string | null;
  status: TreatmentPlanStatus;
  notes: string | null;
  createdAt: string;
  items: TreatmentPlanItem[];
}

export interface CreatePlanInput {
  patientId: string;
  doctorId: string;
  clinicId: string;
  title?: string;
  notes?: string;
  items: {
    procedureId: string;
    procedureName: string;
    toothNumbers: number[];
    quantity: number;
    priceSnapshot: number;
    notes?: string;
  }[];
}

const num = (v: unknown): number =>
  typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) || 0 : 0;

class TreatmentPlansService {
  async getByPatient(patientId: string): Promise<TreatmentPlan[]> {
    const { data, error } = await supabase
      .from("treatment_plans")
      .select(`
        id, patient_id, doctor_id, clinic_id, title, status, notes, created_at,
        treatment_plan_items (
          id, plan_id, procedure_id, tooth_numbers, quantity,
          price_snapshot, notes, is_completed, completed_at, sort_order
        )
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((p: any) => ({
      id: p.id,
      patientId: p.patient_id,
      doctorId: p.doctor_id,
      clinicId: p.clinic_id,
      title: p.title ?? null,
      status: p.status,
      notes: p.notes ?? null,
      createdAt: p.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (p.treatment_plan_items ?? []).map((it: any) => ({
        id: it.id,
        planId: it.plan_id,
        procedureId: it.procedure_id,
        procedureName: it.procedure_name ?? "—",
        toothNumbers: it.tooth_numbers ?? [],
        quantity: it.quantity ?? 1,
        priceSnapshot: num(it.price_snapshot),
        notes: it.notes ?? null,
        isCompleted: it.is_completed ?? false,
        completedAt: it.completed_at ?? null,
        sortOrder: it.sort_order ?? 0,
      })),
    }));
  }

  async create(input: CreatePlanInput): Promise<TreatmentPlan> {
    const { data: plan, error: planError } = await supabase
      .from("treatment_plans")
      .insert({
        patient_id: input.patientId,
        doctor_id: input.doctorId,
        clinic_id: input.clinicId,
        title: input.title ?? null,
        notes: input.notes ?? null,
        status: "draft",
      })
      .select("id")
      .single();

    if (planError) throw planError;

    if (input.items.length > 0) {
      const { error: itemsError } = await supabase
        .from("treatment_plan_items")
        .insert(
          input.items.map((item, idx) => ({
            plan_id: plan.id,
            procedure_id: item.procedureId,
            tooth_numbers: item.toothNumbers,
            quantity: item.quantity,
            price_snapshot: item.priceSnapshot,
            notes: item.notes ?? null,
            sort_order: idx,
          }))
        );
      if (itemsError) throw itemsError;
    }

    const plans = await this.getByPatient(input.patientId);
    return plans.find((p) => p.id === plan.id)!;
  }

  async updateStatus(planId: string, status: TreatmentPlanStatus): Promise<void> {
    const { error } = await supabase
      .from("treatment_plans")
      .update({ status })
      .eq("id", planId);
    if (error) throw error;
  }

  async markItemCompleted(itemId: string): Promise<void> {
    const { error } = await supabase
      .from("treatment_plan_items")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", itemId);
    if (error) throw error;
  }
}

export const treatmentPlansService = new TreatmentPlansService();