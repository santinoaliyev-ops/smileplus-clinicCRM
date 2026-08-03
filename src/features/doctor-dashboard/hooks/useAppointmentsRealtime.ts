import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

/**
 * Живое обновление рабочего стола: пациент записался из mobile-app,
 * врач подтвердил в smileplus-doctor — CRM видит без перезагрузки.
 * NOTE: при миграции на Spring Boot заменить на WebSocket/STOMP.
 */
export function useAppointmentsRealtime(doctorId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!doctorId) return;

    const channel = supabase
      .channel(`doctor-appointments-${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["doctor-day"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, qc]);
}