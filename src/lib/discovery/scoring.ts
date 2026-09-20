import {
  CONFIDENCE_RANK,
  PRICE_SEGMENTS,
  type Confidence,
  type DiscoveryCandidate,
  type DiscoveryCategory,
  type MarketSignals,
  type PriceObservation,
  type PriceSegment,
  type SourceRef,
  SOURCE_PRIORITY,
} from "@/lib/discovery/types";

/**
 * Скоринг актуальности и популярности.
 *
 * Оба показателя — внутренние алгоритмические оценки, а не истина
 * о рынке. Они нужны для сортировки очереди и подсказок оператору.
 * Отсутствие сигнала не наказывается: скор считается по доступным
 * компонентам, а покрытие сообщается отдельно.
 */

export interface ScoreComponent {
  key: string;
  label: string;
  /** 0–1 или null, если сигнала нет. */
  normalized: number | null;
  weight: number;
  detail: string;
}

export interface ScoreResult {
  score: number;
  /** Доля весов, для которых нашлись данные. */
  coverage: number;
  components: ScoreComponent[];
  /** Можно ли доверять оценке: мало сигналов — низкая надёжность. */
  reliability: "low" | "medium" | "high";
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Логарифмическая нормализация: первые упоминания весят больше сотых. */
function logNorm(value: number, saturation: number): number {
  if (value <= 0) return 0;
  return clamp01(Math.log10(1 + value) / Math.log10(1 + saturation));
}

function daysBetween(fromIso: string, toIso: string): number | null {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86_400_000);
}

function assemble(components: ScoreComponent[]): ScoreResult {
  const available = components.filter((c) => c.normalized !== null);
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const usedWeight = available.reduce((sum, c) => sum + c.weight, 0);

  const score =
    usedWeight === 0
      ? 0
      : Math.round(
          (available.reduce((sum, c) => sum + (c.normalized as number) * c.weight, 0) /
            usedWeight) *
            100,
        );

  const coverage = totalWeight === 0 ? 0 : usedWeight / totalWeight;

  return {
    score,
    coverage,
    components,
    reliability: coverage >= 0.7 ? "high" : coverage >= 0.4 ? "medium" : "low",
  };
}

/**
 * Trend Score: насколько продукт актуален прямо сейчас.
 * Свежесть и рост упоминаний важнее абсолютных объёмов.
 */
export function trendScore(signals: MarketSignals, today: string): ScoreResult {
  const components: ScoreComponent[] = [];

  // Свежесть релиза: до 90 дней максимум, дальше плавное угасание к году.
  const releaseIso = signals.releaseDate.value;
  if (releaseIso) {
    const age = daysBetween(releaseIso, today);
    if (age === null) {
      components.push({
        key: "freshness",
        label: "свежесть релиза",
        normalized: null,
        weight: 22,
        detail: "дата релиза не распознана",
      });
    } else {
      const normalized = age <= 90 ? 1 : age >= 365 ? 0.1 : 1 - (age - 90) / 275 * 0.9;
      components.push({
        key: "freshness",
        label: "свежесть релиза",
        normalized: clamp01(normalized),
        weight: 22,
        detail: `${age} дн. с релиза`,
      });
    }
  } else {
    // Если релиз неизвестен, ориентируемся на дату обнаружения.
    const age = daysBetween(signals.discoveredOn, today);
    components.push({
      key: "freshness",
      label: "свежесть обнаружения",
      normalized: age === null ? null : clamp01(age <= 30 ? 1 : age >= 240 ? 0.1 : 1 - age / 240),
      weight: 22,
      detail: age === null ? "дата не распознана" : `${age} дн. с обнаружения`,
    });
  }

  // Рост упоминаний: сравнение двух периодов.
  if (signals.mentions30d !== undefined && signals.mentionsPrev30d !== undefined) {
    const prev = signals.mentionsPrev30d;
    const curr = signals.mentions30d;
    const growth = prev === 0 ? (curr > 0 ? 2 : 0) : curr / prev;
    components.push({
      key: "growth",
      label: "рост упоминаний",
      normalized: clamp01((growth - 0.8) / 1.7),
      weight: 24,
      detail: `${prev} → ${curr} за 30 дн.`,
    });
  } else {
    components.push({
      key: "growth",
      label: "рост упоминаний",
      normalized: null,
      weight: 24,
      detail: "нет данных за два периода",
    });
  }

  components.push({
    key: "mentions",
    label: "объём упоминаний",
    normalized: signals.mentions30d === undefined ? null : logNorm(signals.mentions30d, 200),
    weight: 14,
    detail:
      signals.mentions30d === undefined
        ? "нет данных"
        : `${signals.mentions30d} за 30 дн.`,
  });

  components.push({
    key: "manufacturer",
    label: "карточка у производителя",
    normalized:
      signals.listedByManufacturer === undefined ? null : signals.listedByManufacturer ? 1 : 0,
    weight: 12,
    detail:
      signals.listedByManufacturer === undefined
        ? "не проверено"
        : signals.listedByManufacturer
          ? "есть на сайте производителя"
          : "на сайте производителя не найдено",
  });

  components.push({
    key: "retail",
    label: "наличие в магазинах",
    normalized: signals.retailListings === undefined ? null : logNorm(signals.retailListings, 12),
    weight: 10,
    detail:
      signals.retailListings === undefined
        ? "нет данных"
        : `${signals.retailListings} магазинов`,
  });

  components.push({
    key: "reviews",
    label: "независимые обзоры",
    normalized:
      signals.independentReviews === undefined ? null : logNorm(signals.independentReviews, 15),
    weight: 10,
    detail:
      signals.independentReviews === undefined
        ? "нет данных"
        : `${signals.independentReviews} обзоров`,
  });

  components.push({
    key: "community",
    label: "обсуждения в сообществах",
    normalized:
      signals.communityThreads === undefined ? null : logNorm(signals.communityThreads, 40),
    weight: 8,
    detail:
      signals.communityThreads === undefined
        ? "нет данных"
        : `${signals.communityThreads} обсуждений`,
  });

  return assemble(components);
}

/**
 * Popularity Score: насколько продукт популярен сейчас,
 * без поправки на новизну. Давно известная модель может иметь
 * высокую популярность и низкий тренд одновременно.
 */
export function popularityScore(signals: MarketSignals): ScoreResult {
  const components: ScoreComponent[] = [
    {
      key: "mentions",
      label: "объём упоминаний",
      normalized: signals.mentions30d === undefined ? null : logNorm(signals.mentions30d, 300),
      weight: 22,
      detail:
        signals.mentions30d === undefined ? "нет данных" : `${signals.mentions30d} за 30 дн.`,
    },
    {
      key: "reviews",
      label: "независимые обзоры",
      normalized:
        signals.independentReviews === undefined
          ? null
          : logNorm(signals.independentReviews, 25),
      weight: 18,
      detail:
        signals.independentReviews === undefined
          ? "нет данных"
          : `${signals.independentReviews} обзоров`,
    },
    {
      key: "retail",
      label: "представленность в продаже",
      normalized: signals.retailListings === undefined ? null : logNorm(signals.retailListings, 20),
      weight: 14,
      detail:
        signals.retailListings === undefined ? "нет данных" : `${signals.retailListings} магазинов`,
    },
    {
      key: "search",
      label: "поисковый интерес",
      normalized: signals.searchInterest === undefined ? null : clamp01(signals.searchInterest / 100),
      weight: 12,
      detail:
        signals.searchInterest === undefined ? "источник недоступен" : `${signals.searchInterest}/100`,
    },
    {
      key: "gearlab-views",
      label: "просмотры в GearLab",
      normalized: signals.gearlabViews === undefined ? null : logNorm(signals.gearlabViews, 5000),
      weight: 14,
      detail: signals.gearlabViews === undefined ? "нет данных" : `${signals.gearlabViews} просмотров`,
    },
    {
      key: "gearlab-compare",
      label: "добавления в сравнение",
      normalized:
        signals.gearlabCompares === undefined ? null : logNorm(signals.gearlabCompares, 800),
      weight: 10,
      detail:
        signals.gearlabCompares === undefined ? "нет данных" : `${signals.gearlabCompares} сравнений`,
    },
    {
      key: "gearlab-favorites",
      label: "добавления в избранное",
      normalized:
        signals.gearlabFavorites === undefined ? null : logNorm(signals.gearlabFavorites, 600),
      weight: 10,
      detail:
        signals.gearlabFavorites === undefined
          ? "нет данных"
          : `${signals.gearlabFavorites} в избранном`,
    },
  ];

  return assemble(components);
}

/* ---------- Ценовые сегменты ---------- */

/**
 * Границы сегментов в долларах по категориям.
 * Значения отражают позиционирование на рынке периферии
 * и пересматриваются вручную при сдвиге цен.
 */
const SEGMENT_BOUNDS: Record<DiscoveryCategory, number[]> = {
  // [budget/mid, mid/mid+, mid+/premium, premium/high-end]
  mouse: [45, 80, 120, 170],
  keyboard: [50, 90, 150, 210],
  mousepad: [20, 35, 55, 80],
  glide: [7, 13, 20, 28],
  accessory: [10, 20, 35, 60],
};

export interface PriceSegmentResult {
  segment: PriceSegment | null;
  confidence: Confidence;
  medianUsd: number | null;
  observations: number;
  reason: string;
  /** Расхождение между источниками в процентах от медианы. */
  spread: number | null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Определение сегмента по нескольким наблюдениям цены.
 * Одно наблюдение даёт только оценку: цена одного магазина
 * не отражает позиционирование товара.
 */
export function priceSegment(
  category: DiscoveryCategory,
  prices: PriceObservation[],
): PriceSegmentResult {
  if (prices.length === 0) {
    return {
      segment: null,
      confidence: "unknown",
      medianUsd: null,
      observations: 0,
      reason: "Цены не найдены ни в одном источнике.",
      spread: null,
    };
  }

  const values = prices.map((p) => p.priceUsd).filter((v) => v > 0);
  if (values.length === 0) {
    return {
      segment: null,
      confidence: "unknown",
      medianUsd: null,
      observations: 0,
      reason: "Найденные цены некорректны.",
      spread: null,
    };
  }

  const med = median(values);
  const bounds = SEGMENT_BOUNDS[category];
  const index = bounds.findIndex((b) => med < b);
  const segment = index === -1 ? PRICE_SEGMENTS[4] : PRICE_SEGMENTS[index];

  const spread =
    values.length > 1 ? (Math.max(...values) - Math.min(...values)) / med : null;

  // Приоритет источника влияет на доверие к цене.
  const bestSource = prices.reduce(
    (best, p) =>
      SOURCE_PRIORITY[p.source.sourceType] > SOURCE_PRIORITY[best.source.sourceType] ? p : best,
    prices[0],
  );
  const official =
    bestSource.source.sourceType === "manufacturer" ||
    bestSource.source.sourceType === "official-store";

  let confidence: Confidence;
  let reason: string;

  if (values.length === 1) {
    confidence = official ? "manufacturer" : "estimated";
    reason = official
      ? "Одна цена из официального источника. Для устойчивого сегмента нужно несколько наблюдений."
      : "Одна цена из неофициального источника — сегмент определён предварительно.";
  } else if (spread !== null && spread > 0.6) {
    confidence = "estimated";
    reason = `Цены расходятся более чем на 60% от медианы (${values.length} наблюдений) — сегмент ориентировочный.`;
  } else {
    confidence = official ? "verified" : "secondary-source";
    reason = `Медиана по ${values.length} наблюдениям${official ? ", включая официальный источник" : ""}.`;
  }

  return {
    segment,
    confidence,
    medianUsd: med,
    observations: values.length,
    reason,
    spread,
  };
}

/* ---------- Разрешение противоречий между источниками ---------- */

export interface ConflictResolution<T> {
  value: T | null;
  confidence: Confidence;
  conflict: boolean;
  detail: string;
  sources: SourceRef[];
}

/**
 * Выбор значения при расхождении источников.
 * Официальный источник побеждает, но факт противоречия сохраняется:
 * молча затирать данные нельзя.
 */
export function resolveConflict<T>(
  claims: { value: T; source: SourceRef }[],
  equals: (a: T, b: T) => boolean = (a, b) => a === b,
): ConflictResolution<T> {
  if (claims.length === 0) {
    return {
      value: null,
      confidence: "unknown",
      conflict: false,
      detail: "Ни один источник не сообщает значение.",
      sources: [],
    };
  }

  const groups: { value: T; sources: SourceRef[] }[] = [];
  for (const claim of claims) {
    const group = groups.find((g) => equals(g.value, claim.value));
    if (group) group.sources.push(claim.source);
    else groups.push({ value: claim.value, sources: [claim.source] });
  }

  const rank = (sources: SourceRef[]) =>
    Math.max(...sources.map((s) => SOURCE_PRIORITY[s.sourceType]));

  groups.sort((a, b) => {
    const byRank = rank(b.sources) - rank(a.sources);
    return byRank !== 0 ? byRank : b.sources.length - a.sources.length;
  });

  const winner = groups[0];
  const conflict = groups.length > 1;
  const topRank = rank(winner.sources);

  let confidence: Confidence;
  if (topRank >= SOURCE_PRIORITY.manufacturer) {
    confidence = conflict ? "manufacturer" : "verified";
  } else if (topRank >= SOURCE_PRIORITY["review-site"]) {
    confidence = "secondary-source";
  } else {
    confidence = "estimated";
  }

  return {
    value: winner.value,
    confidence,
    conflict,
    detail: conflict
      ? `Источники расходятся (${groups.length} версии). Выбрана версия с наивысшим приоритетом источника.`
      : `Согласованное значение из ${winner.sources.length} источник(ов).`,
    sources: winner.sources,
  };
}

/** Итоговая достоверность записи — минимум по ключевым полям. */
export function overallConfidence(values: Confidence[]): Confidence {
  if (values.length === 0) return "unknown";
  return values.reduce(
    (min, c) => (CONFIDENCE_RANK[c] < CONFIDENCE_RANK[min] ? c : min),
    values[0],
  );
}

/** Готовность кандидата к публикации: без блокеров и с внятными данными. */
export function isPublishable(candidate: DiscoveryCandidate): boolean {
  return candidate.stage === "verified" || candidate.stage === "published";
}
