export enum Permission {
  PatientsRead = "patients.read",
  PatientsCreate = "patients.create",
  PatientsUpdate = "patients.update",
  PatientsDelete = "patients.delete",

  AppointmentsRead = "appointments.read",
  AppointmentsCreate = "appointments.create",
  AppointmentsUpdate = "appointments.update",
  AppointmentsDelete = "appointments.delete",

  /** Медкарта, зубная формула, клинические события */
  MedicalRead = "medical.read",
  MedicalUpdate = "medical.update",

  /** Инвойсы: просмотр */
  InvoicesRead = "invoices.read",
  /** Инвойсы: создание/редактирование (врач формирует счёт) */
  InvoicesWrite = "invoices.write",
  /** Приём оплаты, закрытие инвойса */
  PaymentsAccept = "payments.accept",

  /** Финансовые отчёты, выручка, ledger */
  FinanceRead = "finance.read",
  FinanceUpdate = "finance.update",

  /** Управление персоналом */
  StaffRead = "staff.read",
  StaffManage = "staff.manage",

  /** Расписание врачей: управление */
  ScheduleManage = "schedule.manage",

  SettingsRead = "settings.read",
  SettingsUpdate = "settings.update",
}