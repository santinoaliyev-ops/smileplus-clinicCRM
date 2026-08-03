import { Permission } from "./permission";
import { UserRole } from "./role";

const P = Permission;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.Doctor]: [
    P.PatientsRead,
    P.AppointmentsRead,
    P.AppointmentsUpdate, // менять статус своих приёмов
    P.MedicalRead,
    P.MedicalUpdate,
    P.InvoicesRead,
    P.InvoicesWrite, // формирует счёт по итогам приёма
  ],

  [UserRole.Receptionist]: [
    P.PatientsRead,
    P.PatientsCreate,
    P.PatientsUpdate,
    P.AppointmentsRead,
    P.AppointmentsCreate,
    P.AppointmentsUpdate,
    P.AppointmentsDelete,
    P.InvoicesRead,
    P.ScheduleManage,
  ],

  [UserRole.Cashier]: [
    P.PatientsRead,
    P.AppointmentsRead,
    P.InvoicesRead,
    P.PaymentsAccept,
  ],

  [UserRole.Accountant]: [
    P.InvoicesRead,
    P.FinanceRead,
    P.FinanceUpdate,
  ],

  [UserRole.Manager]: Object.values(Permission), // директор — всё
};

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}