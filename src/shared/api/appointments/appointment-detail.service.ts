import { supabase } from "@/shared/lib/supabase";

export interface AppointmentDetail {
  id: string;
  doctorId: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    fullName: string | null;
    phone: string;
    birthDate: string | null;
  };
}

class AppointmentDetailService {
  async getById(id: string): Promise<AppointmentDetail> {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, doctor_id, scheduled_at, duration_min, status, notes, users(id, full_name, phone, birth_date)")
      .eq("id", id)
      .single();

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = (data as any).users;
    return {
      id: data.id,
      doctorId: data.doctor_id,
      scheduledAt: data.scheduled_at,
      durationMin: data.duration_min,
      status: data.status,
      notes: data.notes,
      patient: {
        id: u?.id,
        fullName: u?.full_name ?? null,
        phone: u?.phone,
        birthDate: u?.birth_date ?? null,
      },
    };
  }
}

export const appointmentDetailService = new AppointmentDetailService();