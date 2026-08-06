import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useClinicFiles } from "@/features/admin-documents/hooks/useClinicFiles";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";
import type { PatientFileType } from "@/shared/api/patients/patient-files.service";

const TABS: PatientFileType[] = ["photo", "xray", "ct", "document"];

const TAB_LABEL_KEY: Record<PatientFileType, string> = {
  photo: "patientCard.files.photos",
  xray: "patientCard.files.xray",
  ct: "patientCard.files.ct",
  document: "patientCard.files.documents",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export function ClinicDocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const { data: files = [], isLoading } = useClinicFiles(clinic?.clinicId);

  const [tab, setTab] = useState<PatientFileType>("document");

  const visible = useMemo(() => files.filter((f) => f.fileType === tab), [files, tab]);

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <h1 className="shrink-0 text-xl font-extrabold text-gray-900">{t("documentsPage.title")}</h1>

        <div className="flex shrink-0 gap-1.5">
          {TABS.map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                tab === tb ? "bg-teal-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t(TAB_LABEL_KEY[tb])}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("patientCard.noFiles")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {visible.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                  {tab === "document" ? (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-teal-700"
                    >
                      📄 {f.title ?? "—"}
                    </a>
                  ) : (
                    <a href={f.url} target="_blank" rel="noreferrer" className="shrink-0">
                      <img src={f.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/patient/${f.patientId}`)}
                    className="w-40 shrink-0 truncate text-left text-sm text-gray-600 hover:text-teal-700"
                  >
                    {f.patientName ?? f.patientPhone}
                  </button>
                  {f.toothNumber && (
                    <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                      🦷 {f.toothNumber}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-gray-400">{formatDate(f.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
