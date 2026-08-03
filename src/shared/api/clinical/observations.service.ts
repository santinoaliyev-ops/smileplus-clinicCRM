import { supabase } from "@/shared/lib/supabase";
import type { ConditionCode } from "@/shared/ui/tooth-chart";

export interface CreateObservationInput {
  patientId: string;
  doctorId: string;
  clinicId: string;
  appointmentId: string | null;
  toothNumber: number;
  conditionCode: ConditionCode;
  notes?: string;
}

class ObservationsService {
  async create(input: CreateObservationInput): Promise<void> {
    // 1. Upsert patient_teeth — получаем id записи
    const { data: tooth, error: toothError } = await supabase
      .from("patient_teeth")
      .upsert(
        {
          patient_id: input.patientId,
          tooth_number: input.toothNumber,
          condition_code: input.conditionCode,
          is_missing: input.conditionCode === "MISSING",
          has_crown: input.conditionCode === "ARTIFICIAL",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "patient_id,tooth_number" }
      )
      .select("id")
      .single();

    if (toothError) throw toothError;

    // 2. Клиническое событие (наблюдение/осмотр)
    const { data: event, error: eventError } = await supabase
      .from("clinical_events")
      .insert({
        patient_id: input.patientId,
        doctor_id: input.doctorId,
        clinic_id: input.clinicId,
        appointment_id: input.appointmentId,
        event_type: "diagnosis",
        event_date: new Date().toISOString(),
        note: input.notes ?? null,
      })
      .select("id")
      .single();

    if (eventError) throw eventError;

    // 3. tooth_events — связка события с зубом через patient_tooth_id
    const { error: teethEventError } = await supabase
      .from("tooth_events")
      .insert({
        clinical_event_id: event.id,
        patient_tooth_id: tooth.id,
        diagnosis_code: input.conditionCode,
        note: input.notes ?? null,
      });

    if (teethEventError) throw teethEventError;
  }
}

export const observationsService = new ObservationsService();