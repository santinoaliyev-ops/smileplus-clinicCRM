import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  appointmentsService,
  type AppointmentStatus,
} from "@/shared/api/appointments/appointments.service";

export function useDoctorDay(doctorId: string | undefined, day: Date) {
  return useQuery({
    queryKey: ["doctor-day", doctorId, day.toDateString()],
    queryFn: () => appointmentsService.getDoctorDay(doctorId!, day),
    enabled: !!doctorId,
    refetchInterval: 30_000, // пульс рабочего стола
  });
}

export function useAppointmentActions() {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["doctor-day"] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentsService.setStatus(id, status),
    onSuccess: invalidate,
  });

  const markArrived = useMutation({
    mutationFn: (id: string) => appointmentsService.markArrived(id),
    onSuccess: invalidate,
  });

  return { setStatus, markArrived };
}