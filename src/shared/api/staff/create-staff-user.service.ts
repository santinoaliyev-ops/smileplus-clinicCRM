import { supabase } from "@/shared/lib/supabase";

interface CreateStaffUserDto {
  clinicStaffId: string;
  email: string;
  password: string;
}

interface CreateStaffUserResult {
  success: boolean;
  staffAccountId: string;
  authUserId: string;
}

class CreateStaffUserService {
  async execute(dto: CreateStaffUserDto): Promise<CreateStaffUserResult> {
    const { data, error } = await supabase.functions.invoke(
      "create-staff-user",
      { body: dto }
    );

    if (error) throw error;
    return data as CreateStaffUserResult;
  }
}

export const createStaffUserService = new CreateStaffUserService();