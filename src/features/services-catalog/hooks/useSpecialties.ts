import { useQuery } from "@tanstack/react-query";
import { specialtiesService } from "@/shared/api/specialties/specialties.service";

export function useSpecialties() {
  return useQuery({
    queryKey: ["specialties"],
    queryFn: () => specialtiesService.list(),
    staleTime: 10 * 60_000,
  });
}
