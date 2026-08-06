import { supabase } from "@/shared/lib/supabase";

export type PromotionDiscountType = "percent" | "fixed";

export interface Promotion {
  id: string;
  clinicId: string;
  procedureId: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
}

class PromotionsService {
  async listForClinic(clinicId: string): Promise<Promotion[]> {
    const { data, error } = await supabase
      .from("promotions")
      .select("id, clinic_id, procedure_id, discount_type, discount_value, starts_at, ends_at, is_active")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((p) => ({
      id: p.id,
      clinicId: p.clinic_id,
      procedureId: p.procedure_id,
      discountType: p.discount_type as PromotionDiscountType,
      discountValue: Number(p.discount_value),
      startsAt: p.starts_at,
      endsAt: p.ends_at,
      isActive: p.is_active,
    }));
  }

  async create(input: {
    clinicId: string;
    procedureId: string;
    discountType: PromotionDiscountType;
    discountValue: number;
    endsAt?: string | null;
  }): Promise<void> {
    const { error } = await supabase.from("promotions").insert({
      clinic_id: input.clinicId,
      procedure_id: input.procedureId,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      ends_at: input.endsAt ?? null,
    });
    if (error) throw error;
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from("promotions").update({ is_active: isActive }).eq("id", id);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) throw error;
  }
}

export const promotionsService = new PromotionsService();
