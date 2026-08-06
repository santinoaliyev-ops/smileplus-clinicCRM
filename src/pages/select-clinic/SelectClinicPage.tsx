import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/app/providers/auth";
import { useClinic } from "@/app/providers/clinic";
import type { ClinicStaff } from "@/shared/types/auth";

export function SelectClinicPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { setClinic } = useClinic();
  const navigate = useNavigate();

  const clinics = user?.clinics ?? [];

  const pick = (staff: ClinicStaff) => {
    setClinic({
      clinicId: staff.clinicId,
      clinicStaffId: staff.id,
      clinicName: staff.clinic.name,
      role: staff.role,
    });
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("selectClinic.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("selectClinic.subtitle")}</p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
          >
            {t("common.logout")}
          </button>
        </div>

        <div className="space-y-2">
          {clinics.map((staff) => (
            <button
              key={staff.id}
              onClick={() => pick(staff)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:border-teal-400 hover:bg-teal-50"
            >
              <span className="font-medium text-gray-900">{staff.clinic.name}</span>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                {t(`roles.${staff.role}`)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
