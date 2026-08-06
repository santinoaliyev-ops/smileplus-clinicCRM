import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clinicProceduresAdminService,
  type SubscriptionPlan,
} from "@/shared/api/clinic/clinic-procedures-admin.service";
import {
  promotionsService,
  type PromotionDiscountType,
} from "@/shared/api/promotions/promotions.service";

export function useAdminCatalogProcedures(clinicId: string | undefined, specialtyId: string | undefined) {
  return useQuery({
    queryKey: ["admin-catalog-procedures", clinicId, specialtyId],
    queryFn: () => clinicProceduresAdminService.listForSpecialty(clinicId!, specialtyId!),
    enabled: !!clinicId && !!specialtyId,
  });
}

export function useSetProcedurePricing(clinicId: string | undefined, specialtyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { procedureId: string; plan: SubscriptionPlan; clinicPrice: number; isEnabled: boolean }) =>
      clinicProceduresAdminService.setPricing(clinicId!, input.procedureId, input.plan, {
        clinicPrice: input.clinicPrice,
        isEnabled: input.isEnabled,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-catalog-procedures", clinicId, specialtyId] });
      qc.invalidateQueries({ queryKey: ["clinic-procedures"] });
    },
  });
}

export function useCreateCustomProcedure(clinicId: string | undefined, specialtyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      nameAz: string;
      nameRu: string;
      nameEn: string;
      requiresTooth: boolean;
      price: number;
    }) =>
      clinicProceduresAdminService.createCustomProcedure({
        clinicId: clinicId!,
        specialtyId: specialtyId!,
        ...input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-catalog-procedures", clinicId, specialtyId] });
      qc.invalidateQueries({ queryKey: ["clinic-procedures"] });
    },
  });
}

export function useClinicPromotions(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-promotions", clinicId],
    queryFn: () => promotionsService.listForClinic(clinicId!),
    enabled: !!clinicId,
  });
}

export function useCreatePromotion(clinicId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { procedureId: string; discountType: PromotionDiscountType; discountValue: number; endsAt?: string | null }) =>
      promotionsService.create({ clinicId: clinicId!, ...input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-promotions", clinicId] });
      qc.invalidateQueries({ queryKey: ["clinic-procedures"] });
    },
  });
}

export function useSetPromotionActive(clinicId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      promotionsService.setActive(input.id, input.isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-promotions", clinicId] });
      qc.invalidateQueries({ queryKey: ["clinic-procedures"] });
    },
  });
}

export function useDeletePromotion(clinicId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promotionsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-promotions", clinicId] });
      qc.invalidateQueries({ queryKey: ["clinic-procedures"] });
    },
  });
}
