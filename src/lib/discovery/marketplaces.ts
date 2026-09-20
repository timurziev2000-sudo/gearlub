import type { DiscoveryCategory, SourceRef } from "@/lib/discovery/types";

/**
 * Russian Marketplace Discovery.
 *
 * Мониторинг российских маркетплейсов: Ozon, Wildberries, Яндекс Маркет,
 * Мегамаркет. Модуль задаёт площадки, поисковые запросы, правила разбора
 * карточек и политику доступа.
 *
 * Важное предупреждение, вынесенное в интерфейс: все четыре площадки
 * запрещают автоматизированный сбор данных в пользовательских соглашениях
 * и активно применяют антибот-защиту. Легальный путь — партнёрские
 * и продавцовые API, а не обход HTML. Поэтому здесь описан контракт,
 * а не готовый парсер.
 */

export type MarketplaceId = "ozon" | "wildberries" | "yandex-market" | "megamarket";

export type AccessMethod =
  | "partner-api"
  | "seller-api"
  | "affiliate-feed"
  | "manual-entry"
  | "no-legal-automation";

export interface Marketplace {
  id: MarketplaceId;
  name: string;
  domain: string;
  /** Как можно получать данные легально. */
  access: AccessMethod[];
  /** Ссылка на документацию API, если она публичная. */
  apiDocs?: string;
  /** Ограничения и риски. */
  constraints: string[];
  /** Что даёт площадка для наших целей. */
  extracts: string[];
  /** Насколько надёжны данные о характеристиках с этой площадки. */
  specReliability: "low" | "medium";
  /** Шаблон поисковой ссылки для ручной проверки оператором. */
  searchUrl: (query: string) => string;
}

/**
 * Площадки. specReliability у всех не выше medium: карточки заполняют
 * продавцы, а не производители, поэтому характеристики оттуда нельзя
 * считать подтверждёнными.
 */
export const MARKETPLACES: Marketplace[] = [
  {
    id: "ozon",
    name: "Ozon",
    domain: "ozon.ru",
    access: ["seller-api", "affiliate-feed", "manual-entry"],
    apiDocs: "https://docs.ozon.ru/api/seller/",
    constraints: [
      "Пользовательское соглашение запрещает автоматизированный сбор данных с сайта.",
      "Seller API даёт доступ только к своим товарам, а не к чужому каталогу.",
      "Партнёрская программа предоставляет фиды по согласованию.",
      "Активная антибот-защита: обход приведёт к блокировке IP.",
    ],
    extracts: [
      "название товара как его продают в РФ",
      "цена в рублях на дату наблюдения",
      "наличие",
      "продавец",
      "фотографии карточки",
    ],
    specReliability: "low",
    searchUrl: (q) => `https://www.ozon.ru/search/?text=${encodeURIComponent(q)}`,
  },
  {
    id: "wildberries",
    name: "Wildberries",
    domain: "wildberries.ru",
    access: ["seller-api", "manual-entry"],
    apiDocs: "https://dev.wildberries.ru/",
    constraints: [
      "Автоматический парсинг каталога запрещён условиями использования.",
      "Открытые эндпоинты меняются без предупреждения и не являются публичным API.",
      "Карточки часто содержат ошибки в характеристиках: продавцы копируют описания.",
    ],
    extracts: ["название", "цена в рублях", "наличие", "рейтинг и отзывы", "продавец"],
    specReliability: "low",
    searchUrl: (q) =>
      `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(q)}`,
  },
  {
    id: "yandex-market",
    name: "Яндекс Маркет",
    domain: "market.yandex.ru",
    access: ["partner-api", "affiliate-feed", "manual-entry"],
    apiDocs: "https://yandex.ru/dev/market/",
    constraints: [
      "Партнёрский API требует регистрации и одобрения приложения.",
      "Для получения цен нужен доступ к партнёрской программе.",
      "Прямой обход страниц нарушает условия использования.",
    ],
    extracts: [
      "нормализованное название модели",
      "разброс цен по продавцам",
      "характеристики из карточки Маркета",
      "отзывы",
    ],
    specReliability: "medium",
    searchUrl: (q) => `https://market.yandex.ru/search?text=${encodeURIComponent(q)}`,
  },
  {
    id: "megamarket",
    name: "Мегамаркет",
    domain: "megamarket.ru",
    access: ["seller-api", "manual-entry"],
    constraints: [
      "Публичного каталожного API нет.",
      "Автоматический сбор запрещён условиями использования.",
    ],
    extracts: ["название", "цена в рублях", "наличие", "продавец"],
    specReliability: "low",
    searchUrl: (q) => `https://megamarket.ru/search/?q=${encodeURIComponent(q)}`,
  },
];

export function marketplaceById(id: MarketplaceId): Marketplace {
  return MARKETPLACES.find((m) => m.id === id)!;
}

/* ---------- Поисковые запросы ---------- */

/**
 * Базовые запросы по категориям. Список не является ограничением:
 * функция expandQueries добавляет запросы по обнаруженным брендам.
 */
export const BASE_QUERIES: Record<DiscoveryCategory, string[]> = {
  glide: [
    "глайды для мыши",
    "ножки для мыши",
    "mouse skates",
    "mouse feet",
    "скейты для мыши",
    "тефлоновые ножки мышь",
    "стеклянные глайды",
    "керамические глайды",
    "PTFE ножки мыши",
    "UHMW-PE глайды",
    "глайды dots",
    "глайды donuts",
    "накладки на мышь скольжение",
  ],
  mouse: [
    "игровая мышь беспроводная легкая",
    "игровая мышь 8000 Гц",
    "игровая мышь 8k опрос",
    "мышь PAW3950",
    "мышь PAW3395",
    "ультралегкая игровая мышь",
    "мышь для киберспорта",
    "мышь до 50 грамм",
  ],
  keyboard: [
    "клавиатура Hall Effect",
    "магнитная клавиатура игровая",
    "клавиатура Rapid Trigger",
    "клавиатура 8000 Гц",
    "аналоговая клавиатура игровая",
    "клавиатура 60% игровая",
  ],
  mousepad: [
    "коврик для мыши игровой",
    "коврик контроль для мыши",
    "коврик скорость для мыши",
    "стеклянный коврик для мыши",
    "коврик XL игровой",
  ],
  accessory: [
    "грип тейп для мыши",
    "бунджи для мыши",
    "паракорд для мыши",
    "подставка под запястье игровая",
    "аксессуары для игровой мыши",
  ],
};

/**
 * Расширение списка запросов по известным брендам и категориям.
 * Позволяет находить новые модели без перечисления самих моделей.
 */
export function expandQueries(
  category: DiscoveryCategory,
  brands: string[],
  extraTerms: string[] = [],
): string[] {
  const base = BASE_QUERIES[category];
  const brandQueries: string[] = [];

  const suffix: Record<DiscoveryCategory, string[]> = {
    glide: ["глайды", "ножки", "skates"],
    mouse: ["мышь", "мышка"],
    keyboard: ["клавиатура"],
    mousepad: ["коврик"],
    accessory: [""],
  };

  for (const brand of brands) {
    for (const s of suffix[category]) {
      brandQueries.push(s ? `${brand} ${s}` : brand);
    }
  }

  return [...new Set([...base, ...brandQueries, ...extraTerms])];
}

/* ---------- Разбор карточки ---------- */

/**
 * Сырая карточка с маркетплейса. Заполняется сборщиком; любое поле
 * может отсутствовать — пустое значение честнее выдуманного.
 */
export interface MarketplaceListing {
  marketplace: MarketplaceId;
  /** Название как его написал продавец. */
  rawTitle: string;
  url: string;
  priceRub?: number;
  inStock?: boolean;
  sellerName?: string;
  /** Отзывы и рейтинг — сигнал популярности, не характеристика. */
  reviewCount?: number;
  rating?: number;
  /** Дата наблюдения, YYYY-MM-DD. */
  observedOn: string;
}

/** Мусорные слова в названиях карточек российских маркетплейсов. */
const TITLE_NOISE = [
  "оригинал",
  "новинка",
  "хит",
  "топ",
  "premium",
  "премиум",
  "для геймеров",
  "геймерская",
  "игровая",
  "игровой",
  "профессиональная",
  "профессиональный",
  "набор",
  "комплект",
  "шт",
  "штук",
  "упаковка",
  "доставка",
  "гарантия",
  "россия",
  "в наличии",
];

export interface ParsedTitle {
  /** Предполагаемый бренд. */
  brand: string | null;
  /** Предполагаемая модель. */
  model: string | null;
  /** Очищенное название. */
  cleaned: string;
  /** Уверенность разбора: карточки маркетплейсов плохо структурированы. */
  confidence: "low" | "medium";
  /** Что помешало разобрать точнее. */
  notes: string[];
}

/**
 * Разбор названия карточки. Продавцы пишут названия свободно,
 * поэтому результат — гипотеза для проверки человеком, а не факт.
 */
export function parseListingTitle(
  rawTitle: string,
  knownBrands: string[],
): ParsedTitle {
  const notes: string[] = [];

  let cleaned = rawTitle
    .replace(/[«»"'()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = cleaned.toLowerCase();

  for (const noise of TITLE_NOISE) {
    if (lower.includes(noise)) {
      cleaned = cleaned.replace(new RegExp(noise, "gi"), " ").replace(/\s+/g, " ").trim();
    }
  }

  // Бренд ищем среди известных: гадать по первому слову ненадёжно.
  const brand =
    knownBrands.find((b) => lower.includes(b.toLowerCase())) ?? null;

  if (!brand) {
    notes.push(
      "Бренд не совпал ни с одним известным: возможно, это новый производитель или продавец не указал бренд.",
    );
  }

  let model: string | null = null;
  if (brand) {
    const index = cleaned.toLowerCase().indexOf(brand.toLowerCase());
    const after = cleaned.slice(index + brand.length).trim();
    // Модель — первые слова после бренда до запятой или тире.
    const candidate = after.split(/[,–—|/]/)[0].trim();
    model = candidate.length >= 2 ? candidate : null;
    if (!model) notes.push("После названия бренда не удалось выделить модель.");
  }

  return {
    brand,
    model,
    cleaned,
    // Даже при совпадении бренда карточка остаётся ненадёжным источником.
    confidence: brand && model ? "medium" : "low",
    notes,
  };
}

/** Приблизительный курс для оценки сегмента. Требует ручного обновления. */
export const RUB_PER_USD = 95;

export interface RubPriceConversion {
  priceUsd: number;
  note: string;
}

/**
 * Пересчёт рублёвой цены в доллары для определения сегмента.
 * Курс задан константой: результат — ориентир, а не точная цена.
 */
export function rubToUsd(priceRub: number, rate: number = RUB_PER_USD): RubPriceConversion {
  return {
    priceUsd: Math.round(priceRub / rate),
    note: `Пересчитано по курсу ${rate} ₽/$ на момент наблюдения. Курс задан вручную и требует обновления.`,
  };
}

/** Источник из карточки маркетплейса. */
export function listingToSource(listing: MarketplaceListing): SourceRef {
  const mp = marketplaceById(listing.marketplace);
  return {
    url: listing.url,
    sourceType: "marketplace",
    sourceDate: listing.observedOn,
    label: `${mp.name}${listing.sellerName ? ` · ${listing.sellerName}` : ""}`,
  };
}

/* ---------- Ссылки для ручной проверки ---------- */

export interface ManualSearchLink {
  marketplace: string;
  query: string;
  url: string;
}

/**
 * Готовые ссылки поиска для оператора. Пока автоматический сбор
 * невозможен, это рабочий инструмент: человек открывает ссылку
 * и вносит найденное через приёмник.
 */
export function manualSearchLinks(
  category: DiscoveryCategory,
  limitQueries = 6,
): ManualSearchLink[] {
  const queries = BASE_QUERIES[category].slice(0, limitQueries);
  const out: ManualSearchLink[] = [];

  for (const mp of MARKETPLACES) {
    for (const q of queries) {
      out.push({ marketplace: mp.name, query: q, url: mp.searchUrl(q) });
    }
  }

  return out;
}

/** Площадки, где вообще возможен легальный автоматический сбор. */
export function legallyAutomatable(): Marketplace[] {
  return MARKETPLACES.filter(
    (m) => m.access.includes("partner-api") || m.access.includes("affiliate-feed"),
  );
}

/* ---------- Преобразование карточки в кандидата ---------- */

/**
 * Формирование Discovery-записи из карточки маркетплейса.
 *
 * Возвращает не готовый товар, а гипотезу: карточки заполняют продавцы,
 * поэтому характеристики оттуда не считаются подтверждёнными.
 * Технические поля остаются Unknown до проверки по сайту производителя.
 */
export function listingToRawFinding(
  listing: MarketplaceListing,
  category: DiscoveryCategory,
  knownBrands: string[],
): { brand: string; model: string; parsed: ParsedTitle; source: SourceRef; priceUsd: number | null } | null {
  const parsed = parseListingTitle(listing.rawTitle, knownBrands);

  // Без бренда и модели запись бесполезна: угадывать нельзя.
  if (!parsed.brand || !parsed.model) return null;

  const source = listingToSource(listing);
  const priceUsd =
    listing.priceRub !== undefined ? rubToUsd(listing.priceRub).priceUsd : null;

  return {
    brand: parsed.brand,
    model: parsed.model,
    parsed,
    source,
    priceUsd,
  };
}

/** Сигналы популярности из карточки: отзывы и рейтинг, но не характеристики. */
export function listingSignals(listings: MarketplaceListing[]): {
  retailListings: number;
  reviewTotal: number | undefined;
  availability: "in-stock" | "sold-out" | "unknown";
} {
  const withStock = listings.filter((l) => l.inStock !== undefined);
  const reviews = listings
    .map((l) => l.reviewCount)
    .filter((n): n is number => n !== undefined);

  return {
    retailListings: listings.length,
    reviewTotal: reviews.length > 0 ? reviews.reduce((a, b) => a + b, 0) : undefined,
    availability:
      withStock.length === 0
        ? "unknown"
        : withStock.some((l) => l.inStock)
          ? "in-stock"
          : "sold-out",
  };
}