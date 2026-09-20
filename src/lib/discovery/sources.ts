import {
  SOURCE_PRIORITY,
  type DiscoveryCategory,
  type SourceType,
} from "@/lib/discovery/types";

/**
 * Реестр источников мониторинга.
 *
 * Здесь описано, ГДЕ движок должен искать и с какими ограничениями.
 * Фактический обход требует серверной части: этот модуль задаёт
 * политику, приоритеты и частоту, чтобы сборщик не нарушал правила
 * площадок.
 */

export type CrawlPolicy =
  | "official-api"
  | "public-page"
  | "rss"
  | "manual-only"
  | "search-operator";

export interface SourceChannel {
  id: string;
  label: string;
  sourceType: SourceType;
  categories: DiscoveryCategory[];
  policy: CrawlPolicy;
  /** Минимальный интервал между обращениями, в часах. */
  minIntervalH: number;
  /** Ограничения, которые обязательно соблюдать. */
  constraints: string[];
  /** Что именно извлекается из канала. */
  extracts: string[];
}

/**
 * Каналы мониторинга. Приоритет всегда у производителя:
 * вторичные источники используются как подтверждение,
 * а не как единственное основание.
 */
export const SOURCE_CHANNELS: SourceChannel[] = [
  {
    id: "manufacturer-site",
    label: "Официальные сайты производителей",
    sourceType: "manufacturer",
    categories: ["mouse", "keyboard", "mousepad", "glide", "accessory"],
    policy: "public-page",
    minIntervalH: 24,
    constraints: [
      "Соблюдать robots.txt каждого домена.",
      "Не более одного запроса в 5 секунд на домен.",
      "Использовать честный User-Agent с контактом.",
    ],
    extracts: [
      "название модели",
      "официальные характеристики",
      "дата анонса",
      "наличие карточки товара",
      "рекомендованная цена",
    ],
  },
  {
    id: "manufacturer-news",
    label: "Новости и пресс-релизы производителей",
    sourceType: "press-release",
    categories: ["mouse", "keyboard", "mousepad", "glide", "accessory"],
    policy: "rss",
    minIntervalH: 24,
    constraints: [
      "Предпочитать RSS вместо обхода HTML.",
      "Не кэшировать полные тексты дольше необходимого.",
    ],
    extracts: ["анонсы новых моделей", "даты релиза", "новые линейки", "новые материалы"],
  },
  {
    id: "official-store",
    label: "Официальные магазины брендов",
    sourceType: "official-store",
    categories: ["mouse", "keyboard", "mousepad", "glide", "accessory"],
    policy: "public-page",
    minIntervalH: 48,
    constraints: [
      "Проверять условия использования: часть магазинов запрещает автоматический сбор.",
      "Не собирать цены чаще, чем раз в двое суток.",
    ],
    extracts: ["цена", "наличие", "варианты комплектации", "совместимость"],
  },
  {
    id: "retailers",
    label: "Магазины и маркетплейсы",
    sourceType: "retailer",
    categories: ["mouse", "keyboard", "mousepad", "glide", "accessory"],
    policy: "manual-only",
    minIntervalH: 168,
    constraints: [
      "Автоматический парсинг маркетплейсов обычно нарушает их условия использования.",
      "Использовать партнёрские API, если они доступны, вместо обхода страниц.",
      "Цены в рублях зависят от курса: сохранять валюту и дату наблюдения.",
    ],
    extracts: ["ценовые наблюдения", "наличие", "количество предложений"],
  },
  {
    id: "review-sites",
    label: "Специализированные обзорные сайты",
    sourceType: "review-site",
    categories: ["mouse", "keyboard", "mousepad", "glide"],
    policy: "public-page",
    minIntervalH: 72,
    constraints: [
      "Не копировать текст обзоров: сохранять только ссылку, автора и дату.",
      "Измерения указывать с атрибуцией автора.",
    ],
    extracts: ["независимые измерения", "оценка характера скольжения", "выявленные недостатки"],
  },
  {
    id: "reddit",
    label: "Reddit: r/MouseReview, r/MousepadReview, r/MechanicalKeyboards",
    sourceType: "reddit",
    categories: ["mouse", "keyboard", "mousepad", "glide"],
    policy: "official-api",
    minIntervalH: 24,
    constraints: [
      "Использовать официальный API с регистрацией приложения: публичный HTML отдаёт 403 для автоматических запросов.",
      "Соблюдать лимиты запросов Reddit API.",
      "Не выдавать пользовательские впечатления за измерения.",
    ],
    extracts: [
      "упоминания модели",
      "число обсуждений",
      "первые впечатления",
      "новые бренды в обсуждениях",
    ],
  },
  {
    id: "youtube",
    label: "YouTube: обзоры и распаковки",
    sourceType: "youtube",
    categories: ["mouse", "keyboard", "mousepad", "glide"],
    policy: "official-api",
    minIntervalH: 48,
    constraints: [
      "Использовать YouTube Data API вместо обхода страниц.",
      "Учитывать квоту API.",
      "Не считать спонсорские обзоры независимыми.",
    ],
    extracts: ["число обзоров", "дата первого обзора", "упоминания новых моделей"],
  },
  {
    id: "communities",
    label: "Профильные сообщества и Discord-серверы",
    sourceType: "community",
    categories: ["mouse", "mousepad", "glide"],
    policy: "manual-only",
    minIntervalH: 168,
    constraints: [
      "Автоматический сбор из закрытых сообществ недопустим без разрешения администрации.",
      "Таблицы вроде cisA использовать только с атрибуцией авторов.",
    ],
    extracts: ["лабораторные измерения", "новые материалы", "экспериментальные партии"],
  },
  {
    id: "search",
    label: "Поисковые операторы для обнаружения новых брендов",
    sourceType: "search",
    categories: ["mouse", "keyboard", "mousepad", "glide", "accessory"],
    policy: "search-operator",
    minIntervalH: 168,
    constraints: [
      "Использовать поисковый API, а не эмуляцию браузера.",
      "Результаты поиска — повод для проверки, а не подтверждение существования.",
    ],
    extracts: ["неизвестные бренды", "новые линейки", "новые материалы глайдов"],
  },
];

/** Поисковые шаблоны для обнаружения новинок без явного списка моделей. */
export const DISCOVERY_QUERIES: Record<DiscoveryCategory, string[]> = {
  glide: [
    "new mouse skates release",
    "mouse feet PTFE new",
    "virgin PTFE mouse skates",
    "hardened PTFE glides",
    "UHMW-PE mouse skates",
    "glass mouse skates",
    "ceramic mouse feet",
    "hybrid mouse skates material",
    "dot skates mouse",
    "donut mouse feet",
    "новые глайды для мыши",
    "стеклянные глайды мышь",
  ],
  mouse: [
    "new gaming mouse release lightweight",
    "8000 Hz wireless mouse new",
    "PAW3950 mouse announced",
    "sub 40g gaming mouse",
    "новая игровая мышь анонс",
  ],
  keyboard: [
    "new hall effect keyboard release",
    "rapid trigger keyboard announced",
    "magnetic switch keyboard new",
    "analog keyboard 8000 Hz",
    "новая клавиатура hall effect",
  ],
  mousepad: [
    "new gaming mousepad release",
    "glass mousepad new",
    "control mousepad announced",
    "новый коврик для мыши",
  ],
  accessory: [
    "mouse grip tape new",
    "mouse bungee release",
    "wrist rest gaming new",
    "новые аксессуары для мыши",
  ],
};

/** Материалы глайдов, за которыми ведётся отдельное наблюдение. */
export const GLIDE_MATERIAL_WATCH = [
  "PTFE",
  "virgin PTFE",
  "hardened PTFE",
  "PTFE + MoS2",
  "UHMW-PE",
  "закалённое стекло",
  "керамика",
  "гибридные материалы",
  "экспериментальные покрытия",
] as const;

/* ---------- Расписание ---------- */

export type ScheduleKind = "daily" | "weekly" | "monthly";

export interface ScheduledJob {
  kind: ScheduleKind;
  name: string;
  description: string;
  steps: string[];
  /** Почему выбрана такая частота. */
  rationale: string;
}

export const SCHEDULE: ScheduledJob[] = [
  {
    kind: "daily",
    name: "Market Discovery",
    description: "Быстрый обход официальных источников и RSS.",
    steps: [
      "Проверить RSS производителей на анонсы",
      "Обновить наличие у отслеживаемых брендов",
      "Принять новые находки в очередь",
      "Прогнать автоматическую проверку кандидатов",
    ],
    rationale:
      "RSS и карточки товаров меняются часто, но нагрузка на источники остаётся низкой.",
  },
  {
    kind: "weekly",
    name: "Deep Market Scan",
    description: "Расширенный поиск, включая обзоры и сообщества.",
    steps: [
      "Выполнить поисковые шаблоны по категориям",
      "Собрать упоминания через официальные API",
      "Обнаружить неизвестные бренды",
      "Пересчитать Trend Score и Popularity Score",
    ],
    rationale:
      "Поисковые API и API сообществ имеют квоты: недельная частота держит расход в пределах лимитов.",
  },
  {
    kind: "monthly",
    name: "Full Database Audit",
    description: "Полная проверка опубликованной базы.",
    steps: [
      "Запустить audit: дубликаты, противоречия, пробелы",
      "Сверить существующие записи с официальными источниками",
      "Создать записи Data Update для изменившихся характеристик",
      "Перевести исчезнувшие с рынка модели в статус «снят с производства»",
      "Снять снимок базы для расчёта динамики",
    ],
    rationale:
      "Аудит не требует внешних запросов, но его результаты нужно разбирать вручную — раз в месяц это реалистичный объём.",
  },
];

/** Каналы, отсортированные по приоритету источника. */
export function channelsByPriority(): SourceChannel[] {
  return [...SOURCE_CHANNELS].sort(
    (a, b) => SOURCE_PRIORITY[b.sourceType] - SOURCE_PRIORITY[a.sourceType],
  );
}

/** Каналы, доступные для автоматического сбора. */
export function automatableChannels(): SourceChannel[] {
  return SOURCE_CHANNELS.filter(
    (c) => c.policy === "official-api" || c.policy === "rss" || c.policy === "public-page",
  );
}

/** Каналы, требующие ручной работы или отдельного разрешения. */
export function manualChannels(): SourceChannel[] {
  return SOURCE_CHANNELS.filter(
    (c) => c.policy === "manual-only" || c.policy === "search-operator",
  );
}
