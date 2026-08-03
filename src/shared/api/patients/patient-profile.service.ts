import { supabase } from "@/shared/lib/supabase";

export interface PatientProfileVisit {
  appointmentId: string;
  scheduledAt: string;
  status: string;
  clinicName: string | null;
  doctorName: string | null;
  isOwn: boolean;
  procedures: string[];
}

export interface PatientProfile {
  id: string;
  fullName: string | null;
  phone: string;
  email: string | null;
  finCode: string | null;
  birthDate: string | null;
  gender: string | null;
  medicalCard: {
    bloodType: string | null;
    allergies: string[] | null;
    chronicConditions: string[] | null;
    diabetes: boolean | null;
    pregnancy: boolean | null;
    pacemaker: boolean | null;
    anticoagulants: boolean | null;
    hepatitis: boolean | null;
    hiv: boolean | null;
    peculiarities: string | null;
    notes: string | null;
  };
  subscription: {
    plan: string;
    coverageLimit: number;
    coverageUsed: number;
    endDate: string | null;
  } | null;
  visits: PatientProfileVisit[];
}

export interface VisitDetail {
  appointmentId: string;
  scheduledAt: string;
  notes: string | null;
  procedures: {
    name: string;
    toothNumbers: number[];
    amountTotal: number;
  }[];
}

const num = (v: unknown): number =>
  typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) || 0 : 0;

class PatientProfileService {
  async getProfile(userId: string, doctorId: string): Promise<PatientProfile> {
    const { data, error } = await supabase.functions.invoke(
      "doctor-patient-profile",
      { body: { patient_id: userId, doctor_id: doctorId } }
    );

    if (error) throw error;
    if (!data?.patient) throw new Error("Failed to load profile");

    const p = data.patient;
    const sub = data.subscription;

    return {
      id: p.id,
      fullName: p.full_name ?? null,
      phone: p.phone,
      email: p.email ?? null,
      finCode: p.fin_code ?? null,
      birthDate: p.birth_date ?? null,
      gender: p.gender ?? null,
      medicalCard: {
        bloodType: p.blood_type ?? null,
        allergies: p.allergies ?? null,
        chronicConditions: p.chronic_conditions ?? null,
        diabetes: p.diabetes ?? null,
        pregnancy: p.pregnancy ?? null,
        pacemaker: p.pacemaker ?? null,
        anticoagulants: p.anticoagulants ?? null,
        hepatitis: p.hepatitis ?? null,
        hiv: p.hiv ?? null,
        peculiarities: p.peculiarities ?? null,
        notes: p.medical_notes ?? null,
      },
      subscription: sub
        ? {
            plan: sub.plan,
            coverageLimit: num(sub.coverage_limit),
            coverageUsed: num(sub.coverage_used),
            endDate: sub.end_date ?? null,
          }
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      visits: (data.recent_visits ?? []).map((v: any) => ({
        appointmentId: v.appointment_id ?? v.id,
        scheduledAt: v.visit_date ?? v.scheduled_at,
        status: v.status ?? "completed",
        clinicName: v.clinic_name ?? null,
        doctorName: v.doctor_name ?? null,
        isOwn: v.is_mine ?? v.is_own ?? false,
        procedures: (v.procedures ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (pr: any) => (typeof pr === "string" ? pr : pr.name ?? "—")
        ),
      })),
    };
  }

  async getVisitDetail(
    appointmentId: string,
    doctorId: string
  ): Promise<VisitDetail> {
    const { data, error } = await supabase.functions.invoke(
      "get-visit-detail",
      { body: { appointment_id: appointmentId, doctor_id: doctorId } }
    );

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error ?? "Failed to load visit");

    const v = data.visit;
     
    return {
      appointmentId: v.appointment_id ?? appointmentId,
      scheduledAt: v.scheduled_at,
      notes: v.notes ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      procedures: (v.procedures ?? []).map((pr: any) => ({
        name: pr.name ?? pr.procedure_name ?? "—",
        toothNumbers: pr.tooth_numbers ?? [],
        amountTotal: num(pr.amount_total),
      })),
    };
  }
}

export const patientProfileService = new PatientProfileService();