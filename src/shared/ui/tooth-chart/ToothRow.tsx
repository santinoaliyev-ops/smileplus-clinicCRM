import { ToothItem } from "./ToothItem";
import type { ToothState } from "./tooth-constants";

interface Props {
  numbers: number[];
  teeth: Map<number, ToothState>;
  selected: number[];
  onToggle: (n: number) => void;
}

export function ToothRow({ numbers, teeth, selected, onToggle }: Props) {
  return (
    <div className="flex gap-0.5">
      {numbers.map((n) => (
        <ToothItem
          key={n}
          number={n}
          state={teeth.get(n)}
          selected={selected.includes(n)}
          onClick={onToggle}
        />
      ))}
    </div>
  );
}