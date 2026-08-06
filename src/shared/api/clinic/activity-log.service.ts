import { supabase } from "@/shared/lib/supabase";

export interface ActivityLogEntry {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string | null;
  message: string;
  createdAt: string;
}

class ActivityLogService {
  async getRecent(clinicId: string, limit = 20): Promise<ActivityLogEntry[]> {
    const { data, error } = await supabase
      .from("clinic_activity_log")
      .select("id, event_type, entity_type, entity_id, message, created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((r) => ({
      id: r.id,
      eventType: r.event_type,
      entityType: r.entity_type,
      entityId: r.entity_id,
      message: r.message,
      createdAt: r.created_at,
    }));
  }
}

export const activityLogService = new ActivityLogService();
