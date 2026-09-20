import { findDuplicates, findInternalDuplicates } from "@/lib/discovery/normalize";
import { existingEntries } from "@/lib/discovery/queue";
import {
  overallConfidence,
  popularityScore,
  priceSegment,
  trendScore,
  type PriceSegmentResult,
  type ScoreResult,
} from "@/lib/discovery/scoring";
import {
  CONFIDENCE_RANK,
  SOURCE_PRIORITY,
  type Confidence,
  type DiscoveryCandidate,
  type DuplicateSuspect,
  type PipelineStage,
  type ReviewFinding,
} from "@/lib/discovery/types";

/**
 * Приёмник данных и автоматическая проверка кандидатов.
 *
 * Движок не изобретает характеристики. Он принимает то, что нашёл
 * сборщик источников, проверяет полноту и непротиворечивость,
 * ищет дубликаты и выносит вердикт о готовности к публикации.
 *
 * Реальный сбор данных требует серверной части: планировщика,
 * HTTP-клиента с соблюдением robots.txt и хранилища. Здесь описан
 * контракт, к которому такой сборщик подключается.
 */

export interface ReviewResult {
  candidateId: string;
  stage: PipelineStage;
  findings: ReviewFinding[];
  duplicates: DuplicateSuspect[];
  trend: ScoreResult;
  popularity: ScoreResult;
  price: PriceSegmentResult;
  confidence: Confidence;
  /** Готов ли кандидат к ручному подтверждению. */
  readyForVerification: boolean;
}

function hasOfficialSource(candidate: DiscoveryCandidate): boolean {
  return candidate.sources.some(
    (s) => SOURCE_PRIORITY[s.sourceType] >= SOURCE_PRIORITY["press-release"],
  );
}

function distinctSourceHosts(candidate: DiscoveryCandidate): number {
  const hosts = new Set<string>();
  for (const s of candidate.sources) {
    try {
      hosts.add(new URL(s.url).hostname.replace(/^www\./, ""));
    } catch {
      /* невалидный URL учитывается отдельной проверкой */
    }
  }
  return hosts.size;
}

/**
 * Автоматическая проверка перед ручным подтверждением.
 * Блокеры не позволяют перейти к verified.
 */
export function reviewCandidate(
  candidate: DiscoveryCandidate,
  today: string,
): ReviewResult {
  const findings: ReviewFinding[] = [];

  /* Существование и источники */
  if (candidate.sources.length === 0) {
    findings.push({
      severity: "blocker",
      message: "Нет ни одного источника: существование продукта не подтверждено.",
    });
  }

  for (const source of candidate.sources) {
    try {
      new URL(source.url);
    } catch {
      findings.push({
        severity: "blocker",
        message: `Некорректный URL источника: ${source.url}`,
      });
    }
  }

  if (!hasOfficialSource(candidate)) {
    findings.push({
      severity: "warning",
      message:
        "Официальный источник производителя не найден. Характеристики нельзя считать подтверждёнными.",
    });
  }

  if (distinctSourceHosts(candidate) < 2) {
    findings.push({
      severity: "warning",
      message:
        "Все данные получены с одного домена. Для критических характеристик нужно независимое подтверждение.",
    });
  }

  /* Категория и полнота */
  if (candidate.category === "glide") {
    if (!candidate.glide) {
      findings.push({
        severity: "blocker",
        message: "Категория «глайды», но блок характеристик глайдов не заполнен.",
      });
    } else {
      const g = candidate.glide;

      if (g.material.value === null || g.material.value === "unknown") {
        findings.push({
          severity: "warning",
          message: `Материал не определён: ${g.material.reason ?? "причина не указана"}. Запись останется без участия в расчётах синергии.`,
        });
      }

      if (g.format.value === null || g.format.value === "unknown") {
        findings.push({
          severity: "note",
          message: "Формат глайдов не определён — фильтры по форме работать не будут.",
        });
      }

      if (g.thicknessMm.value === null) {
        findings.push({
          severity: "note",
          message: `Толщина неизвестна: ${g.thicknessMm.reason ?? "источник не сообщает"}.`,
        });
      }

      if (g.compatibility.value === null || g.compatibility.value.length === 0) {
        findings.push({
          severity: "warning",
          message: "Совместимость с моделями мышей не установлена.",
        });
      }

      // Класс скольжения от вторичных источников — это не измерение.
      if (
        g.speedClass.value !== null &&
        CONFIDENCE_RANK[g.speedClass.confidence] <= CONFIDENCE_RANK["secondary-source"]
      ) {
        findings.push({
          severity: "note",
          message:
            "Класс скольжения основан на вторичных источниках или оценке — в интерфейсе должен быть помечен соответствующе.",
        });
      }
    }
  }

  /* Даты */
  if (candidate.signals.releaseDate.value === null) {
    findings.push({
      severity: "note",
      message: `Дата релиза неизвестна: ${candidate.signals.releaseDate.reason ?? "источник не сообщает"}. Свежесть считается по дате обнаружения.`,
    });
  }

  /* Цены */
  const price = priceSegment(candidate.category, candidate.prices);
  if (price.segment === null) {
    findings.push({
      severity: "warning",
      message: `Ценовой сегмент не определён: ${price.reason}`,
    });
  } else if (price.observations === 1) {
    findings.push({
      severity: "note",
      message: price.reason,
    });
  } else if (price.spread !== null && price.spread > 0.6) {
    findings.push({
      severity: "warning",
      message: price.reason,
    });
  }

  /* Дубликаты */
  const duplicates = findDuplicates(candidate, existingEntries());
  const strongDuplicate = duplicates.find((d) => d.similarity >= 0.9);

  if (strongDuplicate) {
    findings.push({
      severity: "blocker",
      message: `Вероятный дубликат записи «${strongDuplicate.targetLabel}» (${Math.round(strongDuplicate.similarity * 100)}%): ${strongDuplicate.reasons.join("; ")}.`,
    });
  } else if (duplicates.length > 0) {
    findings.push({
      severity: "warning",
      message: `Найдены похожие записи: ${duplicates
        .slice(0, 3)
        .map((d) => `${d.targetLabel} (${Math.round(d.similarity * 100)}%)`)
        .join(", ")}. Нужно решить, новая это модель или версия существующей.`,
    });
  }

  if (candidate.supersedes) {
    findings.push({
      severity: "note",
      message: `Заявлено как новая версия записи ${candidate.supersedes}. Старая запись должна остаться в базе со статусом «снят с производства» или «архив».`,
    });
  }

  /* Скоринг */
  const trend = trendScore(candidate.signals, today);
  const popularity = popularityScore(candidate.signals);

  if (trend.reliability === "low") {
    findings.push({
      severity: "note",
      message: `Trend Score рассчитан по ${Math.round(trend.coverage * 100)}% сигналов — надёжность низкая.`,
    });
  }

  /* Итоговая достоверность */
  const confidences: Confidence[] = [price.confidence];
  if (candidate.glide) {
    confidences.push(
      candidate.glide.material.confidence,
      candidate.glide.format.confidence,
      candidate.glide.thicknessMm.confidence,
      candidate.glide.compatibility.confidence,
    );
  }
  if (candidate.specs) {
    for (const f of Object.values(candidate.specs)) confidences.push(f.confidence);
  }
  const confidence = overallConfidence(confidences);

  const blockers = findings.filter((f) => f.severity === "blocker");
  const warnings = findings.filter((f) => f.severity === "warning");

  let stage: PipelineStage;
  if (blockers.length > 0) {
    stage = "needs-verification";
  } else if (warnings.length > 0) {
    stage = "review";
  } else {
    stage = "review";
  }

  return {
    candidateId: candidate.id,
    stage,
    findings,
    duplicates,
    trend,
    popularity,
    price,
    confidence,
    readyForVerification: blockers.length === 0,
  };
}

/* ---------- Контракт сборщика источников ---------- */

/**
 * Что должен вернуть сборщик для одного продукта.
 * Все поля, кроме идентификации и источников, могут быть пустыми:
 * пустое значение честнее выдуманного.
 */
export interface RawFinding {
  brand: string;
  model: string;
  category: DiscoveryCandidate["category"];
  sources: DiscoveryCandidate["sources"];
  prices?: DiscoveryCandidate["prices"];
  signals?: Partial<DiscoveryCandidate["signals"]>;
  glide?: DiscoveryCandidate["glide"];
  specs?: DiscoveryCandidate["specs"];
  supersedes?: string;
}

export interface IngestResult {
  accepted: DiscoveryCandidate[];
  rejected: { finding: RawFinding; reason: string }[];
  internalDuplicates: { left: string; right: string; similarity: number }[];
}

function slugify(brand: string, model: string): string {
  return `${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Приём результатов сбора. Валидирует минимальный контракт,
 * заполняет отсутствующие сигналы как неизвестные и снимает
 * дубликаты внутри одной партии.
 */
export function ingestFindings(
  findings: RawFinding[],
  today: string,
): IngestResult {
  const accepted: DiscoveryCandidate[] = [];
  const rejected: { finding: RawFinding; reason: string }[] = [];

  for (const finding of findings) {
    if (!finding.brand?.trim() || !finding.model?.trim()) {
      rejected.push({ finding, reason: "Не указан бренд или модель." });
      continue;
    }

    if (!finding.sources || finding.sources.length === 0) {
      rejected.push({
        finding,
        reason: "Нет источников: запись без подтверждения существования не принимается.",
      });
      continue;
    }

    const candidate: DiscoveryCandidate = {
      id: slugify(finding.brand, finding.model),
      brand: finding.brand.trim(),
      model: finding.model.trim(),
      category: finding.category,
      stage: "discovered",
      lifecycle: "new",
      isNew: true,
      newSince: finding.signals?.discoveredOn ?? today,
      signals: {
        discoveredOn: finding.signals?.discoveredOn ?? today,
        releaseDate:
          finding.signals?.releaseDate ?? {
            value: null,
            confidence: "unknown",
            sources: [],
            reason: "Дата релиза не найдена в источниках.",
          },
        availability: finding.signals?.availability ?? "unknown",
        mentions30d: finding.signals?.mentions30d,
        mentionsPrev30d: finding.signals?.mentionsPrev30d,
        independentReviews: finding.signals?.independentReviews,
        communityThreads: finding.signals?.communityThreads,
        listedByManufacturer: finding.signals?.listedByManufacturer,
        retailListings: finding.signals?.retailListings,
        gearlabViews: finding.signals?.gearlabViews,
        gearlabCompares: finding.signals?.gearlabCompares,
        gearlabFavorites: finding.signals?.gearlabFavorites,
        searchInterest: finding.signals?.searchInterest,
      },
      prices: finding.prices ?? [],
      sources: finding.sources,
      glide: finding.glide,
      specs: finding.specs,
      supersedes: finding.supersedes,
    };

    accepted.push(candidate);
  }

  return {
    accepted,
    rejected,
    internalDuplicates: findInternalDuplicates(accepted),
  };
}
