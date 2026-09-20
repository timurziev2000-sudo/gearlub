import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import { avgDynamic, speedClass } from "@/lib/friction";
import { analyzeSynergy } from "@/lib/synergy";
import { segmentOf } from "@/lib/discovery/segments";
import type { PriceSegment } from "@/lib/discovery/types";
import type { Glide, GripStyle, Keyboard, Mouse, Mousepad } from "@/lib/types";

/**
 * AI Gear Advisor.
 *
 * Работает строго по базе GearLab: разбирает запрос на признаки,
 * фильтрует существующие записи и объясняет выбор. Товары
 * не изобретаются — если под запрос ничего не подходит,
 * советник честно говорит об этом.
 *
 * Это детерминированный разбор ключевых слов, а не языковая модель.
 * Плюс подхода: физически не может выдумать модель или характеристику.
 * Ограничение: не понимает произвольные формулировки так гибко, как LLM.
 */

export interface ParsedIntent {
  categories: ("mouse" | "keyboard" | "mousepad" | "glide")[];
  segments: PriceSegment[];
  budgetUsd: number | null;
  grip: GripStyle | null;
  wantsFast: boolean;
  wantsControl: boolean;
  wantsLightweight: boolean;
  maxWeightG: number | null;
  wantsWireless: boolean;
  wantsHallEffect: boolean;
  handSize: "small" | "large" | null;
  game: string | null;
  /** Что распознано — для показа пользователю. */
  recognized: string[];
  /** Что осталось непонятным. */
  unrecognized: string[];
}

const CATEGORY_WORDS: [string[], ParsedIntent["categories"][number]][] = [
  [["мышь", "мыши", "мышку", "мышка", "mouse"], "mouse"],
  [["клавиатур", "клава", "keyboard", "кейборд"], "keyboard"],
  [["коврик", "ковер", "ковёр", "падом", "пад", "mousepad", "pad"], "mousepad"],
  [["глайд", "глайды", "ножки", "скейт", "скейты", "skates", "glide", "feet"], "glide"],
];

const SEGMENT_WORDS: [string[], PriceSegment][] = [
  [["дешев", "недорог", "бюджет", "budget", "подешевле", "копейки"], "budget"],
  [["средн", "mid", "золотая середина"], "mid"],
  [["получше", "mid+"], "mid-plus"],
  [["премиум", "premium", "топов"], "premium"],
  [["флагман", "high-end", "лучшее", "без компромисс"], "high-end"],
];

const GRIP_WORDS: [string[], GripStyle][] = [
  [["ладонн", "palm"], "palm"],
  [["когтев", "claw", "клешн"], "claw"],
  [["пальцев", "fingertip", "финжертип"], "fingertip"],
];

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

export function parseIntent(query: string): ParsedIntent {
  const text = query.toLowerCase();
  const recognized: string[] = [];
  const unrecognized: string[] = [];

  const categories: ParsedIntent["categories"] = [];
  for (const [words, category] of CATEGORY_WORDS) {
    if (includesAny(text, words)) {
      categories.push(category);
      recognized.push(`категория: ${category}`);
    }
  }

  const segments: PriceSegment[] = [];
  for (const [words, segment] of SEGMENT_WORDS) {
    if (includesAny(text, words)) {
      segments.push(segment);
      recognized.push(`сегмент: ${segment}`);
    }
  }

  // Бюджет: «до 10000 рублей», «до 60 долларов», «до 5 тысяч».
  let budgetUsd: number | null = null;
  const rubMatch = text.match(/до\s*(\d+)\s*(?:тыс|k|тысяч)/);
  const rubPlain = text.match(/до\s*(\d{4,6})\s*(?:руб|₽|р\b)?/);
  const usdMatch =
    text.match(/до\s*\$\s*(\d{1,4})/) ?? text.match(/до\s*(\d{1,4})\s*(?:\$|долл|usd)/);

  if (usdMatch) {
    budgetUsd = Number(usdMatch[1]);
    recognized.push(`бюджет: $${budgetUsd}`);
  } else if (rubMatch) {
    // Курс приблизительный: результат — ориентир, а не точный расчёт.
    budgetUsd = Math.round((Number(rubMatch[1]) * 1000) / 95);
    recognized.push(`бюджет: ~${Number(rubMatch[1])} тыс. ₽ (≈$${budgetUsd})`);
  } else if (rubPlain) {
    budgetUsd = Math.round(Number(rubPlain[1]) / 95);
    recognized.push(`бюджет: ~${rubPlain[1]} ₽ (≈$${budgetUsd})`);
  }

  let grip: GripStyle | null = null;
  for (const [words, g] of GRIP_WORDS) {
    if (includesAny(text, words)) {
      grip = g;
      recognized.push(`хват: ${g}`);
      break;
    }
  }

  const wantsFast = includesAny(text, [
    "быстр",
    "скольз",
    "speed",
    "скорост",
    "разгон",
  ]);
  if (wantsFast) recognized.push("предпочтение: скорость");

  const wantsControl = includesAny(text, ["контрол", "control", "точност", "медленн"]);
  if (wantsControl) recognized.push("предпочтение: контроль");

  const wantsLightweight = includesAny(text, ["легк", "лёгк", "ультралайт", "lightweight"]);
  if (wantsLightweight) recognized.push("предпочтение: малый вес");

  const weightMatch = text.match(/до\s*(\d{2,3})\s*(?:г|грам)/);
  const maxWeightG = weightMatch ? Number(weightMatch[1]) : null;
  if (maxWeightG) recognized.push(`вес до ${maxWeightG} г`);

  const wantsWireless = includesAny(text, ["беспровод", "wireless", "без провод"]);
  if (wantsWireless) recognized.push("подключение: беспроводное");

  const wantsHallEffect = includesAny(text, [
    "hall",
    "холл",
    "магнит",
    "rapid trigger",
    "рапид",
  ]);
  if (wantsHallEffect) recognized.push("свичи: Hall Effect");

  const handSize = includesAny(text, ["маленьк", "небольш", "small"])
    ? ("small" as const)
    : includesAny(text, ["больш", "крупн", "large"])
      ? ("large" as const)
      : null;
  if (handSize) recognized.push(`размер кисти: ${handSize}`);

  const games = ["cs2", "cs 2", "valorant", "валорант", "warface", "варфейс", "apex", "pubg", "fortnite"];
  const game = games.find((g) => text.includes(g)) ?? null;
  if (game) recognized.push(`игра: ${game}`);

  if (categories.length === 0) {
    unrecognized.push("Не удалось определить категорию устройства.");
  }

  return {
    categories,
    segments,
    budgetUsd,
    grip,
    wantsFast,
    wantsControl,
    wantsLightweight,
    maxWeightG,
    wantsWireless,
    wantsHallEffect,
    handSize,
    game,
    recognized,
    unrecognized,
  };
}

/* ---------- Рекомендации ---------- */

export interface Recommendation {
  category: "mouse" | "keyboard" | "mousepad" | "glide";
  slug: string;
  label: string;
  href: string;
  priceUsd: number;
  segment: PriceSegment;
  score: number;
  reasons: string[];
  /** Предупреждения о данных или совместимости. */
  cautions: string[];
  dataStatus: "confirmed" | "estimated" | "unknown";
}

export interface AdvisorResult {
  intent: ParsedIntent;
  recommendations: Recommendation[];
  /** Почему список пуст или короток. */
  notes: string[];
}

function segmentMatches(intent: ParsedIntent, segment: PriceSegment): boolean {
  return intent.segments.length === 0 || intent.segments.includes(segment);
}

function recommendGlides(intent: ParsedIntent): Recommendation[] {
  return glides
    .map((g: Glide): Recommendation | null => {
      const segment = segmentOf("glide", g.priceUsd);
      const reasons: string[] = [];
      const cautions: string[] = [];
      let score = 40;

      if (!segmentMatches(intent, segment)) return null;
      if (intent.budgetUsd !== null && g.priceUsd > intent.budgetUsd) return null;

      if (intent.segments.includes(segment)) {
        score += 20;
        reasons.push(`соответствует сегменту ${segment}`);
      }

      if (intent.wantsFast) {
        score += (g.speedIndex - 50) * 0.6;
        if (g.speedIndex >= 70) reasons.push(`высокая скорость скольжения (${g.speedIndex}/100)`);
      }

      if (intent.wantsControl) {
        score += (60 - g.speedIndex) * 0.6;
        if (g.speedIndex <= 55) reasons.push(`контрольный профиль (${g.speedIndex}/100)`);
      }

      if (g.durabilityIndex >= 80) {
        score += 8;
        reasons.push(`высокий ресурс (${g.durabilityIndex}/100)`);
      }

      if (g.material === "ptfe") {
        cautions.push(
          "Чистый PTFE быстро стачивается на стеклянных и абразивных ковриках — проверьте связку в калькуляторе синергии.",
        );
      }

      const dataStatus =
        g.specSource === "official" || g.specSource === "user-provided"
          ? ("confirmed" as const)
          : ("estimated" as const);

      if (dataStatus === "estimated") {
        cautions.push("Характеристики являются оценкой и не подтверждены измерением.");
      }

      if (reasons.length === 0) reasons.push("подходит по базовым условиям запроса");

      return {
        category: "glide" as const,
        slug: g.slug,
        label: `${g.brand} ${g.name}`,
        href: "/database/glides",
        priceUsd: g.priceUsd,
        segment,
        score,
        reasons,
        cautions,
        dataStatus,
      };
    })
    .filter((r) => r !== null);
}

function recommendMice(intent: ParsedIntent): Recommendation[] {
  return mice
    .map((m: Mouse): Recommendation | null => {
      const segment = segmentOf("mouse", m.priceUsd);
      const reasons: string[] = [];
      const cautions: string[] = [];
      let score = 40;

      if (!segmentMatches(intent, segment)) return null;
      if (intent.budgetUsd !== null && m.priceUsd > intent.budgetUsd) return null;
      if (intent.maxWeightG !== null && m.weightG > intent.maxWeightG) return null;
      if (intent.wantsWireless && m.connectivity === "wired") return null;

      if (intent.grip && m.grips.includes(intent.grip)) {
        score += 20;
        reasons.push(`форма поддерживает ${intent.grip} хват`);
      } else if (intent.grip) {
        score -= 15;
        cautions.push(`производитель не заявляет ${intent.grip} хват для этой формы`);
      }

      if (intent.wantsLightweight) {
        score += Math.max(0, (70 - m.weightG) * 0.8);
        if (m.weightG <= 50) reasons.push(`вес ${m.weightG} г`);
      }

      if (intent.handSize === "small" && (m.handSize === "small" || m.handSize === "universal")) {
        score += 15;
        reasons.push("подходит для небольшой кисти");
      }
      if (intent.handSize === "large" && (m.handSize === "large" || m.handSize === "universal")) {
        score += 15;
        reasons.push("подходит для крупной кисти");
      }

      if (m.pollingHz >= 4000) {
        score += 5;
        reasons.push(`опрос ${m.pollingHz} Hz`);
      }

      cautions.push(
        "У мышей в базе нет полей достоверности данных: часть характеристик может быть оценкой.",
      );

      if (reasons.length === 0) reasons.push("подходит по базовым условиям запроса");

      return {
        category: "mouse" as const,
        slug: m.slug,
        label: `${m.brand} ${m.name}`,
        href: `/database/mice/${m.slug}`,
        priceUsd: m.priceUsd,
        segment,
        score,
        reasons,
        cautions,
        dataStatus: "unknown" as const,
      };
    })
    .filter((r) => r !== null);
}

function recommendPads(intent: ParsedIntent): Recommendation[] {
  return pads
    .map((p: Mousepad): Recommendation | null => {
      const segment = segmentOf("mousepad", p.priceUsd);
      const reasons: string[] = [];
      const cautions: string[] = [];
      let score = 40;

      if (!segmentMatches(intent, segment)) return null;
      if (intent.budgetUsd !== null && p.priceUsd > intent.budgetUsd) return null;

      const dyn = avgDynamic(p);
      const cls = speedClass(p);

      if (intent.wantsFast) {
        score += (24 - dyn) * 3;
        if (dyn < 20) reasons.push(`быстрая поверхность (динамика ${dyn.toFixed(2)})`);
      }

      if (intent.wantsControl) {
        score += (dyn - 18) * 3;
        if (dyn >= 23) reasons.push(`контрольная поверхность (динамика ${dyn.toFixed(2)})`);
      }

      if (p.frictionSource === "cisA") {
        score += 20;
        reasons.push("трение измерено напрямую по методике cisA");
      } else {
        cautions.push(
          p.frictionSource === "cisA-proxy"
            ? "Значения взяты по близкой модели той же линейки."
            : "Значения трения являются оценкой и не подтверждены измерением.",
        );
      }

      reasons.push(`класс: ${cls}`);

      return {
        category: "mousepad" as const,
        slug: p.slug,
        label: `${p.brand} ${p.name}`,
        href: `/database/pads/${p.slug}`,
        priceUsd: p.priceUsd,
        segment,
        score,
        reasons,
        cautions,
        dataStatus: p.frictionSource === "cisA" ? ("confirmed" as const) : ("estimated" as const),
      };
    })
    .filter((r) => r !== null);
}

function recommendKeyboards(intent: ParsedIntent): Recommendation[] {
  return keyboards
    .map((k: Keyboard): Recommendation | null => {
      const segment = segmentOf("keyboard", k.priceUsd);
      const reasons: string[] = [];
      const cautions: string[] = [];
      let score = 40;

      if (!segmentMatches(intent, segment)) return null;
      if (intent.budgetUsd !== null && k.priceUsd > intent.budgetUsd) return null;
      if (intent.wantsHallEffect && !k.hallEffect) return null;

      if (k.hallEffect && k.rapidTrigger) {
        score += 20;
        reasons.push("Hall Effect с Rapid Trigger");
      }

      if (k.pollRateHz >= 8000) {
        score += 8;
        reasons.push(`опрос ${k.pollRateHz} Hz`);
      }

      if (k.layout === "60%" || k.layout === "65%") {
        score += 6;
        reasons.push(`компактный формат ${k.layout} освобождает место для мыши`);
      }

      const dataStatus =
        k.specSource === "official" || k.specSource === "user-provided"
          ? ("confirmed" as const)
          : k.specSource === "estimated"
            ? ("estimated" as const)
            : ("unknown" as const);

      if (dataStatus === "estimated") {
        cautions.push("Характеристики не подтверждены первоисточником.");
      }

      if (reasons.length === 0) reasons.push("подходит по базовым условиям запроса");

      return {
        category: "keyboard" as const,
        slug: k.slug,
        label: `${k.brand} ${k.name}`,
        href: `/database/keyboards/${k.slug}`,
        priceUsd: k.priceUsd,
        segment,
        score,
        reasons,
        cautions,
        dataStatus,
      };
    })
    .filter((r) => r !== null);
}

export function advise(query: string, limit = 6): AdvisorResult {
  const intent = parseIntent(query);
  const notes: string[] = [];

  const categories =
    intent.categories.length > 0
      ? intent.categories
      : (["mouse", "mousepad", "glide", "keyboard"] as const);

  if (intent.categories.length === 0) {
    notes.push(
      "Категория не распознана — показаны варианты из всех категорий. Уточните, что именно вы ищете.",
    );
  }

  let all: Recommendation[] = [];
  for (const category of categories) {
    if (category === "glide") all = all.concat(recommendGlides(intent));
    if (category === "mouse") all = all.concat(recommendMice(intent));
    if (category === "mousepad") all = all.concat(recommendPads(intent));
    if (category === "keyboard") all = all.concat(recommendKeyboards(intent));
  }

  if (all.length === 0) {
    notes.push(
      "В базе GearLab нет устройств, удовлетворяющих всем условиям. Мы не предлагаем товары, которых нет в базе, — попробуйте ослабить требования.",
    );
  }

  if (intent.budgetUsd !== null) {
    notes.push(
      "Пересчёт бюджета из рублей выполнен по приблизительному курсу — ориентируйтесь на порядок величины.",
    );
  }

  if (intent.wantsFast && intent.wantsControl) {
    notes.push(
      "В запросе есть требования и к скорости, и к контролю — это противоположные свойства, приоритет отдан балансу.",
    );
  }

  const recommendations = all
    .sort((a, b) => b.score - a.score || a.priceUsd - b.priceUsd)
    .slice(0, limit);

  return { intent, recommendations, notes };
}

/**
 * Проверка связки, если пользователь указал и мышь, и коврик, и глайды.
 * Использует существующий движок синергии.
 */
export function checkCombination(
  mouseSlug: string,
  padSlug: string,
  glideSlug: string,
): { score: number; issues: string[] } | null {
  const mouse = mice.find((m) => m.slug === mouseSlug);
  const pad = pads.find((p) => p.slug === padSlug);
  const glide = glides.find((g) => g.slug === glideSlug);
  if (!mouse || !pad || !glide) return null;

  const result = analyzeSynergy({ mouse, pad, glide, sens: "medium" });
  return {
    score: result.score,
    issues: result.issues.map((i) => `${i.title}: ${i.detail}`),
  };
}
