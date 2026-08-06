import { supabase } from "@/shared/lib/supabase";

export interface ClinicSubscriptionEntry {
  id: string;
  patientId: string;
  patientName: string | null;
  patientPhone: string;
  plan: string;
  status: string;
  coverageLimit: number;
  coverageUsed: number;
  startsAt: string | null;
  endsAt: string | null;
}

const num = (v: unknown): number =>
  typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) || 0 : 0;

class SubscriptionsService {
  /**
   * Подписки пациентов этой клиники. Таблица subscriptions не привязана к клинике
   * напрямую (подписка SmilePlus общесетевая) — сначала находим пациентов, у которых
   * были приёмы в этой клинике, затем их подписки.
   */
  async getForClinic(clinicId: string): Promise<ClinicSubscriptionEntry[]> {
    const { data: apptRows, error: apptError } = await supabase
      .from("appointments")
      .select("user_id")
      .eq("clinic_id", clinicId);

    if (apptError) throw apptError;

    const patientIds = Array.from(new Set((apptRows ?? []).map((r) => r.user_id)));
    if (patientIds.length === 0) return [];

    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan, status, coverage_limit, coverage_used, starts_at, ends_at, users:user_id ( full_name, phone )")
      .in("user_id", patientIds)
      .order("ends_at", { ascending: true });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id: row.id,
      patientId: row.user_id,
      patientName: row.users?.full_name ?? null,
      patientPhone: row.users?.phone ?? "",
      plan: row.plan,
      status: row.status,
      coverageLimit: num(row.coverage_limit),
      coverageUsed: num(row.coverage_used),
      startsAt: row.starts_at ?? null,
      endsAt: row.ends_at ?? null,
    }));
  }
}

export const subscriptionsService = new SubscriptionsService();
