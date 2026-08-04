import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getAge } from "@/features/doctor-dashboard/lib/desk-utils";
import { useNextAppointment } from "@/features/patient-card/hooks/usePatientProfile";
import type { PatientProfile } from "@/shared/api/patients/patient-profile.service";

interface Props {
  profile: PatientProfile;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export function PatientHeaderCard({ profile }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const age = getAge(profile.birthDate);
  const { data: nextAppointment } = useNextAppointment(profile.id);

  const lastVisit = profile.history[0] ?? null;

  const bookAppointment = () =>
    navigate("/schedule", { state: { preselectPatientId: profile.id } });

  const genderLabel =
    profile.gender === "male"
      ? t("patientCard.genderMale")
      : profile.gender === "female"
      ? t("patientCard.genderFemale")
      : "—";

  return (
    <div className="flex items-start gap-5 rounded-2xl bg-white p-5 shadow-sm">
      {/* Аватар */}
      {profile.photoUrl ? (
        <img
          src={profile.photoUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-xl font-bold text-teal-700">
          {initials(profile.fullName ?? profile.phone)}
        </div>
      )}

      {/* Инфо */}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-extrabold text-gray-900">{profile.fullName ?? profile.phone}</h1>

        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <Field label={t("patientCard.birthDate")} value={profile.birthDate ? formatDate(profile.birthDate) : "—"} />
          <Field label={t("patientCard.age")} value={age !== null ? String(age) : "—"} />
          <Field label={t("patientCard.gender")} value={genderLabel} />
          <Field label={t("patientCard.phone")} value={profile.phone} />
          <Field label={t("patientCard.finCode")} value={profile.finCode ?? "—"} />
          <Field label={t("patientCard.email")} value={profile.email ?? "—"} />
          <Field label={t("patientCard.attendingDoctor")} value={lastVisit?.doctorName ?? "—"} />
          <Field label={t("patientCard.lastVisit")} value={lastVisit ? formatDate(lastVisit.date) : "—"} />
          <Field
            label={t("patientCard.nextVisit")}
            value={nextAppointment ? formatDate(nextAppointment.scheduledAt) : "—"}
          />
          <Field label={t("patientCard.address")} value={profile.address ?? "—"} />
        </div>
      </div>

      {/* Действия */}
      <div className="flex w-44 shrink-0 flex-col gap-2">
        <button
          onClick={bookAppointment}
          className="rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          {t("patientCard.newAppointment")}
        </button>
        <button
          onClick={bookAppointment}
          className="rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          {t("patientCard.bookPatient")}
        </button>
        <button
          disabled
          title={t("common.comingSoon")}
          className="cursor-not-allowed rounded-xl border border-gray-100 py-2 text-sm font-medium text-gray-300"
        >
          {t("patientCard.invoiceHistory")}
        </button>
        <button
          disabled
          title={t("common.comingSoon")}
          className="cursor-not-allowed rounded-xl border border-gray-100 py-2 text-sm font-medium text-gray-300"
        >
          {t("common.more")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="truncate font-medium text-gray-800">{value}</div>
    </div>
  );
}
