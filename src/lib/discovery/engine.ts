import { runAudit, type AuditReport } from "@/lib/discovery/audit";
import { ingestFindings, reviewCandidate, type RawFinding, type ReviewResult } from "@/lib/discovery/ingest";
import { brandRegistry, discoveryQueue, publishedCounts } from "@/lib/discovery/queue";
import { automatableChannels, manualChannels, SCHEDULE } from "@/lib/discovery/sources";
import {
  legallyAutomatable,
  MARKETPLACES,
  type Marketplace,
} from "@/lib/discovery/marketplaces";
import {
  structuralTrends,
  takeSnapshot,
  temporalTrends,
  type DatabaseSnapshot,
  type MarketTrend,
} from "@/lib/discovery/trends";
import type { BrandRecord, DiscoveryCandidate, DiscoveryCategory } from "@/lib/discovery/types";

/**
 * Оркестратор Market Discovery Engine.
 *
 * Одна точка входа для команды «обнови базу». Что происходит:
 *
 *   1. Приём находок от сборщика (если он подключён).
 *   2. Автоматическая проверка каждого кандидата.
 *   3. Аудит опубликованной базы.
 *   4. Расчёт трендов и снимок состояния.
 *
 * Чего НЕ происходит: автоматической публикации. Записи попадают
 * в каталог только после ручного подтверждения — это защита
 * от превращения базы в свалку непроверенных данных.
 */

export interface DiscoveryRunReport {
  ranOn: string;
  /** Подключён ли реальный сборщик источников. */
  collectorConnected: boolean;
  intake: {
    received: number;
    accepted: number;
    rejected: { brand: string; model: string; reason: string }[];
    internalDuplicates: { left: string; right: string; similarity: number }[];
  };
  reviews: ReviewResult[];
  queue: {
    total: number;
    byStage: Record<string, number>;
    byCategory: Partial<Record<DiscoveryCategory, number>>;
  };
  brands: {
    known: number;
    unknown: BrandRecord[];
  };
  audit: AuditReport;
  trends: {
    structural: MarketTrend[];
    temporal: MarketTrend[];
  };
  snapshot: DatabaseSnapshot;
  published: Record<DiscoveryCategory, number>;
  channels: {
    automatable: number;
    manual: number;
  };
  marketplaces: {
    total: number;
    legallyAutomatable: Marketplace[];
    manualOnly: Marketplace[];
  };
  /** Что мешает полной автоматизации прямо сейчас. */
  blockers: string[];
  nextSteps: string[];
}

/**
 * Интерфейс сборщика источников. Реализация требует серверной
 * среды: HTTP-клиент, соблюдение robots.txt, ключи API,
 * хранилище состояния между запусками.
 */
export interface SourceCollector {
  readonly name: string;
  collect(today: string): Promise<RawFinding[]>;
}

/** Текущая дата в формате YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function countBy<T extends string>(items: { [k: string]: unknown }[], key: string) {
  const out: Record<string, number> = {};
  for (const item of items) {
    const value = String(item[key]);
    out[value] = (out[value] ?? 0) + 1;
  }
  return out as Record<T, number>;
}

/**
 * Полный проход движка.
 *
 * @param collector Сборщик источников. Без него движок работает
 *   в режиме аудита и трендов: очередь остаётся пустой, потому что
 *   придумывать находки нельзя.
 */
export async function runDiscovery(
  options: { today?: string; collector?: SourceCollector } = {},
): Promise<DiscoveryRunReport> {
  const today = options.today ?? todayIso();
  const collector = options.collector;

  /* 1. Приём находок */
  let raw: RawFinding[] = [];
  if (collector) {
    raw = await collector.collect(today);
  }

  const intake = ingestFindings(raw, today);
  const candidates: DiscoveryCandidate[] = [...discoveryQueue, ...intake.accepted];

  /* 2. Проверка кандидатов */
  const reviews = candidates.map((c) => reviewCandidate(c, today));

  // Стадия после проверки: результат проверки важнее исходной.
  const staged = candidates.map((c, i) => ({ ...c, stage: reviews[i].stage }));

  /* 3. Аудит базы */
  const audit = runAudit(today);

  /* 4. Тренды и снимок */
  const year = Number(today.slice(0, 4));
  const trends = {
    structural: structuralTrends(),
    temporal: temporalTrends(year),
  };
  const snapshot = takeSnapshot(today);

  /* Бренды */
  const brands = brandRegistry(today);
  const unknownBrands = brands.filter((b) => !b.known);

  /* Ограничения */
  const blockers: string[] = [];
  if (!collector) {
    blockers.push(
      "Сборщик источников не подключён: движок не может выполнять сетевые запросы из статической сборки. Нужен серверный планировщик с HTTP-клиентом и хранилищем.",
    );
  }
  blockers.push(
    "Reddit и YouTube требуют официальных API с ключами: публичные страницы отдают 403 для автоматических запросов.",
  );
  blockers.push(
    "Автоматический сбор цен с маркетплейсов обычно нарушает их условия использования — нужны партнёрские API.",
  );
  blockers.push(
    "Обезличенная статистика GearLab (просмотры, сравнения, избранное) сейчас хранится только в браузере пользователя и недоступна серверу.",
  );

  const nextSteps: string[] = [
    "Разобрать находки аудита: сначала блокеры, затем предупреждения.",
    "Добавить поля достоверности данных для мышей по аналогии с клавиатурами.",
  ];
  if (unknownBrands.length > 0) {
    nextSteps.push(
      `Проверить ${unknownBrands.length} брендов из списка наблюдения, которых нет в базе: ${unknownBrands
        .slice(0, 5)
        .map((b) => b.name)
        .join(", ")}.`,
    );
  }
  if (!collector) {
    nextSteps.push(
      "Подключить сборщик источников через интерфейс SourceCollector, начав с RSS производителей — это единственный канал без ключей и правовых ограничений.",
    );
  }

  return {
    ranOn: today,
    collectorConnected: !!collector,
    intake: {
      received: raw.length,
      accepted: intake.accepted.length,
      rejected: intake.rejected.map((r) => ({
        brand: r.finding.brand,
        model: r.finding.model,
        reason: r.reason,
      })),
      internalDuplicates: intake.internalDuplicates,
    },
    reviews,
    queue: {
      total: staged.length,
      byStage: countBy(staged, "stage"),
      byCategory: countBy(staged, "category"),
    },
    brands: {
      known: brands.filter((b) => b.known).length,
      unknown: unknownBrands,
    },
    audit,
    trends,
    snapshot,
    published: publishedCounts(),
    channels: {
      automatable: automatableChannels().length,
      manual: manualChannels().length,
    },
    marketplaces: {
      total: MARKETPLACES.length,
      legallyAutomatable: legallyAutomatable(),
      manualOnly: MARKETPLACES.filter(
        (m) => !m.access.includes("partner-api") && !m.access.includes("affiliate-feed"),
      ),
    },
    blockers,
    nextSteps,
  };
}

/** Описание расписания для отображения в админке. */
export function scheduleSummary() {
  return SCHEDULE.map((job) => ({
    kind: job.kind,
    name: job.name,
    description: job.description,
    steps: job.steps,
    rationale: job.rationale,
  }));
}
