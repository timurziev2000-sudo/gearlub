import type { FrictionSource, Mousepad } from "@/lib/types";

/**
 * Метрики трения из таблицы cisA. Значения — сила трения (Н) × 100.
 * Меньше = быстрее скольжение, больше = сильнее контроль.
 */

export const FRICTION_MIN = 10;
export const FRICTION_MAX = 32;

/** Средняя динамическая сила трения по осям X и Y. */
export function avgDynamic(pad: Mousepad): number {
  return (pad.dynamicFrictionX + pad.dynamicFrictionY) / 2;
}

/** Средняя статическая сила трения (усилие срыва с места). */
export function avgStatic(pad: Mousepad): number {
  return (pad.staticFrictionX + pad.staticFrictionY) / 2;
}

/**
 * Анизотропия: насколько по-разному коврик ведёт себя по горизонтали и вертикали.
 * Большая разница означает, что флики и вертикальный трекинг ощущаются неодинаково.
 */
export function anisotropy(pad: Mousepad): number {
  return Math.abs(pad.dynamicFrictionX - pad.dynamicFrictionY);
}

export type AnisotropyLevel = "low" | "medium" | "high";

export function anisotropyLevel(pad: Mousepad): AnisotropyLevel {
  const diff = anisotropy(pad);
  if (diff < 1) return "low";
  if (diff < 3) return "medium";
  return "high";
}

export function anisotropyLabel(level: AnisotropyLevel): string {
  const map: Record<AnisotropyLevel, string> = {
    low: "изотропный",
    medium: "умеренная анизотропия",
    high: "выраженная анизотропия",
  };
  return map[level];
}

/**
 * Разница между статикой и динамикой: «залипание» при старте движения.
 * Высокое значение мешает микрокоррекциям на low sens.
 */
export function stictionDelta(pad: Mousepad): number {
  return avgStatic(pad) - avgDynamic(pad);
}

/** Позиция коврика на шкале скорость→контроль в процентах (0 = самый быстрый). */
export function frictionPercent(pad: Mousepad): number {
  const value = avgDynamic(pad);
  const raw = ((value - FRICTION_MIN) / (FRICTION_MAX - FRICTION_MIN)) * 100;
  return Math.min(100, Math.max(0, raw));
}

export type SpeedClass = "very-fast" | "fast" | "balanced" | "control" | "very-slow";

export function speedClass(pad: Mousepad): SpeedClass {
  const value = avgDynamic(pad);
  if (value < 15) return "very-fast";
  if (value < 19) return "fast";
  if (value < 22) return "balanced";
  if (value < 25) return "control";
  return "very-slow";
}

export function speedClassLabel(cls: SpeedClass): string {
  const map: Record<SpeedClass, string> = {
    "very-fast": "очень быстрый",
    fast: "быстрый",
    balanced: "сбалансированный",
    control: "контрольный",
    "very-slow": "максимальный контроль",
  };
  return map[cls];
}

export function textureLabel(t: Mousepad["surfaceTexture"]): string {
  const map: Record<Mousepad["surfaceTexture"], string> = {
    smooth: "гладкая",
    textured: "слабо абразивная",
    abrasive: "абразивная",
    glass: "стекло",
  };
  return map[t];
}

/** Формат чисел трения: одинаковый вид во всех таблицах и карточках. */
export function fmtFriction(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

/**
 * Индекс скольжения 0–100, выводимый из измеренного трения.
 * Раньше это поле задавалось вручную и противоречило данным cisA,
 * поэтому теперь единственный источник истины — средняя динамика.
 */
export function glideSpeedIndex(pad: Mousepad): number {
  return Math.round(100 - frictionPercent(pad));
}

export function frictionSourceLabel(s: FrictionSource): string {
  const map: Record<FrictionSource, string> = {
    cisA: "измерено (cisA)",
    "cisA-proxy": "по близкой модели cisA",
    estimated: "оценка, не измерено",
  };
  return map[s];
}

/** Является ли значение прямым измерением из таблицы cisA. */
export function isMeasured(pad: Mousepad): boolean {
  return pad.frictionSource === "cisA";
}
