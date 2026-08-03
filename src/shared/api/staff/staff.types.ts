import type {
  StaffAccount,
  ClinicStaff,
} from "@/shared/types/auth";

/**
 * Ответ после загрузки сотрудника.
 */
export interface CurrentStaffResponse {
  account: StaffAccount;

  clinics: ClinicStaff[];
}

/**
 * Данные для создания учетной записи сотрудника.
 */
export interface CreateStaffAccountDto {
  authUserId: string;

  fullName: string;

  email: string;

  phone?: string | null;
}

/**
 * Назначение сотрудника в клинику.
 */
export interface AssignClinicDto {
  staffAccountId: string;

  clinicId: string;

  role: string;
}