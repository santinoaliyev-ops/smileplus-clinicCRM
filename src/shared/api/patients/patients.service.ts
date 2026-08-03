import { supabase } from "@/shared/lib/supabase";

export interface PatientSearchResult {
  id: string;
  fullName: string | null;
  phone: string;
  birthDate: string | null;
}

export interface CreatedPatient {
  id: string;
  phone: string;
  fullName: string | null;
}

class PatientsService {
  async searchByName(query: string): Promise<PatientSearchResult[]> {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, phone, birth_date")
      .ilike("full_name", `%${query}%`)
      .is("deleted_at", null)
      .limit(10);

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((u: any) => ({
      id: u.id,
      fullName: u.full_name,
      phone: u.phone,
      birthDate: u.birth_date,
    }));
  }

  async searchByPhone(phone: string): Promise<PatientSearchResult | null> {
    const { data, error } = await supabase.functions.invoke("patient-search", {
      body: { phone },
    });

    if (error) return null;
    if (!data?.success || !data?.user) return null;

    const u = data.user;
    return {
      id: u.id,
      fullName: u.full_name,
      phone: u.phone,
      birthDate: u.birth_date ?? null,
    };
  }

  async create(input: {
    phone: string;
    fullName?: string;
    birthDate?: string | null;
    finCode?: string;
    email?: string | null;
    createdByRole: string;
    createdById: string;
    clinicId: string;
  }): Promise<CreatedPatient> {
    const { data, error } = await supabase.functions.invoke("create-patient", {
      body: {
        phone: input.phone,
        full_name: input.fullName ?? null,
        birth_date: input.birthDate ?? null,
        fin_code: input.finCode?.toUpperCase() || null,
        email: input.email ?? null,
        created_by_role: input.createdByRole,
        created_by_id: input.createdById,
        clinic_id: input.clinicId,
      },
    });

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.error ?? "UNKNOWN");
    }

    const u = data.user;
    return {
      id: u.id,
      phone: u.phone,
      fullName: u.full_name ?? null,
    };
  }
}

export const patientsService = new PatientsService();