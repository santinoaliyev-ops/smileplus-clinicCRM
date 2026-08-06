import { supabase } from "@/shared/lib/supabase";

export interface Specialty {
  id: string;
  code: string;
  nameAz: string;
  nameRu: string;
  nameEn: string;
  sortOrder: number | null;
}

class SpecialtiesService {
  async list(): Promise<Specialty[]> {
    const { data, error } = await supabase
      .from("procedure_categories")
      .select("id, code, name_az, name_ru, name_en, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw error;

    return (data ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      nameAz: c.name_az,
      nameRu: c.name_ru,
      nameEn: c.name_en,
      sortOrder: c.sort_order,
    }));
  }
}

export const specialtiesService = new SpecialtiesService();
