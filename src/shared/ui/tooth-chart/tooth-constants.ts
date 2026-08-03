export type ConditionCode =
  | "HEALTHY"
  | "CARIES"
  | "FILLED"
  | "FILLED_CARIES"
  | "ROOT"
  | "MISSING"
  | "ARTIFICIAL";

export const CONDITION_COLORS: Record<ConditionCode, string> = {
  HEALTHY: "#22c55e",
  CARIES: "#ef4444",
  FILLED: "#3b82f6",
  FILLED_CARIES: "#f97316",
  ROOT: "#a16207",
  MISSING: "#1f2937",
  ARTIFICIAL: "#8b5cf6",
};

export const CONDITION_LABELS: Record<ConditionCode, Record<string, string>> = {
  HEALTHY:      { az: "Sağlam",       ru: "Здоровый",          en: "Healthy" },
  CARIES:       { az: "Kariyes",      ru: "Кариес",             en: "Caries" },
  FILLED:       { az: "Plomba",       ru: "Запломбирован",      en: "Filled" },
  FILLED_CARIES:{ az: "Plomba+Kariyes",ru: "Пломба+кариес",    en: "Filled+Caries" },
  ROOT:         { az: "Kök",          ru: "Корень",             en: "Root" },
  MISSING:      { az: "Yoxdur",       ru: "Отсутствует",        en: "Missing" },
  ARTIFICIAL:   { az: "Süni",         ru: "Искусственный",      en: "Artificial" },
};

// Верхняя челюсть: правая → левая (18..11, 21..28)
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];

// Нижняя челюсть: правая → левая (48..41, 31..38)
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
export const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];

export const ALL_TEETH = [
  ...UPPER_RIGHT, ...UPPER_LEFT,
  ...LOWER_RIGHT, ...LOWER_LEFT,
];

export interface ToothState {
  toothNumber: number;
  conditionCode: ConditionCode;
  isMissing?: boolean;
  hasCrown?: boolean;
  hasImplant?: boolean;
}