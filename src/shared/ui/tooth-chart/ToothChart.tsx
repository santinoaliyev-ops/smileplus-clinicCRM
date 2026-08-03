import { useTranslation } from "react-i18next";
import {
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_RIGHT,
  LOWER_LEFT,
  type ToothState,
} from "./tooth-constants";
import { ToothRow } from "./ToothRow";

interface Props {
  teeth?: ToothState[];
  selected: number[];
  onChange: (selected: number[]) => void;
  readOnly?: boolean;
}

const LEGEND_ITEMS = [
  { color: "#22c55e", code: "HEALTHY" },
  { color: "#ef4444", code: "CARIES" },
  { color: "#3b82f6", code: "FILLED" },
  { color: "#f97316", code: "FILLED_CARIES" },
  { color: "#a16207", code: "ROOT" },
  { color: "#1f2937", code: "MISSING" },
  { color: "#8b5cf6", code: "ARTIFICIAL" },
] as const;

export function ToothChart({ teeth = [], selected, onChange, readOnly = false }: Props) {
  const { t } = useTranslation();

  const stateMap = new Map<number, ToothState>(
    teeth.map((t) => [t.toothNumber, t])
  );

  const toggle = (n: number) => {
    if (readOnly) return;
    if (selected.includes(n)) {
      onChange(selected.filter((s) => s !== n));
    } else {
      onChange([...selected, n]);
    }
  };

  const selectAll   = () => onChange([...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_RIGHT, ...LOWER_LEFT]);
  const selectUpper = () => onChange([...UPPER_RIGHT, ...UPPER_LEFT]);
  const selectLower = () => onChange([...LOWER_RIGHT, ...LOWER_LEFT]);
  const clearAll    = () => onChange([]);

  const rowProps = { teeth: stateMap, selected, onToggle: toggle };

  return (
    <div className="select-none rounded-2xl bg-white p-4 shadow-sm">
      {!readOnly && (
        <div className="mb-3 flex items-center gap-2">
          <button onClick={selectAll}   className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50">{t("toothChart.allTeeth")}</button>
          <button onClick={selectUpper} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50">{t("toothChart.upperJaw")}</button>
          <button onClick={selectLower} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50">{t("toothChart.lowerJaw")}</button>
          {selected.length > 0 && (
            <button onClick={clearAll} className="ml-auto rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50">
              {t("toothChart.clear")} ({selected.length})
            </button>
          )}
        </div>
      )}

      {/* Верхняя челюсть */}
      <div className="mb-1 flex items-center gap-1">
        <span className="w-6 text-right text-[9px] text-gray-400">R</span>
        <ToothRow numbers={UPPER_RIGHT} {...rowProps} />
        <div className="mx-1 h-8 w-px bg-gray-200" />
        <ToothRow numbers={UPPER_LEFT} {...rowProps} />
        <span className="w-6 text-[9px] text-gray-400">L</span>
      </div>

      <div className="mx-7 my-2 h-px bg-gray-200" />

      {/* Нижняя челюсть */}
      <div className="flex items-center gap-1">
        <span className="w-6 text-right text-[9px] text-gray-400">R</span>
        <ToothRow numbers={LOWER_RIGHT} {...rowProps} />
        <div className="mx-1 h-8 w-px bg-gray-200" />
        <ToothRow numbers={LOWER_LEFT} {...rowProps} />
        <span className="w-6 text-[9px] text-gray-400">L</span>
      </div>

      {/* Легенда */}
      <div className="mt-3 flex flex-wrap gap-2">
        {LEGEND_ITEMS.map(({ color, code }) => (
          <div key={code} className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-gray-500">{t(`toothChart.conditions.${code}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}