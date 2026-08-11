import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/shared/api/accounting/audit-log.service";

export function useAuditLog(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["finance-audit-log", clinicId],
    queryFn: () => auditLogService.list(clinicId!),
    enabled: !!clinicId,
    staleTime: 30_000,
  });
}
