import { useTranslation } from "react-i18next";

export function PatientStatusDot({ isPrimary }: { isPrimary: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      title={t(isPrimary ? "doctorDesk.primary" : "doctorDesk.returning")}
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
        isPrimary ? "bg-red-500" : "bg-gray-400"
      }`}
    />
  );
}