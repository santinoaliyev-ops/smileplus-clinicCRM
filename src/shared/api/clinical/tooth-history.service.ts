import { supabase } from "@/shared/lib/supabase";
import type { ConditionCode } from "@/shared/ui/tooth-chart";

export interface ToothHistoryEvent {
  id: string;
  eventType: string;
  date: string;
  doctorName: string | null;
  clinicName: string | null;
  procedureCode: string | null;
  diagnosisCode: string | null;
  note: string | null;
}

export interface ToothHistory {
  current: {
    conditionCode: ConditionCode | null;
    hasCrown: boolean;
    hasImplant: boolean;
    isMissing: boolean;
    updatedAt: string;
  } | null;
  events: ToothHistoryEvent[];
}

class ToothHistoryService {
  async get(patientId: string, toothNumber: number): Promise<ToothHistory> {
    const { data, error } = await supabase.functions.invoke(
      "get-tooth-history",
      { body: { patient_id: patientId, tooth_number: toothNumber } }
    );

    if (error) throw error;
    if (!data?.success) throw new Error("Failed to load tooth history");

    return {
      current: data.current
        ? {
            conditionCode: (data.current.condition_code as ConditionCode) ?? null,
            hasCrown: data.current.has_crown ?? false,
            hasImplant: data.current.has_implant ?? false,
            isMissing: data.current.is_missing ?? false,
            updatedAt: data.current.updated_at,
          }
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events: (data.events ?? []).map((e: any) => ({
        id: e.id,
        eventType: e.event_type,
        date: e.date,
        doctorName: e.doctor_name ?? null,
        clinicName: e.clinic_name ?? null,
        procedureCode: e.procedure_code ?? null,
        diagnosisCode: e.diagnosis_code ?? null,
        note: e.note ?? null,
      })),
    };
  }
}

export const toothHistoryService = new ToothHistoryService();