import { supabase } from "@/shared/lib/supabase";

export type SubscriptionPlan = "none" | "basic" | "standard" | "premium";
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ["none", "basic", "standard", "premium"];

export interface AdminPlanPricing {
  clinicPrice: number | null;
  isEnabled: boolean;
}

export interface AdminCatalogProcedure {
  procedureId: string;
  code: string;
  nameAz: string;
  nameRu: string;
  nameEn: string;
  requiresTooth: boolean;
  defaultPrice: number | null;
  pricing: Partial<Record<SubscriptionPlan, AdminPlanPricing>>;
}

function slugify(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-ZА-Я0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

class ClinicProceduresAdminService {
  /** Услуги отрасли (глобальный шаблон) + переопределения текущей клиники по каждому плану подписки */
  async listForSpecialty(clinicId: string, specialtyId: string): Promise<AdminCatalogProcedure[]> {
    const { data: catalog, error } = await supabase
      .from("procedure_catalog")
      .select("id, code, name_az, name_ru, name_en, requires_tooth, default_price")
      .eq("category_id", specialtyId)
      .eq("is_active", true)
      // общий шаблон (clinic_id is null) + только свои кастомные услуги, не чужих клиник
      .or(`clinic_id.is.null,clinic_id.eq.${clinicId}`)
      .order("name_ru");
    if (error) throw error;

    const procedureIds = (catalog ?? []).map((c) => c.id);
    let pricingRows: {
      procedure_id: string;
      plan: SubscriptionPlan;
      clinic_price: number | null;
      is_enabled: boolean;
    }[] = [];

    if (procedureIds.length > 0) {
      const { data, error: pricingError } = await supabase
        .from("clinic_procedure_pricing")
        .select("procedure_id, plan, clinic_price, is_enabled")
        .eq("clinic_id", clinicId)
        .in("procedure_id", procedureIds);
      if (pricingError) throw pricingError;
      pricingRows = data ?? [];
    }

    return (catalog ?? []).map((c) => {
      const pricing: AdminCatalogProcedure["pricing"] = {};
      for (const row of pricingRows) {
        if (row.procedure_id !== c.id) continue;
        pricing[row.plan] = { clinicPrice: row.clinic_price, isEnabled: row.is_enabled };
      }
      return {
        procedureId: c.id,
        code: c.code,
        nameAz: c.name_az,
        nameRu: c.name_ru,
        nameEn: c.name_en,
        requiresTooth: c.requires_tooth,
        defaultPrice: c.default_price,
        pricing,
      };
    });
  }

  /**
   * Директор меняет цену/включает-выключает услугу для клиники на конкретном плане подписки.
   * Атомарный upsert по (clinic_id, procedure_id, plan) — важно, потому что чекбокс "включена"
   * и поле цены сохраняются independent-вызовами (см. PlanCell), и select-then-insert/update
   * гонки друг с другом ловил 409 (unique violation) при почти одновременных вызовах.
   */
  async setPricing(
    clinicId: string,
    procedureId: string,
    plan: SubscriptionPlan,
    input: { clinicPrice: number; isEnabled: boolean }
  ): Promise<void> {
    const { error } = await supabase.from("clinic_procedure_pricing").upsert(
      {
        clinic_id: clinicId,
        procedure_id: procedureId,
        plan,
        clinic_price: input.clinicPrice,
        is_enabled: input.isEnabled,
        pricing_type: "full",
      },
      { onConflict: "clinic_id,procedure_id,plan" }
    );
    if (error) throw error;
  }

  /** Директор добавляет свою услугу в отрасль — сразу включена для плана "без подписки" в его клинике */
  async createCustomProcedure(input: {
    clinicId: string;
    specialtyId: string;
    nameAz: string;
    nameRu: string;
    nameEn: string;
    requiresTooth: boolean;
    price: number;
  }): Promise<string> {
    const code = `${slugify(input.nameEn || input.nameRu)}_${Date.now().toString(36).toUpperCase()}`;

    const { data: created, error } = await supabase
      .from("procedure_catalog")
      .insert({
        category_id: input.specialtyId,
        clinic_id: input.clinicId,
        code,
        name_az: input.nameAz,
        name_ru: input.nameRu,
        name_en: input.nameEn,
        requires_tooth: input.requiresTooth,
        default_price: input.price,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: pricingError } = await supabase.from("clinic_procedure_pricing").insert({
      clinic_id: input.clinicId,
      procedure_id: created.id,
      plan: "none",
      clinic_price: input.price,
      is_enabled: true,
      pricing_type: "full",
    });
    if (pricingError) throw pricingError;

    return created.id;
  }
}

export const clinicProceduresAdminService = new ClinicProceduresAdminService();
