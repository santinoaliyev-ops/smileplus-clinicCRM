import { supabase } from "@/shared/lib/supabase";

export type FinanceEntityType =
  | "expense"
  | "doctor_payout_rate"
  | "bank_account"
  | "bank_transaction"
  | "finance_settings"
  | "closed_period";

export type FinanceAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "match"
  | "unmatch"
  | "close";

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  entityType: FinanceEntityType;
  entityId: string | null;
  action: FinanceAction;
  details: Record<string, unknown> | null;
  createdAt: string;
}

class AuditLogService {
  async log(
    clinicId: string,
    actorId: string | null,
    entityType: FinanceEntityType,
    entityId: string | null,
    action: FinanceAction,
    details?: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase.from("finance_audit_log").insert({
      clinic_id: clinicId,
      actor_id: actorId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      details: details ?? null,
    });
    if (error) {
      // Аудит-лог не должен блокировать основное действие — оно уже прошло к этому моменту.
      console.error("finance audit log failed:", error);
    }
  }

  async list(clinicId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from("finance_audit_log")
      .select("id, actor_id, entity_type, entity_id, action, details, created_at, clinic_staff:actor_id(full_name)")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => ({
      id: r.id,
      actorId: r.actor_id,
      actorName: r.clinic_staff?.full_name ?? null,
      entityType: r.entity_type,
      entityId: r.entity_id,
      action: r.action,
      details: r.details,
      createdAt: r.created_at,
    }));
  }
}

export const auditLogService = new AuditLogService();
