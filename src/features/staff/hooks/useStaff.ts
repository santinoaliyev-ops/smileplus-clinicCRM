import { useQuery } from "@tanstack/react-query";

import { staffService } from "@/shared/api/staff/staff.service";

export function useStaff(clinicId: string) {
  return useQuery({
    queryKey: ["staff", clinicId],
    queryFn: () => staffService.getAll(clinicId),
    enabled: !!clinicId,
  });
}