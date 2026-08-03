import { clinicStaffService } from "./clinic-staff.service";
import { staffAccountService } from "./staff-account.service";

import type { CurrentUser } from "@/shared/types/auth";

export interface IStaffService {
  getCurrentStaff(authUserId: string): Promise<CurrentUser>;
}

class StaffService implements IStaffService {
  async getCurrentStaff(authUserId: string): Promise<CurrentUser> {
    const account = await staffAccountService.getCurrent(authUserId);

    const clinics = await clinicStaffService.getByStaffAccount(account.id);

    return {
      account,
      clinics,
    };
  }
}

export const staffService = new StaffService();