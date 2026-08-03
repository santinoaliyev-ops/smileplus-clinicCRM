import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import {
  useDoctorExceptions,
  useExceptionActions,
} from "@/features/schedule/hooks/useScheduleExceptions";
import type {
  ExceptionType,
} from "@/shared/api/schedule/schedule-exceptions.service";
import type { ScheduleDoctor } from "@/shared/api/schedule/schedule.service";

interface Props {
  doctor: ScheduleDoctor;
  onClose: () => void;
}

const TYPES: ExceptionType[] = [
  "day_off",
  "vacation",
  "sick_leave",
  "holiday",
  "custom",
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DoctorExceptionsDialog({ doctor, onClose }: Props) {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const { data: exceptions = [], isLoading } = useDoctorExceptions(doctor.id);
  const { create, remove } = useExceptionActions(doctor.id);

  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [fullDay, setFullDay] = useState(true);
  const [timeFrom, setTimeFrom] = useState("09:00");
  const [timeTo, setTimeTo] = useState("18:00");
  const [type, setType] = useState<ExceptionType>("day_off");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!clinic) return;
    setError(null);
    if (dateTo < dateFrom) {
      setError(t("scheduleExceptions.dateOrderError"));
      return;
    }
    try {
      await create.mutateAsync({
        doctorId: doctor.id,
        clinicId: clinic.clinicId,
        dateFrom,
        dateTo,
        timeFrom: fullDay ? null : timeFrom,
        timeTo: fullDay ? null : timeTo,
        exceptionType: type,
        reason: reason || undefined,
      });
      setReason("");
    } catch {
      setError(t("scheduleExceptions.createError"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-[32rem] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          {t("scheduleExceptions.title")}
        </h2>
        <p className="mb-4 text-sm text-gray-500">{doctor.fullName}</p>

        {/* Форма создания */}
        <div className="mb-5 space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t("scheduleExceptions.dateFrom")}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t("scheduleExceptions.dateTo")}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={fullDay}
              onChange={(e) => setFullDay(e.target.checked)}
            />
            {t("scheduleExceptions.fullDay")}
          </label>

          {!fullDay && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {t("scheduleExceptions.type")}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ExceptionType)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {t(`scheduleExceptions.types.${tp}`)}
                </option>
              ))}
            </select>
          </div>

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("scheduleExceptions.reason")}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={submit}
            disabled={create.isPending}
            className="w-full rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
          >
            {t("scheduleExceptions.add")}
          </button>
        </div>

        {/* Список существующих */}
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t("scheduleExceptions.list")}
        </h3>
        {isLoading ? (
          <p className="text-sm text-gray-400">{t("common.loading")}</p>
        ) : exceptions.length === 0 ? (
          <p className="text-sm text-gray-400">{t("scheduleExceptions.empty")}</p>
        ) : (
          <div className="space-y-2">
            {exceptions.map((ex) => (
              <div
                key={ex.id}
                className="flex items-start justify-between rounded-lg bg-gray-50 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {t(`scheduleExceptions.types.${ex.exceptionType}`)}
                    {" · "}
                    {ex.dateFrom === ex.dateTo
                      ? ex.dateFrom
                      : `${ex.dateFrom} – ${ex.dateTo}`}
                  </div>
                  {ex.timeFrom && (
                    <div className="text-xs text-gray-500">
                      {ex.timeFrom.slice(0, 5)}–{ex.timeTo?.slice(0, 5)}
                    </div>
                  )}
                  {ex.reason && (
                    <div className="text-xs text-gray-500">{ex.reason}</div>
                  )}
                </div>
                <button
                  onClick={() => remove.mutate(ex.id)}
                  className="text-sm text-gray-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}