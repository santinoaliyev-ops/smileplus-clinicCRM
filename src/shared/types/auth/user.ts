import { UserRole } from "./role";

/**
 * Аккаунт сотрудника (staff_accounts).
 * Один человек = одна учётная запись, привязан к auth.users.
 */
export interface StaffAccount {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Назначение сотрудника в клинику (clinic_staff).
 * Один сотрудник может работать в нескольких клиниках с разными ролями.
 */
export interface ClinicStaff {
  id: string;
  clinicId: string;
  staffAccountId: string;
  role: UserRole;
  isActive: boolean;
  clinic: {
    id: string;
    name: string;
  };
}

/**
 * Текущий пользователь CRM: аккаунт + все его назначения.
 */
export interface CurrentUser {
  account: StaffAccount;
  clinics: ClinicStaff[];
}

/**
 * Активная клиника (выбрана в ClinicProvider).
 */
export interface CurrentClinic {
  clinicId: string;
  clinicStaffId: string;
  clinicName: string;
  role: UserRole;
}