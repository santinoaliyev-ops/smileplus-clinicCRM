import { supabase } from "@/shared/lib/supabase";
import type { AppointmentStatus } from "@/shared/api/appointments/appointments.service";

export interface ScheduleDoctor {
  id: string;
  fullName: string;
  specialization: string;
}

export interface ClinicDoctorProfile {
  id: string;
  fullName: string;
  specialization: string;
  avatarUrl: string | null;
  experienceYears: number;
  rating: number;
  ratingCount: number;
  isAccepting: boolean;
  isVerified: boolean;
}

export interface ScheduleAppointment {
  id: string;
  doctorId: string;
  doctorName: string | null;
  scheduledAt: string;
  durationMin: number;
  status: AppointmentStatus;
  notes: string | null;
  arrivedAt: string | null;
  patient: {
    id: string;
    fullName: string | null;
    phone: string;
  };
}

class ScheduleService {
  /** Врачи клиники для колонок сетки */
  async getClinicDoctors(clinicId: string): Promise<ScheduleDoctor[]> {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, specialization, clinic_staff ( full_name )")
      .eq("clinic_id", clinicId);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((d: any) => ({
      id: d.id,
      fullName: d.clinic_staff?.full_name ?? "—",
      specialization: d.specialization,
    }));
  }

  /** Врачи клиники с расширенным профилем (раздел «Врачи» у администратора) */
  async getClinicDoctorsDetailed(clinicId: string): Promise<ClinicDoctorProfile[]> {
    const { data, error } = await supabase
      .from("doctors")
      .select(
        "id, specialization, avatar_url, experience_years, rating, rating_count, is_accepting, is_verified, clinic_staff ( full_name )"
      )
      .eq("clinic_id", clinicId);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((d: any) => ({
      id: d.id,
      fullName: d.clinic_staff?.full_name ?? "—",
      specialization: d.specialization,
      avatarUrl: d.avatar_url ?? null,
      experienceYears: d.experience_years ?? 0,
      rating: Number(d.rating) || 0,
      ratingCount: d.rating_count ?? 0,
      isAccepting: d.is_accepting ?? true,
      isVerified: d.is_verified ?? false,
    }));
  }

  /** Все приёмы клиники за день */
  async getClinicDay(
    clinicId: string,
    day: Date
  ): Promise<ScheduleAppointment[]> {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `id, doctor_id, scheduled_at, duration_min, status, notes, arrived_at,
        users ( id, full_name, phone, birth_date ),
        doctors ( clinic_staff ( full_name ) )`
      )
      .eq("clinic_id", clinicId)
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at");

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((a: any) => ({
      id: a.id,
      doctorId: a.doctor_id,
      scheduledAt: a.scheduled_at,
      doctorName: (a.doctors as { clinic_staff?: { full_name?: string } } | null)
        ?.clinic_staff?.full_name ?? null,
      durationMin: a.duration_min,
      status: a.status,
      notes: a.notes,
      arrivedAt: a.arrived_at,
      patient: {
        id: a.users?.id,
        fullName: a.users?.full_name,
        phone: a.users?.phone,
      },
    }));
  }

  async confirm(id: string): Promise<void> {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  async cancel(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancel_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async createAppointment(input: {
    clinicId: string;
    doctorId: string;
    patientId: string;
    scheduledAt: string; // ISO
    durationMin: number;
    procedureType: string;
    notes?: string;
  }): Promise<void> {
    const { error } = await supabase.from("appointments").insert({
      clinic_id: input.clinicId,
      doctor_id: input.doctorId,
      user_id: input.patientId,
      scheduled_at: input.scheduledAt,
      duration_min: input.durationMin,
      procedure_type: input.procedureType,
      notes: input.notes ?? null,
      status: "confirmed", // запись администратором = сразу подтверждена (согласовано)
      confirmed_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === "23P01") {
        throw new Error("SLOT_TAKEN"); // exclusion constraint
      }
      throw error;
    }
  }
}

export const scheduleService = new ScheduleService();