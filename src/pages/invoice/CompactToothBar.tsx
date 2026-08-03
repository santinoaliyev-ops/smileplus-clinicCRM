import type { ToothState } from "@/shared/ui/tooth-chart/tooth-constants";
import {
  CONDITION_COLORS,
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_RIGHT,
  LOWER_LEFT,
} from "@/shared/ui/tooth-chart/tooth-constants";
import { useTranslation } from "react-i18next";
import type { ConditionCode } from "@/shared/ui/tooth-chart/tooth-constants";



interface Props {
  teeth: ToothState[];
  selected: number[];
  onChange: (selected: number[]) => void;
}

const LEGEND_ITEMS: { color: string; code: ConditionCode }[] = [
  { color: "#22c55e", code: "HEALTHY" },
  { color: "#ef4444", code: "CARIES" },
  { color: "#3b82f6", code: "FILLED" },
  { color: "#f97316", code: "FILLED_CARIES" },
  { color: "#a16207", code: "ROOT" },
  { color: "#1f2937", code: "MISSING" },
  { color: "#8b5cf6", code: "ARTIFICIAL" },
];

function getToothColor(state: ToothState | undefined): string | null {
  if (!state) return null;
  if (state.isMissing) return CONDITION_COLORS.MISSING;
  if (state.hasCrown || state.hasImplant) return CONDITION_COLORS.ARTIFICIAL;
  if (state.conditionCode === "HEALTHY") return null;
  return CONDITION_COLORS[state.conditionCode] ?? null;
}

export function CompactToothBar({ teeth, selected, onChange }: Props) {
    const { t } = useTranslation();
    const stateMap = new Map(teeth.map((tooth) => [tooth.toothNumber, tooth]));

  const toggle = (n: number) => {
    onChange(
      selected.includes(n)
        ? selected.filter((s) => s !== n)
        : [...selected, n]
    );
  };

  const ToothButton = ({ n }: { n: number }) => {
    const state = stateMap.get(n);
    const color = getToothColor(state);
    const isSelected = selected.includes(n);

    return (
      <button
        onClick={() => toggle(n)}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border text-[11px] font-semibold transition ${
          isSelected
            ? "border-teal-600 bg-teal-600 text-white"
            : "border-gray-200 bg-white text-gray-700 hover:border-teal-400"
        }`}
        style={
          !isSelected && color
            ? { borderColor: color, color, borderWidth: 2 }
            : undefined
        }
      >
        {n}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-0.5">
        {UPPER_RIGHT.map((n) => <ToothButton key={n} n={n} />)}
        <div className="mx-1 h-5 w-px bg-gray-300" />
        {UPPER_LEFT.map((n) => <ToothButton key={n} n={n} />)}
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="ml-2 flex h-7 shrink-0 items-center rounded border border-red-200 px-2 text-[11px] text-red-500 hover:bg-red-50"
          >
            ✕ {selected.length}
          </button>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        {LOWER_RIGHT.map((n) => <ToothButton key={n} n={n} />)}
        <div className="mx-1 h-5 w-px bg-gray-300" />
        {LOWER_LEFT.map((n) => <ToothButton key={n} n={n} />)}
      </div>

      {/* Легенда — все состояния всегда */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {LEGEND_ITEMS.map(({ color, code }) => (
          <span key={code} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[9px] text-gray-500">
              {t(`toothChart.conditions.${code}`)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}