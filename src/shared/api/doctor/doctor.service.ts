import { supabase } from "@/shared/lib/supabase";

export interface DoctorProfile {
  id: string;
  staffId: string;
  clinicId: string;
  specialization: string;
}

class DoctorService {
  /** Найти профиль врача по clinic_staff.id активной клиники */
  async getByClinicStaffId(clinicStaffId: string): Promise<DoctorProfile | null> {
    const { data, error } = await supabase
      .from("doctors")
      .select("id, staff_id, clinic_id, specialization")
      .eq("staff_id", clinicStaffId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      staffId: data.staff_id,
      clinicId: data.clinic_id,
      specialization: data.specialization,
    };
  }
}

export const doctorService = new DoctorService();