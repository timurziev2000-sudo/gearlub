import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import { avgDynamic } from "@/lib/friction";
import type { DiscoveryCategory } from "@/lib/discovery/types";

/**
 * Trend Engine.
 *
 * Важное ограничение: тренд — это изменение во времени, а текущая база
 * даёт только срез. Поэтому здесь два разных вида результата:
 *
 *   1. Структурный срез (structural) — доля признака в базе прямо сейчас.
 *      Считается всегда, но НЕ является трендом.
 *   2. Динамика (temporal) — сравнение периодов. Считается только там,
 *      где у записей есть даты, либо между двумя снимками базы.
 *
 * Смешивать их нельзя: иначе «в базе много стеклянных глайдов» превратится
 * в ложное утверждение «стеклянные глайды набирают популярность».
 */

export type TrendKind = "structural" | "temporal";

export type TrendDirection = "rising" | "flat" | "declining" | "unknown";

export interface MarketTrend {
  id: string;
  category: DiscoveryCategory;
  title: string;
  kind: TrendKind;
  direction: TrendDirection;
  /** Доля признака в базе, 0–1. */
  share: number;
  /** Абсолютное число записей с признаком. */
  count: number;
  total: number;
  /** Изменение доли между периодами, только для kind === "temporal". */
  deltaShare?: number;
  detail: string;
  /** Честное описание того, чего эти данные не доказывают. */
  caveat: string;
}

function share(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/* ---------- Структурный срез ---------- */

const STRUCTURAL_CAVEAT =
  "Это доля в базе GearLab, а не доля на рынке. Отражает состав каталога, а не динамику спроса.";

export function structuralTrends(): MarketTrend[] {
  const out: MarketTrend[] = [];

  /* Глайды */
  const glideTotal = glides.length;

  const hardMaterials = glides.filter(
    (g) => g.material === "glass" || g.material === "ceramic",
  );
  out.push({
    id: "glides-hard-materials",
    category: "glide",
    title: "Стекло и керамика среди глайдов",
    kind: "structural",
    direction: "unknown",
    share: share(hardMaterials.length, glideTotal),
    count: hardMaterials.length,
    total: glideTotal,
    detail: `${hardMaterials.length} из ${glideTotal} моделей — закалённое стекло или керамика (${pct(share(hardMaterials.length, glideTotal))}).`,
    caveat: STRUCTURAL_CAVEAT,
  });

  const uhmw = glides.filter((g) => g.material === "uhmw-pe");
  out.push({
    id: "glides-uhmw",
    category: "glide",
    title: "UHMW-PE как альтернатива PTFE",
    kind: "structural",
    direction: "unknown",
    share: share(uhmw.length, glideTotal),
    count: uhmw.length,
    total: glideTotal,
    detail:
      uhmw.length === 0
        ? "В базе нет моделей из UHMW-PE."
        : `${uhmw.length} модел(ей) из UHMW-PE: ${uhmw.map((g) => `${g.brand} ${g.name}`).join(", ")}.`,
    caveat: STRUCTURAL_CAVEAT,
  });

  const dots = glides.filter((g) => g.form === "dots");
  out.push({
    id: "glides-dots",
    category: "glide",
    title: "Универсальные точки против комплектов под модель",
    kind: "structural",
    direction: "unknown",
    share: share(dots.length, glideTotal),
    count: dots.length,
    total: glideTotal,
    detail: `${dots.length} из ${glideTotal} — универсальные точки, остальные привязаны к конкретным мышам.`,
    caveat: STRUCTURAL_CAVEAT,
  });

  /* Мыши */
  const mouseTotal = mice.length;

  const highPolling = mice.filter((m) => m.pollingHz >= 8000);
  out.push({
    id: "mice-8k",
    category: "mouse",
    title: "Опрос 8000 Hz",
    kind: "structural",
    direction: "unknown",
    share: share(highPolling.length, mouseTotal),
    count: highPolling.length,
    total: mouseTotal,
    detail: `${highPolling.length} из ${mouseTotal} мышей заявляют 8000 Hz (${pct(share(highPolling.length, mouseTotal))}).`,
    caveat:
      "Заявленный polling rate не доказывает стабильность режима: реальная частота проверяется отдельным тестом.",
  });

  const ultralight = mice.filter((m) => m.weightG <= 45);
  out.push({
    id: "mice-ultralight",
    category: "mouse",
    title: "Ультралёгкие корпуса до 45 г",
    kind: "structural",
    direction: "unknown",
    share: share(ultralight.length, mouseTotal),
    count: ultralight.length,
    total: mouseTotal,
    detail: `${ultralight.length} модел(ей) весят 45 г или меньше. Минимум в базе — ${Math.min(...mice.map((m) => m.weightG))} г.`,
    caveat: STRUCTURAL_CAVEAT,
  });

  const paw3950 = mice.filter((m) => m.sensor.includes("3950"));
  out.push({
    id: "mice-paw3950",
    category: "mouse",
    title: "Сенсоры семейства PAW3950",
    kind: "structural",
    direction: "unknown",
    share: share(paw3950.length, mouseTotal),
    count: paw3950.length,
    total: mouseTotal,
    detail: `${paw3950.length} из ${mouseTotal} мышей используют PAW3950 или его вариации.`,
    caveat: STRUCTURAL_CAVEAT,
  });

  /* Клавиатуры */
  const kbTotal = keyboards.length;

  const he = keyboards.filter((k) => k.hallEffect);
  out.push({
    id: "kb-hall-effect",
    category: "keyboard",
    title: "Магнитные Hall Effect платы",
    kind: "structural",
    direction: "unknown",
    share: share(he.length, kbTotal),
    count: he.length,
    total: kbTotal,
    detail: `${he.length} из ${kbTotal} клавиатур — Hall Effect (${pct(share(he.length, kbTotal))}).`,
    caveat: STRUCTURAL_CAVEAT,
  });

  const analog = keyboards.filter((k) => k.analogInput);
  out.push({
    id: "kb-analog",
    category: "keyboard",
    title: "Аналоговый ввод и SOCD-функции",
    kind: "structural",
    direction: "unknown",
    share: share(analog.length, kbTotal),
    count: analog.length,
    total: kbTotal,
    detail: `${analog.length} модел(ей) заявляют аналоговый ввод.`,
    caveat:
      "Поддержка аналогового ввода не означает разрешённость соответствующих функций в турнирных правилах.",
  });

  const compact = keyboards.filter((k) => k.layout === "60%" || k.layout === "65%");
  out.push({
    id: "kb-compact",
    category: "keyboard",
    title: "Компактные форматы 60–65%",
    kind: "structural",
    direction: "unknown",
    share: share(compact.length, kbTotal),
    count: compact.length,
    total: kbTotal,
    detail: `${compact.length} из ${kbTotal} — форматы 60% или 65%, освобождающие место для мыши.`,
    caveat: STRUCTURAL_CAVEAT,
  });

  /* Коврики */
  const padTotal = pads.length;

  const measured = pads.filter((p) => p.frictionSource === "cisA");
  out.push({
    id: "pads-measured",
    category: "mousepad",
    title: "Коврики с измеренным трением",
    kind: "structural",
    direction: "unknown",
    share: share(measured.length, padTotal),
    count: measured.length,
    total: padTotal,
    detail: `${measured.length} из ${padTotal} ковриков имеют прямые измерения cisA, остальные — оценки или значения по близким моделям.`,
    caveat:
      "Это показатель качества данных GearLab, а не свойство рынка.",
  });

  const slow = pads.filter((p) => avgDynamic(p) >= 24);
  out.push({
    id: "pads-control",
    category: "mousepad",
    title: "Коврики высокого контроля",
    kind: "structural",
    direction: "unknown",
    share: share(slow.length, padTotal),
    count: slow.length,
    total: padTotal,
    detail: `${slow.length} модел(ей) имеют среднюю динамику 24 и выше — выраженный контроль.`,
    caveat: STRUCTURAL_CAVEAT,
  });

  return out.sort((a, b) => b.share - a.share);
}

/* ---------- Динамика по датам релиза ---------- */

/**
 * Единственная категория, где в базе есть даты, — клавиатуры
 * с полем releaseYear. Поэтому честную динамику можно посчитать
 * только для них.
 */
export function temporalTrends(currentYear: number): MarketTrend[] {
  const dated = keyboards.filter((k) => k.releaseYear !== undefined);
  if (dated.length === 0) return [];

  const recent = dated.filter((k) => (k.releaseYear as number) >= currentYear - 1);
  const older = dated.filter((k) => (k.releaseYear as number) < currentYear - 1);

  const out: MarketTrend[] = [];

  const heRecent = recent.filter((k) => k.hallEffect).length;
  const heOlder = older.filter((k) => k.hallEffect).length;
  const shareRecent = share(heRecent, recent.length);
  const shareOlder = share(heOlder, older.length);
  const delta = shareRecent - shareOlder;

  out.push({
    id: "kb-he-dynamics",
    category: "keyboard",
    title: "Доля Hall Effect среди новых клавиатур",
    kind: "temporal",
    direction: delta > 0.1 ? "rising" : delta < -0.1 ? "declining" : "flat",
    share: shareRecent,
    count: heRecent,
    total: recent.length,
    deltaShare: delta,
    detail: `Среди моделей ${currentYear - 1}–${currentYear} годов Hall Effect у ${pct(shareRecent)}, среди более ранних — ${pct(shareOlder)}.`,
    caveat: `Выборка небольшая: ${recent.length} новых и ${older.length} более ранних записей. Часть характеристик помечена как требующая проверки.`,
  });

  const pollRecent = recent.filter((k) => k.pollRateHz >= 8000).length;
  const pollOlder = older.filter((k) => k.pollRateHz >= 8000).length;
  const pollShareRecent = share(pollRecent, recent.length);
  const pollShareOlder = share(pollOlder, older.length);
  const pollDelta = pollShareRecent - pollShareOlder;

  out.push({
    id: "kb-8k-dynamics",
    category: "keyboard",
    title: "Опрос 8000 Hz среди новых клавиатур",
    kind: "temporal",
    direction: pollDelta > 0.1 ? "rising" : pollDelta < -0.1 ? "declining" : "flat",
    share: pollShareRecent,
    count: pollRecent,
    total: recent.length,
    deltaShare: pollDelta,
    detail: `У новых моделей 8000 Hz заявлен в ${pct(pollShareRecent)} случаев против ${pct(pollShareOlder)} у более ранних.`,
    caveat: `Выборка небольшая: ${recent.length} новых записей. Заявленная частота не проверена измерением.`,
  });

  return out;
}

/* ---------- Снимки базы для будущей динамики ---------- */

export interface DatabaseSnapshot {
  takenOn: string;
  counts: Record<DiscoveryCategory, number>;
  features: Record<string, number>;
}

/**
 * Снимок текущего состава базы. Два снимка, снятые с интервалом,
 * дают настоящую динамику — до этого честнее показывать структуру.
 */
export function takeSnapshot(takenOn: string): DatabaseSnapshot {
  return {
    takenOn,
    counts: {
      mouse: mice.length,
      keyboard: keyboards.length,
      mousepad: pads.length,
      glide: glides.length,
      accessory: 0,
    },
    features: {
      "glide-glass-ceramic": glides.filter(
        (g) => g.material === "glass" || g.material === "ceramic",
      ).length,
      "glide-uhmw": glides.filter((g) => g.material === "uhmw-pe").length,
      "glide-dots": glides.filter((g) => g.form === "dots").length,
      "mouse-8k": mice.filter((m) => m.pollingHz >= 8000).length,
      "mouse-ultralight": mice.filter((m) => m.weightG <= 45).length,
      "kb-hall-effect": keyboards.filter((k) => k.hallEffect).length,
      "kb-analog": keyboards.filter((k) => k.analogInput).length,
      "pad-measured": pads.filter((p) => p.frictionSource === "cisA").length,
    },
  };
}

export interface SnapshotDiff {
  key: string;
  before: number;
  after: number;
  delta: number;
}

/** Сравнение двух снимков: основа для настоящих трендов. */
export function diffSnapshots(
  before: DatabaseSnapshot,
  after: DatabaseSnapshot,
): SnapshotDiff[] {
  const keys = new Set([
    ...Object.keys(before.features),
    ...Object.keys(after.features),
  ]);

  return [...keys]
    .map((key) => {
      const b = before.features[key] ?? 0;
      const a = after.features[key] ?? 0;
      return { key, before: b, after: a, delta: a - b };
    })
    .filter((d) => d.delta !== 0)
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}
