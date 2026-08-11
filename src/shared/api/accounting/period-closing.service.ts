import { supabase } from "@/shared/lib/supabase";
import { auditLogService } from "@/shared/api/accounting/audit-log.service";

export interface ClosedPeriod {
  id: string;
  periodMonth: string;
  closedByName: string | null;
  closedAt: string;
}

class PeriodClosingService {
  async listClosedPeriods(clinicId: string): Promise<ClosedPeriod[]> {
    const { data, error } = await supabase
      .from("closed_periods")
      .select("id, period_month, closed_at, clinic_staff:closed_by(full_name)")
      .eq("clinic_id", clinicId)
      .order("period_month", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => ({
      id: r.id,
      periodMonth: r.period_month,
      closedByName: r.clinic_staff?.full_name ?? null,
      closedAt: r.closed_at,
    }));
  }

  async closePeriod(clinicId: string, periodMonth: string, closedBy: string): Promise<void> {
    const { error } = await supabase.from("closed_periods").insert({
      clinic_id: clinicId,
      period_month: periodMonth,
      closed_by: closedBy,
    });
    if (error) throw error;

    await auditLogService.log(clinicId, closedBy, "closed_period", null, "close", { periodMonth });
  }
}

export const periodClosingService = new PeriodClosingService();
