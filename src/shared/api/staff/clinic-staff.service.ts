import { supabase } from "@/shared/lib/supabase";
import { isUserRole, type ClinicStaff } from "@/shared/types/auth";

const SELECT = `
  id,
  clinic_id,
  staff_account_id,
  role,
  is_active,
  clinics (
    id,
    name
  )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(item: any): ClinicStaff {
  if (!isUserRole(item.role)) {
    throw new Error(`Unknown staff role: ${item.role}`);
  }

  return {
    id: item.id,
    clinicId: item.clinic_id,
    staffAccountId: item.staff_account_id,
    role: item.role,
    isActive: item.is_active,
    clinic: {
      id: item.clinics?.id ?? item.clinic_id,
      name: item.clinics?.name ?? "",
    },
  };
}

class ClinicStaffService {
  async getByStaffAccount(staffAccountId: string): Promise<ClinicStaff[]> {
    const { data, error } = await supabase
      .from("clinic_staff")
      .select(SELECT)
      .eq("staff_account_id", staffAccountId)
      .eq("is_active", true);

    if (error) throw error;
    return data.map(mapRow);
  }

  async getByClinic(clinicId: string): Promise<ClinicStaff[]> {
    const { data, error } = await supabase
      .from("clinic_staff")
      .select(SELECT)
      .eq("clinic_id", clinicId)
      .eq("is_active", true);

    if (error) throw error;
    return data.map(mapRow);
  }
}

export const clinicStaffService = new ClinicStaffService();