import { supabase } from "@/shared/lib/supabase";

/** Приводит ввод пользователя к каноническому формату +994XXXXXXXXX, в котором хранятся номера. */
function normalizeAzPhone(raw: string): string {
  const digitsPlus = raw.replace(/[^\d+]/g, "");
  const digits = digitsPlus.replace(/^\+/, "");
  if (digits.startsWith("994")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+994${digits.slice(1)}`;
  if (digits.length === 9) return `+994${digits}`;
  return digitsPlus.startsWith("+") ? digitsPlus : `+${digits}`;
}

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

export interface DoctorPatientEntry {
  id: string;
  fullName: string | null;
  phone: string;
  birthDate: string | null;
  finCode: string | null;
}

class PatientsService {
  /** Пациенты, у которых были приёмы у этого врача в этой клинике (для раздела «Медкарты»). */
  async listForDoctor(clinicId: string, doctorId: string): Promise<DoctorPatientEntry[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("users ( id, full_name, phone, birth_date, fin_code )")
      .eq("clinic_id", clinicId)
      .eq("doctor_id", doctorId);

    if (error) throw error;

    const byId = new Map<string, DoctorPatientEntry>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (data ?? []) as any[]) {
      const u = row.users;
      if (!u || byId.has(u.id)) continue;
      byId.set(u.id, {
        id: u.id,
        fullName: u.full_name,
        phone: u.phone,
        birthDate: u.birth_date,
        finCode: u.fin_code ?? null,
      });
    }

    return Array.from(byId.values()).sort((a, b) =>
      (a.fullName ?? a.phone).localeCompare(b.fullName ?? b.phone)
    );
  }

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
      body: { phone: normalizeAzPhone(phone) },
    });

    if (error) {
      console.error("patient-search failed:", error);
      return null;
    }
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