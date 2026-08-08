import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useUploadPatientFile } from "@/features/patient-card/hooks/usePatientFiles";

interface Props {
  patientId: string;
}

export function QuickActionsCard({ patientId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const upload = useUploadPatientFile(patientId);
  const photoInput = useRef<HTMLInputElement>(null);
  const xrayInput = useRef<HTMLInputElement>(null);

  const bookAppointment = () =>
    navigate("/schedule", { state: { preselectPatientId: patientId } });

  const handleFiles = (fileType: "photo" | "xray", fileList: FileList | null) => {
    if (!fileList || !clinic) return;
    Array.from(fileList).forEach((file) => {
      upload.mutate({
        clinicId: clinic.clinicId,
        uploadedBy: clinic.clinicStaffId,
        fileType,
        file,
        toothNumber: null,
      });
    });
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">{t("patientCard.quickActions")}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <button
          onClick={bookAppointment}
          className="rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          + {t("patientCard.newAppointment")}
        </button>
        <button
          onClick={() => navigate(`/doctor/treatment-plan/${patientId}`)}
          className="rounded-xl border border-teal-300 bg-teal-50 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
        >
          + {t("treatmentPlan.new")}
        </button>
        <button
          onClick={bookAppointment}
          className="rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          {t("patientCard.bookPatient")}
        </button>
        <button
          onClick={() => photoInput.current?.click()}
          disabled={upload.isPending}
          className="rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
        >
          + {t("patientCard.addPhoto")}
        </button>
        <input
          ref={photoInput}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles("photo", e.target.files);
            if (photoInput.current) photoInput.current.value = "";
          }}
        />
        <button
          onClick={() => xrayInput.current?.click()}
          disabled={upload.isPending}
          className="rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
        >
          + {t("patientCard.addXray")}
        </button>
        <input
          ref={xrayInput}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles("xray", e.target.files);
            if (xrayInput.current) xrayInput.current.value = "";
          }}
        />
        <button
          disabled
          title={t("common.comingSoon")}
          className="cursor-not-allowed rounded-xl border border-gray-100 py-2 text-sm font-medium text-gray-300"
        >
          {t("patientCard.sendToCashier")}
        </button>
      </div>
    </div>
  );
}
