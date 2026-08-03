import { supabase } from "@/shared/lib/supabase";

export type ExceptionType =
  | "day_off"
  | "vacation"
  | "sick_leave"
  | "holiday"
  | "custom";

export interface ScheduleException {
  id: string;
  doctorId: string;
  clinicId: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
  timeFrom: string | null; // HH:MM:SS
  timeTo: string | null;
  exceptionType: ExceptionType;
  reason: string | null;
  createdAt: string;
}

export interface CreateExceptionInput {
  doctorId: string;
  clinicId: string;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string | null;
  timeTo?: string | null;
  exceptionType: ExceptionType;
  reason?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): ScheduleException {
  return {
    id: r.id,
    doctorId: r.doctor_id,
    clinicId: r.clinic_id,
    dateFrom: r.date_from,
    dateTo: r.date_to,
    timeFrom: r.time_from,
    timeTo: r.time_to,
    exceptionType: r.exception_type,
    reason: r.reason,
    createdAt: r.created_at,
  };
}

class ScheduleExceptionsService {
  async getByDoctor(doctorId: string): Promise<ScheduleException[]> {
    const { data, error } = await supabase
      .from("doctor_schedule_exceptions")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("date_from", { ascending: false });

    if (error) throw error;
    return data.map(mapRow);
  }

  async create(input: CreateExceptionInput): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();

    const { data: account } = await supabase
      .from("staff_accounts")
      .select("id")
      .eq("auth_user_id", auth.user?.id)
      .single();

    const { error } = await supabase.from("doctor_schedule_exceptions").insert({
      doctor_id: input.doctorId,
      clinic_id: input.clinicId,
      date_from: input.dateFrom,
      date_to: input.dateTo,
      time_from: input.timeFrom ?? null,
      time_to: input.timeTo ?? null,
      exception_type: input.exceptionType,
      reason: input.reason ?? null,
      created_by: account?.id ?? null,
    });

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("doctor_schedule_exceptions")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

export const scheduleExceptionsService = new ScheduleExceptionsService();