import { CONDITION_COLORS, type ToothState } from "./tooth-constants";

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
  const color = getColor(state);
  const isMissing = state?.isMissing ?? false;

  return (
    <button
      onClick={() => onClick(number)}
      title={`${number}`}
      className={`flex flex-col items-center gap-0.5 rounded-lg p-1 transition ${
        selected
          ? "ring-2 ring-teal-500 bg-teal-50"
          : "hover:bg-gray-100"
      } ${isMissing ? "opacity-40" : ""}`}
    >
      <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
        {isMissing ? (
          <>
            <line x1="4" y1="4" x2="16" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="4" x2="4" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path
              d="M10 2C6 2 2 5 2 9C2 13 4 16 4 20C4 23 6 26 10 26C14 26 16 23 16 20C16 16 18 13 18 9C18 5 14 2 10 2Z"
              fill={color}
              fillOpacity={0.85}
              stroke={color}
              strokeWidth="1"
            />
            {state?.hasCrown && (
              <path d="M5 8 L10 4 L15 8" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            )}
            {state?.hasImplant && (
              <line x1="10" y1="24" x2="10" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" />
            )}
          </>
        )}
      </svg>
      <span className={`text-[9px] font-mono font-medium ${selected ? "text-teal-700" : "text-gray-500"}`}>
        {number}
      </span>
    </button>
  );
}