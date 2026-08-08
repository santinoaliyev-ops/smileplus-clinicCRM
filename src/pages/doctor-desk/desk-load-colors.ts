/** Цвет точки загруженности дня в мини-календаре (см. легенду в DeskMiniCalendar) */
export function getLoadColor(pct: number): string {
  if (pct < 30) return "#4ade80";
  if (pct < 60) return "#facc15";
  if (pct < 90) return "#fb923c";
  return "#f87171";
}
