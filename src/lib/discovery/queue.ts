import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import type {
  BrandRecord,
  DiscoveryCandidate,
  DiscoveryCategory,
} from "@/lib/discovery/types";
import { unknownField } from "@/lib/discovery/types";
import type { ExistingEntry } from "@/lib/discovery/normalize";

/**
 * Очередь обнаруженных продуктов и реестр брендов.
 *
 * Здесь НЕТ выдуманных товаров. Очередь пуста до тех пор, пока
 * в неё не поступят данные из реального источника через приёмник
 * (см. ingest.ts). Это сознательное решение: заполнить очередь
 * правдоподобными записями означало бы нарушить главное правило —
 * не придумывать данные.
 */

export const discoveryQueue: DiscoveryCandidate[] = [];

/** Бренды, уже присутствующие в опубликованной базе. */
function knownBrandNames(): Map<string, DiscoveryCategory[]> {
  const map = new Map<string, DiscoveryCategory[]>();

  const add = (brand: string, category: DiscoveryCategory) => {
    const key = brand.trim();
    const list = map.get(key) ?? [];
    if (!list.includes(category)) list.push(category);
    map.set(key, list);
  };

  for (const m of mice) add(m.brand, "mouse");
  for (const k of keyboards) add(k.brand, "keyboard");
  for (const p of pads) add(p.brand, "mousepad");
  for (const g of glides) add(g.brand, "glide");

  return map;
}

/**
 * Известные бренды с альтернативными написаниями.
 * Алиасы нужны детектору дубликатов: рынок пишет одно и то же
 * по-разному, включая кириллицу.
 */
const BRAND_ALIASES: Record<string, string[]> = {
  "Nova Union": ["NovaUnion", "Нова Юнион", "NU"],
  "X-raypad": ["X-Raypad", "XRaypad", "Иксрейпад"],
  ESPTIGER: ["EspTiger", "ESP Tiger", "Эспртайгер"],
  Corepad: ["Core Pad", "Корпад"],
  Pulsar: ["Pulsar Gaming Gears", "PGG"],
  ProAim: ["Pro Aim", "ПроАйм"],
  "Tiger Gaming": ["TigerGaming", "Tiger"],
  MCHOSE: ["Mchose", "МЧОУЗ"],
  WLMouse: ["WLmouse", "WL Mouse"],
  Artisan: ["Артизан"],
  Kurosun: ["KuroSun", "Куросан"],
  "Lethal Gaming Gear": ["LGG", "Lethal Gaming"],
  MeowGamingGear: ["Meow Gaming Gear", "MGG"],
  Zowie: ["BenQ Zowie"],
  Wooting: ["Вутинг"],
  DrunkDeer: ["Drunk Deer"],
  Luminkey: ["LuminKey"],
  Akko: ["АККО"],
  Aula: ["АУЛА"],
  ATK: ["ATK Gaming"],
  VGN: ["VGN Gaming"],
  MonsGeek: ["Mons Geek"],
};

/**
 * Бренды, которые движок должен отслеживать в категории глайдов.
 * Список — стартовая точка мониторинга, а не ограничение:
 * новые производители добавляются автоматически при обнаружении.
 */
export const GLIDE_WATCHLIST = [
  "X-raypad",
  "Corepad",
  "Tiger Gaming",
  "ESPTIGER",
  "Nova Union",
  "Pulsar",
  "Wallhack",
  "BTL",
  "V-Tiger",
  "Lexip",
  "Ghostglides",
  "ProAim",
  "Hyperglide",
  "Superglide",
] as const;

export function brandRegistry(today: string): BrandRecord[] {
  const known = knownBrandNames();
  const records: BrandRecord[] = [];

  for (const [name, categories] of known) {
    records.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      aliases: BRAND_ALIASES[name] ?? [],
      categories,
      // Официальные сайты не проверялись автоматически, поэтому Unknown.
      officialSite: unknownField(
        "Официальный сайт не подтверждён автоматической проверкой.",
      ),
      known: true,
      stage: "published",
      discoveredOn: today,
    });
  }

  // Бренды из списка наблюдения, которых нет в базе.
  for (const name of GLIDE_WATCHLIST) {
    if (known.has(name)) continue;
    records.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      aliases: BRAND_ALIASES[name] ?? [],
      categories: ["glide"],
      officialSite: unknownField("Сайт не проверялся."),
      known: false,
      stage: "discovered",
      discoveredOn: today,
      note: "В списке наблюдения за глайдами, но в базе GearLab моделей нет.",
    });
  }

  return records.sort((a, b) => {
    if (a.known !== b.known) return a.known ? 1 : -1;
    return a.name.localeCompare(b.name, "ru");
  });
}

/** Плоский список опубликованных записей для детектора дубликатов. */
export function existingEntries(): ExistingEntry[] {
  return [
    ...mice.map((m) => ({
      id: m.slug,
      brand: m.brand,
      name: m.name,
      category: "mouse" as const,
    })),
    ...keyboards.map((k) => ({
      id: k.slug,
      brand: k.brand,
      name: k.name,
      category: "keyboard" as const,
      sourceUrls: k.sources?.map((s) => s.url),
    })),
    ...pads.map((p) => ({
      id: p.slug,
      brand: p.brand,
      name: p.name,
      category: "mousepad" as const,
    })),
    ...glides.map((g) => ({
      id: g.slug,
      brand: g.brand,
      name: g.name,
      category: "glide" as const,
    })),
  ];
}

/** Сколько записей каждой категории в опубликованной базе. */
export function publishedCounts(): Record<DiscoveryCategory, number> {
  return {
    mouse: mice.length,
    keyboard: keyboards.length,
    mousepad: pads.length,
    glide: glides.length,
    accessory: 0,
  };
}
