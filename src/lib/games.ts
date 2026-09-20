/**
 * Игровые профили: коэффициент yaw задаёт, сколько градусов поворота
 * даёт один отсчёт мыши при чувствительности 1.
 *
 * Контрольная точка: Warface 7.33 при 800 DPI соответствует
 * Valorant 0.348699 при 800 DPI (7.33 × 0.00333 / 0.07).
 */
export const GAMES = [
  { id: "warface", name: "Warface", yaw: 0.00333 },
  { id: "cs2", name: "CS2 / Apex Legends", yaw: 0.022 },
  { id: "valorant", name: "Valorant", yaw: 0.07 },
  { id: "ow2", name: "Overwatch 2", yaw: 0.0066 },
  { id: "pubg", name: "PUBG", yaw: 0.002 },
  { id: "fortnite", name: "Fortnite", yaw: 0.005555 },
  { id: "r6", name: "Rainbow Six Siege", yaw: 0.00223 },
] as const;

export type GameId = (typeof GAMES)[number]["id"];

export function getGame(id: GameId) {
  return GAMES.find((g) => g.id === id)!;
}

/** Путь мыши в сантиметрах на полный оборот 360°. */
export function cm360(yaw: number, sens: number, dpi: number): number {
  return (360 * 2.54) / (yaw * sens * dpi);
}

/** Пересчёт чувствительности между играми с сохранением cm/360. */
export function convertSens(
  fromYaw: number,
  sens: number,
  fromDpi: number,
  toYaw: number,
  toDpi: number,
): number {
  return (fromYaw * sens * fromDpi) / (toYaw * toDpi);
}

export type SensBand = "high" | "medium" | "low";

/** Классификация по cm/360: границы 25 и 45 см. */
export function sensBand(cm: number): SensBand {
  if (cm < 25) return "high";
  if (cm <= 45) return "medium";
  return "low";
}

export function sensBandLabel(b: SensBand): string {
  const map: Record<SensBand, string> = {
    high: "высокая чувствительность",
    medium: "сбалансированная чувствительность",
    low: "низкая чувствительность",
  };
  return map[b];
}
