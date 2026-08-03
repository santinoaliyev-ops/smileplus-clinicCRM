import { useTranslation } from "react-i18next";
import { CONDITION_COLORS, CONDITION_LABELS, type ToothState } from "./tooth-constants";

interface Props {
  number: number;
  state?: ToothState;
  selected: boolean;
  onClick: (n: number) => void;
}

function getColor(state: ToothState | undefined): string {
  if (!state) return CONDITION_COLORS.HEALTHY;
  if (state.isMissing) return CONDITION_COLORS.MISSING;
  if (state.hasCrown || state.hasImplant) return CONDITION_COLORS.ARTIFICIAL;
  return CONDITION_COLORS[state.conditionCode] ?? CONDITION_COLORS.HEALTHY;
}

export function ToothItem({ number, state, selected, onClick }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language as "az" | "ru" | "en";
  const color = getColor(state);
  const isMissing = state?.isMissing ?? false;
  const conditionLabel = state?.conditionCode
    ? CONDITION_LABELS[state.conditionCode][lang]
    : CONDITION_LABELS.HEALTHY[lang];

  return (
    <div className="group relative">
      <button
        onClick={() => onClick(number)}
        className={`flex flex-col items-center gap-1 rounded-xl p-1.5 transition ${
          selected
            ? "bg-teal-50 ring-2 ring-teal-500"
            : "hover:bg-gray-100"
        } ${isMissing ? "opacity-40" : ""}`}
      >
        <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
          {isMissing ? (
            <>
              <line x1="6" y1="6" x2="22" y2="32" stroke={color} strokeWidth="3" strokeLinecap="round" />
              <line x1="22" y1="6" x2="6" y2="32" stroke={color} strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <defs>
                <linearGradient id={`tooth-grad-${number}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.65" />
                </linearGradient>
              </defs>
              {/* Коронка */}
              <path
                d="M14 2C8 2 3 6 3 12C3 16 5 18.5 5.5 22C6 25.5 7 29 9 33C10 35.5 12 36.5 14 36.5C16 36.5 18 35.5 19 33C21 29 22 25.5 22.5 22C23 18.5 25 16 25 12C25 6 20 2 14 2Z"
                fill={`url(#tooth-grad-${number})`}
                stroke={color}
                strokeWidth="1.2"
              />
              {/* Блик */}
              <path
                d="M9 6C7 8 6 10 6 12"
                stroke="white"
                strokeOpacity="0.5"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              {state?.hasCrown && (
                <path d="M6 9 L14 4 L22 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {state?.hasImplant && (
                <>
                  <line x1="14" y1="30" x2="14" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="10" y1="34" x2="18" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
              {state?.conditionCode === "CARIES" && (
                <circle cx="14" cy="14" r="2.5" fill="#7f1d1d" />
              )}
            </>
          )}
        </svg>
        <span className={`text-[10px] font-mono font-semibold ${selected ? "text-teal-700" : "text-gray-500"}`}>
          {number}
        </span>
      </button>

      {/* Тултип при наведении */}
      <div className="pointer-events-none absolute left-1/2 top-full z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
        <span className="font-bold">{number}</span>
        <span className="mx-1 opacity-50">·</span>
        <span>{conditionLabel}</span>
      </div>
    </div>
  );
}
