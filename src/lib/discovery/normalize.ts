import type { DiscoveryCandidate, DuplicateSuspect } from "@/lib/discovery/types";

/**
 * Нормализация названий и поиск дубликатов.
 *
 * Задача не абстрактная: в базе уже есть Nova Union «Тьма», а рынок
 * называет ту же линейку Dark и Darkness. Без сопоставления кириллицы,
 * транслита и перевода движок создаст три записи об одном товаре.
 */

/** Кириллица → латиница по практике русских названий периферии. */
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

/**
 * Известные соответствия русских и английских названий линеек.
 * Список пополняется вручную: автоматический перевод здесь опаснее,
 * чем пропущенный дубликат.
 */
const NAME_EQUIVALENTS: [string, string[]][] = [
  ["tma", ["dark", "darkness", "tmavv"]],
  ["iskra", ["spark", "iskrar"]],
  ["volna", ["wave"]],
  ["mgla", ["haze", "mist", "fog"]],
  ["lotos", ["lotus"]],
  ["foton", ["photon"]],
  ["almaz", ["diamond"]],
  ["kvartz", ["quartz", "kvarts"]],
  ["grafit", ["graphite"]],
  ["led", ["ice"]],
  ["molniya", ["lightning"]],
];

/** Слова, не влияющие на идентичность продукта. */
const NOISE = new Set([
  "mouse",
  "skates",
  "skatez",
  "glides",
  "glide",
  "feet",
  "dots",
  "pad",
  "mousepad",
  "gaming",
  "edition",
  "set",
  "pack",
  "for",
  "the",
  "and",
  "wireless",
  "wired",
]);

export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("");
}

/** Приведение к сравнимому виду: транслит, удаление шума и пунктуации. */
export function normalizeName(input: string): string {
  const base = transliterate(input)
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = base.split(" ").filter((t) => t && !NOISE.has(t));
  return tokens.join(" ");
}

/** Канонизация версии: v2, V2, версия 2 и «2» приводятся к одному виду. */
export function extractVersion(input: string): string | null {
  const normalized = transliterate(input).toLowerCase();
  const patterns = [
    /\bv\s*([0-9]+)\b/,
    /\bversiya\s*([0-9]+)\b/,
    /\bversion\s*([0-9]+)\b/,
    /\bgen\s*([0-9]+)\b/,
    /\bmk\s*([0-9]+)\b/,
  ];
  for (const p of patterns) {
    const m = normalized.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Набор эквивалентных форм названия, включая переводы линеек. */
function expandVariants(normalized: string): Set<string> {
  const variants = new Set<string>([normalized]);
  const tokens = normalized.split(" ");

  for (const [ru, ens] of NAME_EQUIVALENTS) {
    if (tokens.includes(ru)) {
      for (const en of ens) {
        variants.add(tokens.map((t) => (t === ru ? en : t)).join(" "));
      }
    }
    for (const en of ens) {
      if (tokens.includes(en)) {
        variants.add(tokens.map((t) => (t === en ? ru : t)).join(" "));
      }
    }
  }

  return variants;
}

/** Расстояние Левенштейна для коротких строк. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }

  return prev[b.length];
}

function ratio(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

/** Схожесть с учётом эквивалентных форм названия. */
export function nameSimilarity(left: string, right: string): number {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (!a || !b) return 0;

  let best = 0;
  for (const va of expandVariants(a)) {
    for (const vb of expandVariants(b)) {
      best = Math.max(best, ratio(va, vb));
      if (best === 1) return 1;
    }
  }
  return best;
}

/** Хост URL без www — для сравнения ссылок производителя. */
export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export interface ExistingEntry {
  id: string;
  brand: string;
  name: string;
  category: string;
  sourceUrls?: string[];
}

const DUPLICATE_THRESHOLD = 0.72;

/**
 * Поиск возможных дубликатов. Возвращает подозрения, а не решение:
 * запись отправляется человеку, а не перезаписывается автоматически.
 */
export function findDuplicates(
  candidate: Pick<DiscoveryCandidate, "brand" | "model" | "category" | "sources">,
  existing: ExistingEntry[],
): DuplicateSuspect[] {
  const candidateVersion = extractVersion(candidate.model);
  const candidateHosts = new Set(
    candidate.sources.map((s) => hostOf(s.url)).filter(Boolean) as string[],
  );

  const suspects: DuplicateSuspect[] = [];

  for (const entry of existing) {
    const reasons: string[] = [];

    const brandSim = nameSimilarity(candidate.brand, entry.brand);
    const modelSim = nameSimilarity(candidate.model, entry.name);
    const sameCategory = entry.category === candidate.category;

    // Разные бренды почти всегда означают разные продукты.
    if (brandSim < 0.7) continue;
    if (brandSim >= 0.99) reasons.push("совпадает бренд");
    else reasons.push(`похожий бренд (${Math.round(brandSim * 100)}%)`);

    const entryVersion = extractVersion(entry.name);
    const versionsDiffer =
      candidateVersion !== null && entryVersion !== null && candidateVersion !== entryVersion;

    if (versionsDiffer) {
      // Разные версии — это разные товары, но связь стоит показать.
      reasons.push(`разные версии: v${entryVersion} и v${candidateVersion}`);
    }

    let similarity = brandSim * 0.3 + modelSim * 0.7;

    if (modelSim >= 0.99) reasons.push("совпадает модель");
    else if (modelSim >= DUPLICATE_THRESHOLD)
      reasons.push(`похожая модель (${Math.round(modelSim * 100)}%)`);

    // Совпадение домена производителя — сильный признак.
    const entryHosts = new Set(
      (entry.sourceUrls ?? []).map((u) => hostOf(u)).filter(Boolean) as string[],
    );
    const sharedHost = [...candidateHosts].some((h) => entryHosts.has(h));
    if (sharedHost) {
      similarity = Math.min(1, similarity + 0.1);
      reasons.push("совпадает домен источника");
    }

    if (!sameCategory) {
      similarity -= 0.25;
      reasons.push("категории различаются");
    }

    if (versionsDiffer) similarity -= 0.2;

    if (similarity >= DUPLICATE_THRESHOLD * 0.85) {
      suspects.push({
        targetId: entry.id,
        targetLabel: `${entry.brand} ${entry.name}`,
        similarity: Math.max(0, Math.min(1, similarity)),
        reasons,
      });
    }
  }

  return suspects.sort((a, b) => b.similarity - a.similarity);
}

/** Дубликаты внутри самой очереди кандидатов. */
export function findInternalDuplicates(
  candidates: DiscoveryCandidate[],
): { left: string; right: string; similarity: number }[] {
  const pairs: { left: string; right: string; similarity: number }[] = [];

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      if (a.category !== b.category) continue;
      const brandSim = nameSimilarity(a.brand, b.brand);
      if (brandSim < 0.7) continue;
      const modelSim = nameSimilarity(a.model, b.model);
      const similarity = brandSim * 0.3 + modelSim * 0.7;
      if (similarity >= DUPLICATE_THRESHOLD) {
        pairs.push({ left: a.id, right: b.id, similarity });
      }
    }
  }

  return pairs.sort((x, y) => y.similarity - x.similarity);
}
