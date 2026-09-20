import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import { avgDynamic } from "@/lib/friction";
import {
  PRICE_SEGMENTS,
  type DiscoveryCategory,
  type PriceSegment,
} from "@/lib/discovery/types";

/**
 * Классификация опубликованной базы по ценовым сегментам.
 *
 * Границы заданы по категориям: глайды за 25 долларов — это премиум,
 * а мышь за те же деньги — бюджет. Сегмент считается по единственной
 * известной цене, поэтому достоверность помечена соответствующе:
 * позиционирование по одному наблюдению — это оценка.
 */

const BOUNDS: Record<DiscoveryCategory, number[]> = {
  mouse: [45, 80, 120, 170],
  keyboard: [50, 90, 150, 210],
  mousepad: [20, 35, 55, 80],
  glide: [7, 13, 20, 28],
  accessory: [10, 20, 35, 60],
};

export function segmentOf(category: DiscoveryCategory, priceUsd: number): PriceSegment {
  const bounds = BOUNDS[category];
  const index = bounds.findIndex((b) => priceUsd < b);
  return index === -1 ? PRICE_SEGMENTS[4] : PRICE_SEGMENTS[index];
}

export interface SegmentItem {
  slug: string;
  brand: string;
  name: string;
  category: DiscoveryCategory;
  priceUsd: number;
  segment: PriceSegment;
  href: string;
  /** Краткая техническая сводка. */
  meta: string;
  /** Статус достоверности характеристик, если он известен. */
  dataStatus: "confirmed" | "estimated" | "unknown";
  /** Год выхода, если известен. */
  releaseYear?: number;
  /** Ключевая метрика для сортировки внутри сегмента. */
  highlight?: string;
}

function mouseItems(): SegmentItem[] {
  return mice.map((m) => ({
    slug: m.slug,
    brand: m.brand,
    name: m.name,
    category: "mouse" as const,
    priceUsd: m.priceUsd,
    segment: segmentOf("mouse", m.priceUsd),
    href: `/database/mice/${m.slug}`,
    meta: `${m.weightG} г · ${m.sensor} · ${m.pollingHz} Hz`,
    // У мышей пока нет полей происхождения данных — это честнее показать.
    dataStatus: "unknown" as const,
    highlight: `${m.weightG} г`,
  }));
}

function keyboardItems(): SegmentItem[] {
  return keyboards.map((k) => ({
    slug: k.slug,
    brand: k.brand,
    name: k.name,
    category: "keyboard" as const,
    priceUsd: k.priceUsd,
    segment: segmentOf("keyboard", k.priceUsd),
    href: `/database/keyboards/${k.slug}`,
    meta: `${k.layout} · ${k.switches} · ${k.pollRateHz} Hz`,
    dataStatus:
      k.specSource === "official" || k.specSource === "user-provided"
        ? ("confirmed" as const)
        : k.specSource === "estimated"
          ? ("estimated" as const)
          : ("unknown" as const),
    releaseYear: k.releaseYear,
    highlight: k.hallEffect ? "Hall Effect" : "механика",
  }));
}

function padItems(): SegmentItem[] {
  return pads.map((p) => ({
    slug: p.slug,
    brand: p.brand,
    name: p.name,
    category: "mousepad" as const,
    priceUsd: p.priceUsd,
    segment: segmentOf("mousepad", p.priceUsd),
    href: `/database/pads/${p.slug}`,
    meta: `динамика ${avgDynamic(p).toFixed(2)} · ${p.thickness} мм`,
    dataStatus:
      p.frictionSource === "cisA"
        ? ("confirmed" as const)
        : ("estimated" as const),
    highlight: avgDynamic(p).toFixed(2),
  }));
}

function glideItems(): SegmentItem[] {
  return glides.map((g) => ({
    slug: g.slug,
    brand: g.brand,
    name: g.name,
    category: "glide" as const,
    priceUsd: g.priceUsd,
    segment: segmentOf("glide", g.priceUsd),
    href: "/database/glides",
    meta: `${g.material} · ${g.thicknessMm} мм · скорость ${g.speedIndex}/100`,
    dataStatus:
      g.specSource === "official" || g.specSource === "user-provided"
        ? ("confirmed" as const)
        : ("estimated" as const),
    highlight: `${g.speedIndex}/100`,
  }));
}

export function allSegmentItems(): SegmentItem[] {
  return [...mouseItems(), ...keyboardItems(), ...padItems(), ...glideItems()];
}

export function itemsInSegment(segment: PriceSegment): SegmentItem[] {
  return allSegmentItems()
    .filter((i) => i.segment === segment)
    .sort((a, b) => a.priceUsd - b.priceUsd);
}

export function segmentCounts(): Record<PriceSegment, number> {
  const items = allSegmentItems();
  return PRICE_SEGMENTS.reduce(
    (acc, s) => {
      acc[s] = items.filter((i) => i.segment === s).length;
      return acc;
    },
    {} as Record<PriceSegment, number>,
  );
}

/**
 * Подборка лучшего в сегменте.
 *
 * «Лучшее» здесь означает: подтверждённые данные и разумная цена
 * внутри сегмента. Это не рейтинг качества — для него нужны
 * лабораторные тесты, которых у GearLab пока нет.
 */
export interface SegmentPick {
  item: SegmentItem;
  reasons: string[];
}

export function picksForSegment(segment: PriceSegment, limit = 6): SegmentPick[] {
  const items = itemsInSegment(segment);

  const scored = items.map((item) => {
    const reasons: string[] = [];
    let score = 0;

    if (item.dataStatus === "confirmed") {
      score += 40;
      reasons.push("характеристики подтверждены источником");
    } else if (item.dataStatus === "estimated") {
      score += 10;
      reasons.push("часть характеристик требует проверки");
    } else {
      reasons.push("статус данных не установлен");
    }

    // Дешевле медианы сегмента — лучше соотношение цены.
    const median =
      items.length === 0
        ? item.priceUsd
        : [...items].sort((a, b) => a.priceUsd - b.priceUsd)[
            Math.floor(items.length / 2)
          ].priceUsd;
    if (item.priceUsd <= median) {
      score += 20;
      reasons.push("цена ниже медианы сегмента");
    }

    if (item.releaseYear && item.releaseYear >= new Date().getFullYear() - 1) {
      score += 15;
      reasons.push(`актуальная модель ${item.releaseYear} года`);
    }

    if (item.category === "mousepad" && item.dataStatus === "confirmed") {
      score += 15;
      reasons.push("есть прямые измерения трения");
    }

    return { item, reasons, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.item.priceUsd - b.item.priceUsd)
    .slice(0, limit)
    .map(({ item, reasons }) => ({ item, reasons }));
}

/* ---------- Новинки ---------- */

export interface ReleaseItem extends SegmentItem {
  releaseYear: number;
}

/**
 * Новинки по датам релиза. Работает только там, где даты есть:
 * сейчас это клавиатуры. Для остальных категорий поле releaseYear
 * ещё не заполнено, и выдумывать его нельзя.
 */
export function newReleases(sinceYear: number): ReleaseItem[] {
  return allSegmentItems()
    .filter((i): i is ReleaseItem => i.releaseYear !== undefined && i.releaseYear >= sinceYear)
    .sort((a, b) => b.releaseYear - a.releaseYear || a.brand.localeCompare(b.brand, "ru"));
}

/** Категории, у которых вообще нет данных о дате выхода. */
export function categoriesWithoutDates(): DiscoveryCategory[] {
  const items = allSegmentItems();
  const categories: DiscoveryCategory[] = ["mouse", "keyboard", "mousepad", "glide"];
  return categories.filter(
    (c) => !items.some((i) => i.category === c && i.releaseYear !== undefined),
  );
}

/* ---------- Бренды ---------- */

export interface BrandSummary {
  name: string;
  categories: DiscoveryCategory[];
  itemCount: number;
  minPriceUsd: number;
  maxPriceUsd: number;
  segments: PriceSegment[];
  confirmedShare: number;
}

export function brandSummaries(): BrandSummary[] {
  const items = allSegmentItems();
  const byBrand = new Map<string, SegmentItem[]>();

  for (const item of items) {
    const list = byBrand.get(item.brand) ?? [];
    list.push(item);
    byBrand.set(item.brand, list);
  }

  return [...byBrand.entries()]
    .map(([name, list]) => {
      const confirmed = list.filter((i) => i.dataStatus === "confirmed").length;
      return {
        name,
        categories: [...new Set(list.map((i) => i.category))],
        itemCount: list.length,
        minPriceUsd: Math.min(...list.map((i) => i.priceUsd)),
        maxPriceUsd: Math.max(...list.map((i) => i.priceUsd)),
        segments: [...new Set(list.map((i) => i.segment))].sort(
          (a, b) => PRICE_SEGMENTS.indexOf(a) - PRICE_SEGMENTS.indexOf(b),
        ),
        confirmedShare: list.length === 0 ? 0 : confirmed / list.length,
      };
    })
    .sort((a, b) => b.itemCount - a.itemCount || a.name.localeCompare(b.name, "ru"));
}
