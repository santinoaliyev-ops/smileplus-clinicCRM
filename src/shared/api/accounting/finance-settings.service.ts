import { supabase } from "@/shared/lib/supabase";

class FinanceSettingsService {
  async getThreshold(clinicId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from("clinic_finance_settings")
      .select("expense_approval_threshold")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (error) throw error;
    if (!data || data.expense_approval_threshold === null) return null;
    return Number(data.expense_approval_threshold);
  }

  async setThreshold(clinicId: string, value: number | null): Promise<void> {
    const { error } = await supabase
      .from("clinic_finance_settings")
      .upsert({ clinic_id: clinicId, expense_approval_threshold: value }, { onConflict: "clinic_id" });
    if (error) throw error;
  }
}

export const financeSettingsService = new FinanceSettingsService();
