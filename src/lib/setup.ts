import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import { GAMES, cm360, getGame, sensBand, type GameId, type SensBand } from "@/lib/games";
import { analyzeSynergy, type SynergyResult } from "@/lib/synergy";
import type { Glide, GripStyle, Keyboard, Mouse, Mousepad } from "@/lib/types";

export interface SetupSelection {
  mouseSlug: string | null;
  keyboardSlug: string | null;
  padSlug: string | null;
  glideSlug: string | null;
  dpi: number;
  sens: number;
  grip: GripStyle;
  gameId: GameId;
}

export const defaultSetup: SetupSelection = {
  mouseSlug: null,
  keyboardSlug: null,
  padSlug: null,
  glideSlug: null,
  dpi: 800,
  sens: 1,
  grip: "claw",
  gameId: "cs2",
};

export interface ResolvedSetup {
  mouse: Mouse | null;
  keyboard: Keyboard | null;
  pad: Mousepad | null;
  glide: Glide | null;
  dpi: number;
  sens: number;
  grip: GripStyle;
  gameId: GameId;
  /** Заполненность: сколько из четырёх устройств выбрано. */
  filled: number;
  edpi: number;
  cm360: number | null;
  band: SensBand | null;
  /** Синергия доступна только когда выбраны мышь, коврик и глайды. */
  synergy: SynergyResult | null;
  totalPriceUsd: number;
  /** Совпадает ли форма мыши с заявленным хватом. */
  gripMatch: boolean | null;
  notes: string[];
}

export function resolveSetup(s: SetupSelection): ResolvedSetup {
  const mouse = s.mouseSlug ? mice.find((m) => m.slug === s.mouseSlug) ?? null : null;
  const keyboard = s.keyboardSlug
    ? keyboards.find((k) => k.slug === s.keyboardSlug) ?? null
    : null;
  const pad = s.padSlug ? pads.find((p) => p.slug === s.padSlug) ?? null : null;
  const glide = s.glideSlug ? glides.find((g) => g.slug === s.glideSlug) ?? null : null;

  const filled = [mouse, keyboard, pad, glide].filter(Boolean).length;
  const game = getGame(s.gameId);

  const validInput = s.dpi > 0 && s.sens > 0;
  const cm = validInput ? cm360(game.yaw, s.sens, s.dpi) : null;
  const band = cm !== null ? sensBand(cm) : null;

  const synergy =
    mouse && pad && glide
      ? analyzeSynergy({
          mouse,
          pad,
          glide,
          sens: band === "low" ? "low" : band === "high" ? "high" : "medium",
        })
      : null;

  const totalPriceUsd =
    (mouse?.priceUsd ?? 0) +
    (keyboard?.priceUsd ?? 0) +
    (pad?.priceUsd ?? 0) +
    (glide?.priceUsd ?? 0);

  const gripMatch = mouse ? mouse.grips.includes(s.grip) : null;

  const notes: string[] = [];

  if (mouse && gripMatch === false) {
    notes.push(
      `Форма ${mouse.brand} ${mouse.name} рассчитана на другой хват: производитель заявляет ${mouse.grips.join(", ")}. Это не запрет, но комфорт может пострадать.`,
    );
  }

  if (band === "low" && pad) {
    notes.push(
      "Низкая чувствительность требует запаса свободного хода: убедитесь, что коврик размера L или больше и на столе хватает места для полного разворота.",
    );
  }

  if (mouse && mouse.pollingHz >= 8000 && band === "low") {
    notes.push(
      "8000 Hz при низкой чувствительности почти не даёт выигрыша, но нагружает процессор. Можно оставить 1000 Hz.",
    );
  }

  if (keyboard && band === "low" && (keyboard.layout === "full" || keyboard.layout === "tkl")) {
    notes.push(
      `Раскладка ${keyboard.layout === "full" ? "полного размера" : "TKL"} отнимает место у мыши. При низкой чувствительности компактные 60–75% дают больше свободы.`,
    );
  }

  if (keyboard && keyboard.specSource === "estimated") {
    notes.push(
      `Характеристики ${keyboard.brand} ${keyboard.name} помечены как требующие проверки — сверьтесь с официальным описанием перед покупкой.`,
    );
  }

  if (pad && pad.frictionSource !== "cisA") {
    notes.push(
      `Метрики трения ${pad.brand} ${pad.name} не измерены напрямую, поэтому расчёт синергии для этой связки ориентировочный.`,
    );
  }

  return {
    mouse,
    keyboard,
    pad,
    glide,
    dpi: s.dpi,
    sens: s.sens,
    grip: s.grip,
    gameId: s.gameId,
    filled,
    edpi: validInput ? s.dpi * s.sens : 0,
    cm360: cm,
    band,
    synergy,
    totalPriceUsd,
    gripMatch,
    notes,
  };
}

/* ---------- Кодирование сетапа в URL ---------- */

const grips: GripStyle[] = ["palm", "claw", "fingertip"];

export function setupToQuery(s: SetupSelection): Record<string, string> {
  const q: Record<string, string> = {
    dpi: String(s.dpi),
    sens: String(s.sens),
    grip: s.grip,
    game: s.gameId,
  };
  if (s.mouseSlug) q.m = s.mouseSlug;
  if (s.keyboardSlug) q.k = s.keyboardSlug;
  if (s.padSlug) q.p = s.padSlug;
  if (s.glideSlug) q.g = s.glideSlug;
  return q;
}

function num(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Разбор сетапа из query. Неизвестные slug отбрасываются. */
export function setupFromParams(params: URLSearchParams): SetupSelection {
  const gripRaw = params.get("grip");
  const gameRaw = params.get("game");

  const m = params.get("m");
  const k = params.get("k");
  const p = params.get("p");
  const g = params.get("g");

  return {
    mouseSlug: m && mice.some((x) => x.slug === m) ? m : null,
    keyboardSlug: k && keyboards.some((x) => x.slug === k) ? k : null,
    padSlug: p && pads.some((x) => x.slug === p) ? p : null,
    glideSlug: g && glides.some((x) => x.slug === g) ? g : null,
    dpi: num(params.get("dpi"), defaultSetup.dpi),
    sens: num(params.get("sens"), defaultSetup.sens),
    grip: grips.includes(gripRaw as GripStyle) ? (gripRaw as GripStyle) : defaultSetup.grip,
    gameId: GAMES.some((x) => x.id === gameRaw)
      ? (gameRaw as GameId)
      : defaultSetup.gameId,
  };
}

/**
 * Чтение сохранённого сетапа напрямую, без хука.
 * Значение проходит ту же валидацию, что и данные из URL:
 * устаревшие slug после изменений в базе отбрасываются.
 */
export function readSavedSetup(): SetupSelection | null {
  try {
    const raw = window.localStorage.getItem("gearlab:setup:v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SetupSelection>;
    const query = new URLSearchParams();
    if (parsed.mouseSlug) query.set("m", parsed.mouseSlug);
    if (parsed.keyboardSlug) query.set("k", parsed.keyboardSlug);
    if (parsed.padSlug) query.set("p", parsed.padSlug);
    if (parsed.glideSlug) query.set("g", parsed.glideSlug);
    if (parsed.dpi) query.set("dpi", String(parsed.dpi));
    if (parsed.sens) query.set("sens", String(parsed.sens));
    if (parsed.grip) query.set("grip", parsed.grip);
    if (parsed.gameId) query.set("game", parsed.gameId);
    return setupFromParams(query);
  } catch {
    return null;
  }
}

/** Текстовая сводка сетапа для копирования в Discord или на форум. */
export function setupToText(r: ResolvedSetup, shareUrl: string): string {
  const lines: string[] = ["Мой сетап — GearLab", ""];

  if (r.mouse) lines.push(`Мышь: ${r.mouse.brand} ${r.mouse.name} (${r.mouse.weightG} г)`);
  if (r.keyboard) lines.push(`Клавиатура: ${r.keyboard.brand} ${r.keyboard.name}`);
  if (r.pad) lines.push(`Коврик: ${r.pad.brand} ${r.pad.name}`);
  if (r.glide) lines.push(`Глайды: ${r.glide.brand} ${r.glide.name}`);

  lines.push("");
  lines.push(`DPI: ${r.dpi} · Сенса: ${r.sens} · eDPI: ${Math.round(r.edpi)}`);
  if (r.cm360 !== null) lines.push(`cm/360: ${r.cm360.toFixed(1)} см`);
  if (r.synergy) {
    lines.push(
      `Синергия: ${r.synergy.score}/100 (сопротивление ${r.synergy.effectiveResistance.toFixed(2)})`,
    );
  }

  lines.push("");
  lines.push(shareUrl);

  return lines.join("\n");
}
