import { supabase } from "@/shared/lib/supabase";
import { auditLogService } from "@/shared/api/accounting/audit-log.service";

export type PayoutType = "percent" | "fixed";

export interface DoctorPayoutRate {
  doctorId: string;
  payoutType: PayoutType | null;
  payoutPercent: number | null;
  payoutFixedAmount: number | null;
}

export interface UpdateDoctorPayoutRateInput {
  payoutType: PayoutType;
  payoutPercent: number | null;
  payoutFixedAmount: number | null;
}

class DoctorPayoutsService {
  async listRates(clinicId: string): Promise<DoctorPayoutRate[]> {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, payout_type, payout_percent, payout_fixed_amount")
      .eq("clinic_id", clinicId);

    if (error) throw error;

    return (data ?? []).map((d) => ({
      doctorId: d.id,
      payoutType: d.payout_type,
      payoutPercent: d.payout_percent === null ? null : Number(d.payout_percent),
      payoutFixedAmount: d.payout_fixed_amount === null ? null : Number(d.payout_fixed_amount),
    }));
  }

  async updateRate(
    doctorId: string,
    clinicId: string,
    actorId: string,
    input: UpdateDoctorPayoutRateInput
  ): Promise<void> {
    const { error } = await supabase
      .from("doctors")
      .update({
        payout_type: input.payoutType,
        payout_percent: input.payoutType === "percent" ? input.payoutPercent : null,
        payout_fixed_amount: input.payoutType === "fixed" ? input.payoutFixedAmount : null,
      })
      .eq("id", doctorId);

    if (error) throw error;

    await auditLogService.log(clinicId, actorId, "doctor_payout_rate", doctorId, "update", {
      payoutType: input.payoutType,
      rate: input.payoutType === "percent" ? input.payoutPercent : input.payoutFixedAmount,
    });
  }
}

export const doctorPayoutsService = new DoctorPayoutsService();
