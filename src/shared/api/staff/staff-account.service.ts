import { supabase } from "@/shared/lib/supabase";

import type { StaffAccount } from "@/shared/types/auth";

export interface IStaffAccountService {
  getCurrent(authUserId: string): Promise<StaffAccount>;
}

class StaffAccountService implements IStaffAccountService {
  async getCurrent(authUserId: string): Promise<StaffAccount> {
    const { data, error } = await supabase
      .from("staff_accounts")
      .select("*")
      .eq("auth_user_id", authUserId)
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      authUserId: data.auth_user_id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      isActive: data.is_active,
      lastLogin: data.last_login,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const staffAccountService = new StaffAccountService();