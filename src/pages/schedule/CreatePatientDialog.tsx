import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { patientsService } from "@/shared/api/patients/patients.service";
import type { PatientSearchResult } from "@/shared/api/patients/patients.service";

interface Props {
  onCreated: (patient: PatientSearchResult) => void;
  onClose: () => void;
  initialPhone?: string;
}

export function CreatePatientDialog({
  onCreated,
  onClose,
  initialPhone = "",
}: Props) {
  const { t } = useTranslation();
  const { clinic } = useClinic();

  const [phone, setPhone] = useState(initialPhone);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [finCode, setFinCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!phone.trim()) {
      setError(t("createPatient.phoneRequired"));
      return;
    }
    if (finCode && !/^[0-9A-Z]{7}$/.test(finCode.toUpperCase())) {
      setError(t("createPatient.finCodeInvalid"));
      return;
    }
    if (!clinic) return;

    setError(null);
    setLoading(true);

    try {
      const created = await patientsService.create({
        phone: phone.trim(),
        fullName: fullName.trim() || undefined,
        birthDate: birthDate || null,
        finCode: finCode || undefined,
        email: email.trim() || null,
        createdByRole: clinic.role,
        createdById: clinic.clinicStaffId,
        clinicId: clinic.clinicId,
      });

      onCreated({
        id: created.id,
        phone: created.phone,
        fullName: created.fullName,
        birthDate: birthDate || null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "UNKNOWN";
      switch (msg) {
        case "PHONE_EXISTS":
          setError(t("createPatient.phoneExists"));
          break;
        case "FIN_EXISTS":
          setError(t("createPatient.finExists"));
          break;
        case "INVALID_FIN_FORMAT":
          setError(t("createPatient.finCodeInvalid"));
          break;
        case "ACTOR_NOT_FOUND":
          setError("Sizin rolunuz bu əməliyyat üçün icazəli deyil");
          break;
        default:
          setError(t("createPatient.error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {t("createPatient.title")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Телефон */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t("createPatient.phone")} *
            </label>
            <input
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+994501234567"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          {/* ФИН-код */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t("createPatient.finCode")}
            </label>
            <input
              value={finCode}
              onChange={(e) => setFinCode(e.target.value.toUpperCase())}
              placeholder="1234ABC"
              maxLength={7}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-teal-500"
            />
          </div>

          {/* Имя */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t("createPatient.fullName")}
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("createPatient.fullNamePlaceholder")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          {/* Дата рождения */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t("createPatient.birthDate")}
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t("createPatient.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
          >
            {loading ? t("common.loading") : t("createPatient.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}