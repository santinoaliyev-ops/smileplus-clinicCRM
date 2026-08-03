import { supabase } from "@/shared/lib/supabase";

export interface LastVisit {
  date: string;
  doctorName: string | null;
  procedureType: string | null;
}

export interface PatientSubscriptionInfo {
  plan: string;
  coverageLimit: number;
  coverageUsed: number;
}

export interface PatientSummary {
  isPrimary: boolean;
  lastVisit: LastVisit | null;
  subscription: PatientSubscriptionInfo | null;
}

class PatientSummaryService {
  async get(patientId: string): Promise<PatientSummary> {
    const { data: pastAppts, error: apptError } = await supabase
      .from("appointments")
      .select(
        "id, scheduled_at, procedure_type, doctors ( clinic_staff ( full_name ) )"
      )
      .eq("user_id", patientId)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false })
      .limit(1);

    if (apptError) throw apptError;

    const isPrimary = !pastAppts || pastAppts.length === 0;
    let lastVisit: LastVisit | null = null;

    if (pastAppts && pastAppts.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = pastAppts[0] as any;
      lastVisit = {
        date: v.scheduled_at,
        doctorName: v.doctors?.clinic_staff?.full_name ?? null,
        procedureType: v.procedure_type,
      };
    }

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("plan, coverage_limit, coverage_used")
      .eq("user_id", patientId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) throw subError;

    return {
      isPrimary,
      lastVisit,
      subscription: sub
        ? {
            plan: sub.plan,
            coverageLimit: sub.coverage_limit,
            coverageUsed: sub.coverage_used,
          }
        : null,
    };
  }
}

export const patientSummaryService = new PatientSummaryService();