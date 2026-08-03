import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/lib/supabase";
import { useClinic } from "@/app/providers/clinic";
import { useCreateAppointment } from "@/features/schedule/hooks/useSchedule";
import { useDoctorExceptions } from "@/features/schedule/hooks/useScheduleExceptions";
import { CreatePatientDialog } from "./CreatePatientDialog";
import { findBlockingException, toDateKey } from "./schedule-exception-utils";

import {
  patientsService,
  type PatientSearchResult,
} from "@/shared/api/patients/patients.service";
import type { ScheduleDoctor } from "@/shared/api/schedule/schedule.service";

interface Props {
  doctor: ScheduleDoctor;
  day: Date;
  time: { hour: number; minute: number };
  preselectPatientId?: string | null;
  onClose: () => void;
}

const PROCEDURES = [
  "checkup", "cleaning", "filling", "extraction", "root_canal",
  "crown", "whitening", "implant", "orthodontics", "surgery", "xray", "other",
];

export function CreateAppointmentDialog({ doctor, day, time, preselectPatientId, onClose }: Props) {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const create = useCreateAppointment();
  const { data: exceptions = [] } = useDoctorExceptions(doctor.id);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);
  const [procedureType, setProcedureType] = useState("checkup");
  const [durationMin, setDurationMin] = useState(30);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createPatientOpen, setCreatePatientOpen] = useState(false);


  useEffect(() => {
    if (patient || query.trim().length < 3) return;
    const id = setTimeout(async () => {
      const q = query.trim();
      const isPhone = /^\+?\d{9,}$/.test(q.replace(/[\s-]/g, ""));
      try {
        if (isPhone) {
          const found = await patientsService.searchByPhone(q.replace(/[\s-]/g, ""));
          setResults(found ? [found] : []);
        } else {
          setResults(await patientsService.searchByName(q));
        }
      } catch {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [query, patient]);

    useEffect(() => {
    if (!preselectPatientId || patient) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, phone, birth_date")
        .eq("id", preselectPatientId)
        .maybeSingle();
      if (data && !cancelled) {
        setPatient({
          id: data.id,
          fullName: data.full_name,
          phone: data.phone,
          birthDate: data.birth_date,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [preselectPatientId, patient]);

  const visibleResults = patient || query.trim().length < 3 ? [] : results;

  const scheduledAt = (() => {
    const d = new Date(day);
    d.setHours(time.hour, time.minute, 0, 0);
    return d;
  })();

  const blockingException = useMemo(() => {
    const startMin = time.hour * 60 + time.minute;
    return findBlockingException(exceptions, toDateKey(day), {
      startMin,
      endMin: startMin + durationMin,
    });
  }, [exceptions, day, time, durationMin]);

  const submit = async () => {
    if (!patient || !clinic || blockingException) return;
    setError(null);
    try {
      await create.mutateAsync({
        clinicId: clinic.clinicId,
        doctorId: doctor.id,
        patientId: patient.id,
        scheduledAt: scheduledAt.toISOString(),
        durationMin,
        procedureType,
        notes: notes || undefined,
      });
      onClose();
    } catch (e) {
      setError(
        e instanceof Error && e.message === "SLOT_TAKEN"
          ? t("createAppointment.slotTaken")
          : t("createAppointment.error")
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка диалога */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t("createAppointment.title")}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {doctor.fullName} ·{" "}
              {scheduledAt.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}{" "}
              ·{" "}
              {scheduledAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Пациент */}
          {patient ? (
            <div className="mb-5 flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {patient.fullName ?? "—"}
                </div>
                <div className="text-xs text-gray-500">{patient.phone}</div>
              </div>
              <button
                onClick={() => {
                  setPatient(null);
                  setQuery("");
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {t("createAppointment.change")}
              </button>
            </div>
          ) : (
            <div className="relative mb-5">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t("createAppointment.patient")}
              </label>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("createAppointment.searchPlaceholder")}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              {visibleResults.length > 0 && (
                <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {visibleResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setPatient(r);
                        setResults([]);
                      }}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-800">
                        {r.fullName ?? "—"}
                      </span>
                      <span className="text-gray-400">{r.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {query.trim().length >= 3 && visibleResults.length === 0 && (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-gray-300 px-3 py-2">
                  <span className="text-xs text-gray-500">{t("createPatient.notFound")}</span>
                  <button
                    onClick={() => setCreatePatientOpen(true)}
                    className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                  >
                    + {t("createPatient.create")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Параметры */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t("createAppointment.procedure")}
              </label>
              <select
                value={procedureType}
                onChange={(e) => setProcedureType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              >
                {PROCEDURES.map((p) => (
                  <option key={p} value={p}>
                    {t(`procedures.${p}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t("createAppointment.duration")}
              </label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              >
                {[15, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} {t("common.minutes")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            {t("createAppointment.notes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mb-4 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500"
          />

          {blockingException && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {t("createAppointment.doctorUnavailable")}
              {" — "}
              {t(`scheduleExceptions.types.${blockingException.exceptionType}`)}
            </p>
          )}

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Футер */}
        <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={!patient || create.isPending || !!blockingException}
            className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
          >
            {t("createAppointment.submit")}
          </button>
        </div>
        {createPatientOpen && (
          <CreatePatientDialog
            initialPhone={query.trim()}
            onCreated={(newPatient) => {
              setPatient(newPatient);
              setCreatePatientOpen(false);
            }}
            onClose={() => setCreatePatientOpen(false)}
          />
        )}
      </div>
    </div>
  );
}