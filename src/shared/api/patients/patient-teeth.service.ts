import { supabase } from "@/shared/lib/supabase";
import type { ToothState, ConditionCode } from "@/shared/ui/tooth-chart";

class PatientTeethService {
  async getByPatient(patientId: string): Promise<ToothState[]> {
    const { data, error } = await supabase
      .from("patient_teeth")
      .select("tooth_number, condition_code, is_missing, has_crown, has_implant")
      .eq("patient_id", patientId);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      toothNumber: row.tooth_number,
      conditionCode: (row.condition_code ?? "HEALTHY") as ConditionCode,
      isMissing: row.is_missing ?? false,
      hasCrown: row.has_crown ?? false,
      hasImplant: row.has_implant ?? false,
    }));
  }
}

export const patientTeethService = new PatientTeethService();