import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { scheduleService } from "@/shared/api/schedule/schedule.service";
import { appointmentsService } from "@/shared/api/appointments/appointments.service";
import { supabase } from "@/shared/lib/supabase";
import { useClinic } from "@/app/providers/clinic";
import { useDoctorScheduleRules } from "@/features/admin-dashboard/hooks/useAdminDashboard";
import type { DayLoadColor } from "@/pages/schedule/schedule-constants";

export function useClinicDoctors() {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["clinic-doctors", clinic?.clinicId],
    queryFn: () => scheduleService.getClinicDoctors(clinic!.clinicId),
    enabled: !!clinic,
    staleTime: 5 * 60_000,
  });
}

export function useClinicDoctorsDetailed() {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["clinic-doctors-detailed", clinic?.clinicId],
    queryFn: () => scheduleService.getClinicDoctorsDetailed(clinic!.clinicId),
    enabled: !!clinic,
    staleTime: 5 * 60_000,
  });
}

export function useClinicDay(day: Date) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["clinic-day", clinic?.clinicId, day.toDateString()],
    queryFn: () => scheduleService.getClinicDay(clinic!.clinicId, day),
    enabled: !!clinic,
    refetchInterval: 60_000,
  });
}

/** Realtime по всем приёмам клиники (записи из mobile-app видны сразу) */
export function useClinicScheduleRealtime() {
  const { clinic } = useClinic();
  const qc = useQueryClient();

  useEffect(() => {
    if (!clinic) return;

    const channel = supabase
      .channel(`clinic-schedule-${clinic.clinicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `clinic_id=eq.${clinic.clinicId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["clinic-day"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinic, qc]);
}

export function useScheduleActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["clinic-day"] });

  const confirm = useMutation({
    mutationFn: (id: string) => scheduleService.confirm(id),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      scheduleService.cancel(id, reason),
    onSuccess: invalidate,
  });

  const markArrived = useMutation({
    mutationFn: (id: string) => appointmentsService.markArrived(id),
    onSuccess: invalidate,
  });

  const startAppointment = useMutation({
    mutationFn: (id: string) =>
      appointmentsService.setStatus(id, "in_progress"),
    onSuccess: invalidate,
  });

  return { confirm, cancel, markArrived, startAppointment };
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof scheduleService.createAppointment>[0]) =>
      scheduleService.createAppointment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinic-day"] }),
  });
}

export function useClinicMonth(year: number, month: number, doctorId?: string | null) {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["clinic-month", clinic?.clinicId, year, month, doctorId ?? null],
    queryFn: async () => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      let query = supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("clinic_id", clinic!.clinicId)
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .not("status", "in", '("cancelled","no_show")');
      if (doctorId) query = query.eq("doctor_id", doctorId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((a) => {
        const d = new Date(a.scheduled_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      });
    },
    enabled: !!clinic,
    staleTime: 5 * 60_000,
  });
}

/**
 * Реальная загрузка врача по дням месяца — заменяет getDayLoadColorStub.
 * Использует тот же запрос, что и useClinicMonth (по одной записи на приём,
 * не Set), считает частоты по дням, и ёмкость дня из doctor_schedule
 * (правило на день недели, total = (end-start)/slotDuration).
 */
export function useDoctorMonthLoad(
  doctorId: string | undefined,
  year: number,
  month: number
): Map<string, DayLoadColor> {
  const { clinic } = useClinic();
  const { data: monthDates = [] } = useClinicMonth(year, month, doctorId);
  const { data: rules = [] } = useDoctorScheduleRules(clinic?.clinicId);

  return useMemo(() => {
    const countByDay = new Map<string, number>();
    for (const key of monthDates) {
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = new Map<string, DayLoadColor>();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const rule = doctorId
        ? rules.find((r) => r.doctorId === doctorId && r.dayOfWeek === date.getDay())
        : undefined;

      if (!rule) {
        result.set(key, "gray");
        continue;
      }

      const [startH, startM] = rule.startTime.split(":").map(Number);
      const [endH, endM] = rule.endTime.split(":").map(Number);
      const totalSlots = Math.max(
        1,
        Math.floor((endH * 60 + endM - (startH * 60 + startM)) / (rule.slotDuration || 30))
      );
      const count = countByDay.get(key) ?? 0;
      const pct = (count / totalSlots) * 100;

      result.set(key, pct === 0 || pct < 20 ? "green" : pct <= 80 ? "yellow" : "red");
    }

    return result;
  }, [monthDates, rules, doctorId, year, month]);
}