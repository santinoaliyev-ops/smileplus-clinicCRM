import { supabase } from "@/shared/lib/supabase";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface DoctorAppointment {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: AppointmentStatus;
  procedureType: string;
  notes: string | null;
  arrivedAt: string | null;
  patient: {
    id: string;
    fullName: string | null;
    phone: string;
    birthDate: string | null;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(item: any): DoctorAppointment {
  return {
    id: item.id,
    scheduledAt: item.scheduled_at,
    durationMin: item.duration_min,
    status: item.status,
    procedureType: item.procedure_type,
    notes: item.notes,
    arrivedAt: item.arrived_at,
    patient: {
      id: item.users?.id,
      fullName: item.users?.full_name,
      phone: item.users?.phone,
      birthDate: item.users?.birth_date,
    },
  };
}

const SELECT = `
  id, scheduled_at, duration_min, status, procedure_type, notes, arrived_at,
  users ( id, full_name, phone, birth_date )
`;

class AppointmentsService {
  /** Приёмы врача за день */
  async getDoctorDay(doctorId: string, day: Date): Promise<DoctorAppointment[]> {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("appointments")
      .select(SELECT)
      .eq("doctor_id", doctorId)
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return data.map(mapRow);
  }

  async setStatus(id: string, status: AppointmentStatus): Promise<void> {
    const patch: Record<string, unknown> = { status };
    if (status === "in_progress") patch.confirmed_at = new Date().toISOString();
    if (status === "completed") patch.completed_at = new Date().toISOString();
    if (status === "cancelled") patch.cancelled_at = new Date().toISOString();

    const { error } = await supabase
      .from("appointments")
      .update(patch)
      .eq("id", id);

    if (error) throw error;
  }

  async markArrived(id: string): Promise<void> {
    const { error } = await supabase
      .from("appointments")
      .update({ arrived_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }

  /** Был ли у пациента завершённый приём раньше (первичный/повторный) */
  async hasPastVisits(patientId: string, before: string): Promise<boolean> {
    const { count, error } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", patientId)
      .eq("status", "completed")
      .lt("scheduled_at", before);

    if (error) throw error;
    return (count ?? 0) > 0;
  }
}

export const appointmentsService = new AppointmentsService();