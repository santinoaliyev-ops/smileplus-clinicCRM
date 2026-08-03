import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  scheduleExceptionsService,
  type CreateExceptionInput,
} from "@/shared/api/schedule/schedule-exceptions.service";

export function useDoctorExceptions(doctorId: string | undefined) {
  return useQuery({
    queryKey: ["schedule-exceptions", doctorId],
    queryFn: () => scheduleExceptionsService.getByDoctor(doctorId!),
    enabled: !!doctorId,
  });
}

export function useExceptionActions(doctorId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["schedule-exceptions", doctorId] });

  const create = useMutation({
    mutationFn: (input: CreateExceptionInput) =>
      scheduleExceptionsService.create(input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => scheduleExceptionsService.delete(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}