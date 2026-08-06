import { useQuery } from "@tanstack/react-query";
import { activityLogService } from "@/shared/api/clinic/activity-log.service";
import { doctorScheduleService } from "@/shared/api/schedule/doctor-schedule.service";

export function useActivityLog(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-activity-log", clinicId],
    queryFn: () => activityLogService.getRecent(clinicId!),
    enabled: !!clinicId,
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useDoctorScheduleRules(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["doctor-schedule-rules", clinicId],
    queryFn: () => doctorScheduleService.getForClinic(clinicId!),
    enabled: !!clinicId,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
