/**
 * Роли сотрудников клиники.
 * Синхронизировано с enum staff_role в БД.
 */
export enum UserRole {
  /** Врач */
  Doctor = "doctor",
  /** Администратор (ресепшн) */
  Receptionist = "receptionist",
  /** Директор клиники */
  Manager = "manager",
  /** Кассир */
  Cashier = "cashier",
  /** Бухгалтер */
  Accountant = "accountant",
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Doctor]: "Врач",
  [UserRole.Receptionist]: "Администратор",
  [UserRole.Manager]: "Директор",
  [UserRole.Cashier]: "Кассир",
  [UserRole.Accountant]: "Бухгалтер",
};

export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}