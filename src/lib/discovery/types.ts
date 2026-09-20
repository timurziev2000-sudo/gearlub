/**
 * Типы Market Discovery Engine.
 *
 * Главный принцип: каждое значение несёт уровень достоверности и ссылку
 * на источник. Отсутствие данных — это законное состояние Unknown,
 * а не повод подставить число.
 */

/** Уровень достоверности значения. Порядок важен: чем выше, тем надёжнее. */
export type Confidence =
  | "unknown"
  | "estimated"
  | "secondary-source"
  | "manufacturer"
  | "measured"
  | "verified";

export const CONFIDENCE_RANK: Record<Confidence, number> = {
  unknown: 0,
  estimated: 1,
  "secondary-source": 2,
  manufacturer: 3,
  measured: 4,
  verified: 5,
};

export function confidenceLabel(c: Confidence): string {
  const map: Record<Confidence, string> = {
    unknown: "неизвестно",
    estimated: "оценка",
    "secondary-source": "вторичный источник",
    manufacturer: "данные производителя",
    measured: "измерено",
    verified: "подтверждено",
  };
  return map[c];
}

/** Тип источника. Официальный сайт производителя имеет приоритет. */
export type SourceType =
  | "manufacturer"
  | "official-store"
  | "press-release"
  | "retailer"
  | "marketplace"
  | "review-site"
  | "reddit"
  | "youtube"
  | "community"
  | "lab"
  | "search";

export function sourceTypeLabel(t: SourceType): string {
  const map: Record<SourceType, string> = {
    manufacturer: "производитель",
    "official-store": "официальный магазин",
    "press-release": "пресс-релиз",
    retailer: "магазин",
    marketplace: "маркетплейс",
    "review-site": "обзорный сайт",
    reddit: "Reddit",
    youtube: "YouTube",
    community: "сообщество",
    lab: "лабораторный тест",
    search: "поисковый запрос",
  };
  return map[t];
}

/** Приоритет источника при разрешении противоречий. */
export const SOURCE_PRIORITY: Record<SourceType, number> = {
  manufacturer: 100,
  "official-store": 90,
  "press-release": 85,
  lab: 80,
  "review-site": 60,
  retailer: 55,
  marketplace: 50,
  reddit: 40,
  community: 40,
  youtube: 35,
  search: 10,
};

export interface SourceRef {
  url: string;
  sourceType: SourceType;
  /** Дата обращения к источнику в формате YYYY-MM-DD. */
  sourceDate: string;
  label?: string;
}

/**
 * Значение с происхождением. Если value === null, поле не найдено,
 * и reason обязателен: пользователь должен видеть, почему пусто.
 */
export interface Field<T> {
  value: T | null;
  confidence: Confidence;
  sources: SourceRef[];
  /** Почему значение отсутствует или является оценкой. */
  reason?: string;
}

export function unknownField<T>(reason: string): Field<T> {
  return { value: null, confidence: "unknown", sources: [], reason };
}

export function field<T>(
  value: T,
  confidence: Confidence,
  sources: SourceRef[],
  reason?: string,
): Field<T> {
  return { value, confidence, sources, reason };
}

export function isKnown<T>(f: Field<T> | undefined): boolean {
  return !!f && f.value !== null;
}

/* ---------- Категории и жизненный цикл ---------- */

export type DiscoveryCategory =
  | "mouse"
  | "keyboard"
  | "mousepad"
  | "glide"
  | "accessory";

export function categoryLabel(c: DiscoveryCategory): string {
  const map: Record<DiscoveryCategory, string> = {
    mouse: "мышь",
    keyboard: "клавиатура",
    mousepad: "коврик",
    glide: "глайды",
    accessory: "аксессуар",
  };
  return map[c];
}

/** Этап конвейера проверки. Публикация только после verified. */
export type PipelineStage =
  | "discovered"
  | "review"
  | "needs-verification"
  | "verified"
  | "published"
  | "rejected";

export function stageLabel(s: PipelineStage): string {
  const map: Record<PipelineStage, string> = {
    discovered: "обнаружено",
    review: "на проверке",
    "needs-verification": "требует подтверждения",
    verified: "подтверждено",
    published: "опубликовано",
    rejected: "отклонено",
  };
  return map[s];
}

/** Рыночный статус продукта. Устаревшие модели не удаляются. */
export type LifecycleStatus =
  | "new"
  | "trending"
  | "active"
  | "discontinued"
  | "archived"
  | "unknown";

export function lifecycleLabel(s: LifecycleStatus): string {
  const map: Record<LifecycleStatus, string> = {
    new: "новинка",
    trending: "в тренде",
    active: "в продаже",
    discontinued: "снят с производства",
    archived: "архив",
    unknown: "статус неизвестен",
  };
  return map[s];
}

export type Availability = "in-stock" | "preorder" | "sold-out" | "unknown";

export function availabilityLabel(a: Availability): string {
  const map: Record<Availability, string> = {
    "in-stock": "в наличии",
    preorder: "предзаказ",
    "sold-out": "нет в наличии",
    unknown: "наличие неизвестно",
  };
  return map[a];
}

/* ---------- Ценовые сегменты ---------- */

export type PriceSegment = "budget" | "mid" | "mid-plus" | "premium" | "high-end";

export const PRICE_SEGMENTS: PriceSegment[] = [
  "budget",
  "mid",
  "mid-plus",
  "premium",
  "high-end",
];

export function priceSegmentLabel(s: PriceSegment): string {
  const map: Record<PriceSegment, string> = {
    budget: "Budget",
    mid: "Mid",
    "mid-plus": "Mid+",
    premium: "Premium",
    "high-end": "High-End",
  };
  return map[s];
}

export interface PriceObservation {
  priceUsd: number;
  source: SourceRef;
}

/* ---------- Классы скольжения для глайдов ---------- */

export type SpeedClass = "control" | "balanced" | "speed" | "extreme-speed";

export function speedClassLabel(c: SpeedClass): string {
  const map: Record<SpeedClass, string> = {
    control: "Control",
    balanced: "Balanced",
    speed: "Speed",
    "extreme-speed": "Extreme Speed",
  };
  return map[c];
}

export type ControlClass = "high" | "medium" | "low";

export function controlClassLabel(c: ControlClass): string {
  const map: Record<ControlClass, string> = {
    high: "высокий контроль",
    medium: "средний контроль",
    low: "низкий контроль",
  };
  return map[c];
}

/**
 * Материалы глайдов, включая экспериментальные.
 * Отдельно от GlideMaterial в types.ts: там только то,
 * что уже опубликовано и участвует в расчётах синергии.
 */
export type DiscoveredGlideMaterial =
  | "ptfe"
  | "virgin-ptfe"
  | "hardened-ptfe"
  | "ptfe-mos2"
  | "uhmw-pe"
  | "glass"
  | "ceramic"
  | "hybrid"
  | "experimental"
  | "unknown";

export function glideMaterialLabel(m: DiscoveredGlideMaterial): string {
  const map: Record<DiscoveredGlideMaterial, string> = {
    ptfe: "PTFE",
    "virgin-ptfe": "Virgin PTFE",
    "hardened-ptfe": "Hardened PTFE",
    "ptfe-mos2": "PTFE + MoS₂",
    "uhmw-pe": "UHMW-PE",
    glass: "закалённое стекло",
    ceramic: "керамика",
    hybrid: "гибридный материал",
    experimental: "экспериментальный материал",
    unknown: "материал неизвестен",
  };
  return map[m];
}

/** Формат глайдов. */
export type GlideFormat = "dots" | "donuts" | "full-size" | "anatomic" | "unknown";

export function glideFormatLabel(f: GlideFormat): string {
  const map: Record<GlideFormat, string> = {
    dots: "точки",
    donuts: "пончики",
    "full-size": "полноразмерные",
    anatomic: "анатомические",
    unknown: "формат неизвестен",
  };
  return map[f];
}

/* ---------- Сигналы рынка ---------- */

/**
 * Наблюдаемые сигналы по продукту. Все поля необязательные:
 * отсутствие сигнала не должно превращаться в ноль,
 * иначе скоринг начнёт наказывать за отсутствие данных.
 */
export interface MarketSignals {
  /** Дата первого обнаружения, YYYY-MM-DD. */
  discoveredOn: string;
  /** Дата анонса или релиза, если известна. */
  releaseDate: Field<string>;
  /** Упоминания за последние 30 дней. */
  mentions30d?: number;
  /** Упоминания за предыдущий период для расчёта роста. */
  mentionsPrev30d?: number;
  /** Число независимых обзоров. */
  independentReviews?: number;
  /** Обсуждения в профильных сообществах. */
  communityThreads?: number;
  /** Есть ли карточка на сайте производителя. */
  listedByManufacturer?: boolean;
  /** В скольких магазинах найден товар. */
  retailListings?: number;
  availability: Availability;
  /** Обезличенные события внутри GearLab. */
  gearlabViews?: number;
  gearlabCompares?: number;
  gearlabFavorites?: number;
  /** Поисковый интерес, если источник доступен. */
  searchInterest?: number;
}

/* ---------- Кандидат ---------- */

export interface DuplicateSuspect {
  /** slug существующей записи или id другого кандидата. */
  targetId: string;
  targetLabel: string;
  /** 0–1: насколько похожи названия и признаки. */
  similarity: number;
  reasons: string[];
}

export interface ReviewFinding {
  severity: "blocker" | "warning" | "note";
  message: string;
}

/**
 * Продукт, найденный движком. Это НЕ запись каталога:
 * попадание в публичный каталог требует ручного подтверждения.
 */
export interface DiscoveryCandidate {
  id: string;
  brand: string;
  model: string;
  category: DiscoveryCategory;
  stage: PipelineStage;
  lifecycle: LifecycleStatus;
  /** Недавно обнаруженный товар. Сбрасывается по истечении окна новизны. */
  isNew: boolean;
  /** Дата первого обнаружения, YYYY-MM-DD. */
  newSince: string;
  signals: MarketSignals;
  prices: PriceObservation[];
  sources: SourceRef[];
  /** Характеристики глайдов. Заполняется только для category === "glide". */
  glide?: {
    material: Field<DiscoveredGlideMaterial>;
    format: Field<GlideFormat>;
    shape: Field<string>;
    thicknessMm: Field<number>;
    compatibility: Field<string[]>;
    speedClass: Field<SpeedClass>;
    controlClass: Field<ControlClass>;
  };
  /** Свободные характеристики для остальных категорий. */
  specs?: Record<string, Field<string | number>>;
  /** Заметка оператора или движка. */
  note?: string;
  /** Является ли новой версией уже известного продукта. */
  supersedes?: string;
}

/* ---------- Бренды ---------- */

export interface BrandRecord {
  id: string;
  name: string;
  /** Альтернативные написания, включая русские и транслит. */
  aliases: string[];
  categories: DiscoveryCategory[];
  officialSite: Field<string>;
  /** Известен ли бренд опубликованной базе. */
  known: boolean;
  stage: PipelineStage;
  discoveredOn: string;
  note?: string;
}

/* ---------- Метка новизны ---------- */

/** Сколько дней товар считается новинкой после первого обнаружения. */
export const NEW_WINDOW_DAYS = 45;

/** Актуальна ли метка NEW на указанную дату. */
export function isStillNew(newSince: string, today: string, windowDays = NEW_WINDOW_DAYS): boolean {
  const from = Date.parse(newSince);
  const to = Date.parse(today);
  if (Number.isNaN(from) || Number.isNaN(to)) return false;
  const days = Math.floor((to - from) / 86_400_000);
  return days >= 0 && days <= windowDays;
}

/** Сколько дней прошло с первого обнаружения. Null, если дата некорректна. */
export function daysSinceDiscovery(newSince: string, today: string): number | null {
  const from = Date.parse(newSince);
  const to = Date.parse(today);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.floor((to - from) / 86_400_000);
}