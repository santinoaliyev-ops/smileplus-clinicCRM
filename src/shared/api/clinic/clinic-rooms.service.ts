import { supabase } from "@/shared/lib/supabase";

export interface ClinicRoom {
  id: string;
  name: string;
  isActive: boolean;
  doctorId: string | null;
}

class ClinicRoomsService {
  async listForClinic(clinicId: string): Promise<ClinicRoom[]> {
    const { data, error } = await supabase
      .from("clinic_rooms")
      .select("id, name, is_active, doctor_id")
      .eq("clinic_id", clinicId)
      .order("name");

    if (error) throw error;

    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      isActive: r.is_active,
      doctorId: r.doctor_id,
    }));
  }

  async create(clinicId: string, name: string): Promise<void> {
    const { error } = await supabase.from("clinic_rooms").insert({ clinic_id: clinicId, name });
    if (error) throw error;
  }

  /**
   * Закрепить кабинет за врачом (roomId=null — просто снять закрепление).
   * Сначала снимает врача с любого текущего кабинета — у врача не может быть
   * двух кабинетов одновременно (unique-индекс по doctor_id).
   */
  async assignDoctor(clinicId: string, doctorId: string, roomId: string | null): Promise<void> {
    const { error: clearError } = await supabase
      .from("clinic_rooms")
      .update({ doctor_id: null })
      .eq("clinic_id", clinicId)
      .eq("doctor_id", doctorId);
    if (clearError) throw clearError;

    if (roomId) {
      const { error } = await supabase.from("clinic_rooms").update({ doctor_id: doctorId }).eq("id", roomId);
      if (error) throw error;
    }
  }
}

export const clinicRoomsService = new ClinicRoomsService();
