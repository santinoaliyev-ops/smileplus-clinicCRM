import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useClinicFiles } from "@/features/admin-documents/hooks/useClinicFiles";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Только финансовые документы (fileType="document") — намеренно без
 * вкладок photo/xray/ct и без переключателя, в отличие от ClinicDocumentsPage:
 * бухгалтер не должен иметь пути к медицинским изображениям.
 */
export function AccountingDocumentsPage() {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const { data: files = [], isLoading } = useClinicFiles(clinic?.clinicId);

  const documents = useMemo(() => files.filter((f) => f.fileType === "document"), [files]);

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <h1 className="shrink-0 text-xl font-extrabold text-gray-900">{t("accountingDocuments.title")}</h1>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : documents.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("patientCard.noFiles")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {documents.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-teal-700"
                  >
                    📄 {f.title ?? "—"}
                  </a>
                  <span className="w-40 shrink-0 truncate text-sm text-gray-600">
                    {f.patientName ?? f.patientPhone}
                  </span>
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
