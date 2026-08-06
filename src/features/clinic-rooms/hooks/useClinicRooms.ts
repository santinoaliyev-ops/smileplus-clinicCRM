import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clinicRoomsService } from "@/shared/api/clinic/clinic-rooms.service";

export function useClinicRooms(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-rooms", clinicId],
    queryFn: () => clinicRoomsService.listForClinic(clinicId!),
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}

export function useClinicRoomActions(clinicId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["clinic-rooms", clinicId] });

  const createRoom = useMutation({
    mutationFn: (name: string) => clinicRoomsService.create(clinicId!, name),
    onSuccess: invalidate,
  });

  const assignDoctor = useMutation({
    mutationFn: ({ doctorId, roomId }: { doctorId: string; roomId: string | null }) =>
      clinicRoomsService.assignDoctor(clinicId!, doctorId, roomId),
    onSuccess: invalidate,
  });

  return { createRoom, assignDoctor };
}
