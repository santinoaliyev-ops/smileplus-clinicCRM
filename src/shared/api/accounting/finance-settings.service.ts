import { supabase } from "@/shared/lib/supabase";
import { auditLogService } from "@/shared/api/accounting/audit-log.service";

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

  async setThreshold(clinicId: string, value: number | null, actorId: string): Promise<void> {
    const { error } = await supabase
      .from("clinic_finance_settings")
      .upsert({ clinic_id: clinicId, expense_approval_threshold: value }, { onConflict: "clinic_id" });
    if (error) throw error;

    await auditLogService.log(clinicId, actorId, "finance_settings", null, "update", {
      expenseApprovalThreshold: value,
    });
  }
}

export const financeSettingsService = new FinanceSettingsService();
