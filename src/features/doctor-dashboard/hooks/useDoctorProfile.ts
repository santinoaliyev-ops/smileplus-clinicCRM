import { useQuery } from "@tanstack/react-query";
import { doctorService } from "@/shared/api/doctor/doctor.service";
import { useClinic } from "@/app/providers/clinic";

export function useDoctorProfile() {
  const { clinic } = useClinic();

  return useQuery({
    queryKey: ["doctor-profile", clinic?.clinicStaffId],
    queryFn: () => doctorService.getByClinicStaffId(clinic!.clinicStaffId),
    enabled: !!clinic,
  });
}