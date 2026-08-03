import { useQuery } from "@tanstack/react-query";
import { patientProfileService } from "@/shared/api/patients/patient-profile.service";
import { appointmentsService } from "@/shared/api/appointments/appointments.service";
import { invoiceService } from "@/shared/api/invoices/invoice.service";
import { useDoctorProfile } from "@/features/doctor-dashboard/hooks/useDoctorProfile";

export function usePatientProfile(patientId: string | undefined) {
  const { data: doctor } = useDoctorProfile();

  return useQuery({
    queryKey: ["patient-profile", patientId, doctor?.id],
    queryFn: () => patientProfileService.getProfile(patientId!, doctor!.id),
    enabled: !!patientId && !!doctor,
  });
}

export function useVisitDetail(appointmentId: string | null) {
  const { data: doctor } = useDoctorProfile();

  return useQuery({
    queryKey: ["visit-detail", appointmentId, doctor?.id],
    queryFn: () =>
      patientProfileService.getVisitDetail(appointmentId!, doctor!.id),
    enabled: !!appointmentId && !!doctor,
  });
}

export function useNextAppointment(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-next-appointment", patientId],
    queryFn: () => appointmentsService.getNextAppointment(patientId!),
    enabled: !!patientId,
  });
}

export function usePatientFinanceSummary(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-finance-summary", patientId],
    queryFn: () => invoiceService.getPatientFinanceSummary(patientId!),
    enabled: !!patientId,
    retry: false,
  });
}