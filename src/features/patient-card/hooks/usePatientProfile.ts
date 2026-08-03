import { useQuery } from "@tanstack/react-query";
import { patientProfileService } from "@/shared/api/patients/patient-profile.service";
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