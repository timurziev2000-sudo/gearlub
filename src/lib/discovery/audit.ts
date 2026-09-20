import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import { anisotropy, avgDynamic, avgStatic } from "@/lib/friction";
import { nameSimilarity, normalizeName } from "@/lib/discovery/normalize";
import type { DiscoveryCategory } from "@/lib/discovery/types";

/**
 * Database Audit.
 *
 * Проверяет опубликованную базу на дубликаты, пробелы и внутренние
 * противоречия. Ничего не изменяет: возвращает список находок,
 * решение остаётся за человеком.
 */

export type AuditSeverity = "blocker" | "warning" | "note";

export interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  category: DiscoveryCategory | "all";
  title: string;
  detail: string;
  /** Затронутые записи. */
  items: string[];
  /** Что предлагается сделать. */
  suggestion: string;
}

export interface AuditReport {
  ranOn: string;
  totals: Record<DiscoveryCategory, number>;
  findings: AuditFinding[];
  /** Доля записей с подтверждёнными данными. */
  dataQuality: {
    padsMeasured: number;
    padsTotal: number;
    keyboardsVerified: number;
    keyboardsTotal: number;
    glidesVerified: number;
    glidesTotal: number;
  };
}

function checkSlugUniqueness(): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const groups: [DiscoveryCategory, { slug: string; label: string }[]][] = [
    ["mouse", mice.map((m) => ({ slug: m.slug, label: `${m.brand} ${m.name}` }))],
    ["keyboard", keyboards.map((k) => ({ slug: k.slug, label: `${k.brand} ${k.name}` }))],
    ["mousepad", pads.map((p) => ({ slug: p.slug, label: `${p.brand} ${p.name}` }))],
    ["glide", glides.map((g) => ({ slug: g.slug, label: `${g.brand} ${g.name}` }))],
  ];

  for (const [category, items] of groups) {
    const seen = new Map<string, string[]>();
    for (const item of items) {
      const list = seen.get(item.slug) ?? [];
      list.push(item.label);
      seen.set(item.slug, list);
    }
    for (const [slug, labels] of seen) {
      if (labels.length > 1) {
        findings.push({
          id: `slug-collision-${category}-${slug}`,
          severity: "blocker",
          category,
          title: `Повторяющийся slug: ${slug}`,
          detail: `Один и тот же slug используют записи: ${labels.join(", ")}. Это ломает страницы устройств и sitemap.`,
          items: labels,
          suggestion: "Переименовать один из slug, сохранив старый как редирект.",
        });
      }
    }
  }

  return findings;
}

function checkNearDuplicates(): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const groups: [DiscoveryCategory, { brand: string; name: string; slug: string }[]][] = [
    ["mouse", mice],
    ["keyboard", keyboards],
    ["mousepad", pads],
    ["glide", glides],
  ];

  for (const [category, items] of groups) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (nameSimilarity(a.brand, b.brand) < 0.9) continue;
        const sim = nameSimilarity(a.name, b.name);
        if (sim >= 0.82) {
          findings.push({
            id: `near-duplicate-${a.slug}-${b.slug}`,
            severity: "warning",
            category,
            title: `Возможный дубликат: ${a.brand} ${a.name} и ${b.brand} ${b.name}`,
            detail: `Названия совпадают на ${Math.round(sim * 100)}% после нормализации («${normalizeName(a.name)}» и «${normalizeName(b.name)}»). Это могут быть разные версии одного продукта или дубль.`,
            items: [a.slug, b.slug],
            suggestion:
              "Проверить по сайту производителя, разные ли это модели. Если версии — явно указать версию в названии.",
          });
        }
      }
    }
  }

  return findings;
}

function checkPadConsistency(): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const pad of pads) {
    const dyn = avgDynamic(pad);
    const stat = avgStatic(pad);

    // Статика ниже динамики физически неправдоподобна.
    if (stat < dyn) {
      findings.push({
        id: `pad-stiction-${pad.slug}`,
        severity: "blocker",
        category: "mousepad",
        title: `${pad.brand} ${pad.name}: статика ниже динамики`,
        detail: `Средняя статика ${stat.toFixed(2)} меньше динамики ${dyn.toFixed(2)}. Усилие срыва с места не может быть ниже сопротивления при движении.`,
        items: [pad.slug],
        suggestion: "Сверить значения с таблицей cisA — вероятна опечатка при переносе.",
      });
    }

    // Заявленный тип поверхности против измеренного трения.
    if (pad.surface === "speed" && dyn >= 23) {
      findings.push({
        id: `pad-surface-mismatch-${pad.slug}`,
        severity: "warning",
        category: "mousepad",
        title: `${pad.brand} ${pad.name}: тип «скорость» при высоком трении`,
        detail: `Средняя динамика ${dyn.toFixed(2)} соответствует контрольной поверхности, но тип указан как speed.`,
        items: [pad.slug],
        suggestion: "Изменить surface на control или hybrid.",
      });
    }

    if (pad.surface === "control" && dyn < 18) {
      findings.push({
        id: `pad-surface-mismatch-${pad.slug}`,
        severity: "warning",
        category: "mousepad",
        title: `${pad.brand} ${pad.name}: тип «контроль» при низком трении`,
        detail: `Средняя динамика ${dyn.toFixed(2)} соответствует быстрой поверхности, но тип указан как control.`,
        items: [pad.slug],
        suggestion: "Изменить surface на speed или hybrid.",
      });
    }

    // Стеклянная текстура при не-стеклянном типе и наоборот.
    if (pad.surfaceTexture === "glass" && pad.surface !== "glass" && pad.surface !== "speed") {
      findings.push({
        id: `pad-glass-mismatch-${pad.slug}`,
        severity: "note",
        category: "mousepad",
        title: `${pad.brand} ${pad.name}: стеклянная поверхность с типом ${pad.surface}`,
        detail: "Текстура заявлена как стекло, но тип поверхности другой. Возможно расхождение классификации.",
        items: [pad.slug],
        suggestion: "Проверить, стекло это или напыление на ткани.",
      });
    }

    // Дублирующиеся поля толщины.
    if (Math.abs(pad.thickness - pad.thicknessMm) > 0.01) {
      findings.push({
        id: `pad-thickness-${pad.slug}`,
        severity: "warning",
        category: "mousepad",
        title: `${pad.brand} ${pad.name}: расхождение полей толщины`,
        detail: `thickness = ${pad.thickness}, thicknessMm = ${pad.thicknessMm}. Поля существуют параллельно для совместимости и должны совпадать.`,
        items: [pad.slug],
        suggestion: "Привести оба поля к одному значению.",
      });
    }

    // Экстремальная анизотропия — не ошибка, но требует внимания.
    if (anisotropy(pad) >= 5) {
      findings.push({
        id: `pad-anisotropy-${pad.slug}`,
        severity: "note",
        category: "mousepad",
        title: `${pad.brand} ${pad.name}: очень высокая анизотропия`,
        detail: `Разница между осями ${anisotropy(pad).toFixed(2)}. Значение необычно велико — стоит перепроверить перенос цифр.`,
        items: [pad.slug],
        suggestion: "Сверить X и Y с таблицей cisA.",
      });
    }
  }

  return findings;
}

function checkGlideConsistency(): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const glide of glides) {
    // Чистый PTFE не может быть одновременно самым быстрым и самым стойким.
    if (glide.material === "ptfe" && glide.speedIndex >= 90) {
      findings.push({
        id: `glide-ptfe-speed-${glide.slug}`,
        severity: "warning",
        category: "glide",
        title: `${glide.brand} ${glide.name}: PTFE с индексом скорости ${glide.speedIndex}`,
        detail: "Чистый PTFE обычно не достигает скорости стекла или керамики. Возможна неверная оценка.",
        items: [glide.slug],
        suggestion: "Проверить материал по описанию производителя.",
      });
    }

    if (
      (glide.material === "glass" || glide.material === "ceramic") &&
      glide.durabilityIndex < 70
    ) {
      findings.push({
        id: `glide-hard-durability-${glide.slug}`,
        severity: "warning",
        category: "glide",
        title: `${glide.brand} ${glide.name}: низкая стойкость для твёрдого материала`,
        detail: `Стекло и керамика обычно имеют высокий ресурс, здесь указано ${glide.durabilityIndex}/100.`,
        items: [glide.slug],
        suggestion: "Уточнить оценку стойкости.",
      });
    }

    if (!glide.tier) {
      findings.push({
        id: `glide-no-tier-${glide.slug}`,
        severity: "note",
        category: "glide",
        title: `${glide.brand} ${glide.name}: не указан ценовой сегмент`,
        detail: "Без сегмента запись не попадает в подборки Budget и Premium.",
        items: [glide.slug],
        suggestion: "Указать tier по позиционированию на рынке.",
      });
    }

    if (!glide.specSource) {
      findings.push({
        id: `glide-no-source-${glide.slug}`,
        severity: "note",
        category: "glide",
        title: `${glide.brand} ${glide.name}: не указано происхождение данных`,
        detail: "Пользователь не видит, измерены характеристики или оценены.",
        items: [glide.slug],
        suggestion: "Заполнить specSource.",
      });
    }
  }

  return findings;
}

function checkMouseConsistency(): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const mouse of mice) {
    if (mouse.weightG < 30 || mouse.weightG > 130) {
      findings.push({
        id: `mouse-weight-${mouse.slug}`,
        severity: "warning",
        category: "mouse",
        title: `${mouse.brand} ${mouse.name}: нетипичный вес ${mouse.weightG} г`,
        detail: "Значение выходит за практические границы игровых мышей.",
        items: [mouse.slug],
        suggestion: "Сверить вес с официальной спецификацией.",
      });
    }

    if (mouse.clickLatencyMs <= 0 || mouse.clickLatencyMs > 10) {
      findings.push({
        id: `mouse-latency-${mouse.slug}`,
        severity: "warning",
        category: "mouse",
        title: `${mouse.brand} ${mouse.name}: подозрительная клик-латентность`,
        detail: `Указано ${mouse.clickLatencyMs} ms.`,
        items: [mouse.slug],
        suggestion: "Проверить методику измерения или источник.",
      });
    }

    // У мышей пока нет поля происхождения данных — это системный пробел.
    if (mouse.pollingHz >= 8000 && !mouse.motionSync) {
      findings.push({
        id: `mouse-8k-nosync-${mouse.slug}`,
        severity: "note",
        category: "mouse",
        title: `${mouse.brand} ${mouse.name}: 8000 Hz без motion sync`,
        detail: "Комбинация встречается редко. Стоит перепроверить характеристики.",
        items: [mouse.slug],
        suggestion: "Сверить с описанием производителя.",
      });
    }
  }

  return findings;
}

function checkKeyboardConsistency(): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const kb of keyboards) {
    if (kb.hallEffect && kb.actuationG !== null) {
      findings.push({
        id: `kb-he-actuation-${kb.slug}`,
        severity: "warning",
        category: "keyboard",
        title: `${kb.brand} ${kb.name}: Hall Effect с фиксированной силой срабатывания`,
        detail: `Указано ${kb.actuationG} г, но у магнитных свичей точка срабатывания регулируется программно.`,
        items: [kb.slug],
        suggestion: "Установить actuationG в null либо уточнить, что это усилие пружины.",
      });
    }

    if (kb.rapidTrigger && !kb.hallEffect) {
      const opticalAnalog = kb.switches.toLowerCase().includes("analog");
      if (!opticalAnalog) {
        findings.push({
          id: `kb-rt-nohe-${kb.slug}`,
          severity: "warning",
          category: "keyboard",
          title: `${kb.brand} ${kb.name}: Rapid Trigger без Hall Effect`,
          detail: "Rapid Trigger требует аналогового считывания хода клавиши.",
          items: [kb.slug],
          suggestion: "Проверить тип свичей: возможно, это аналоговая оптика.",
        });
      }
    }

    if (!kb.specSource) {
      findings.push({
        id: `kb-no-source-${kb.slug}`,
        severity: "note",
        category: "keyboard",
        title: `${kb.brand} ${kb.name}: не указано происхождение данных`,
        detail: "Пользователь не видит статус достоверности характеристик.",
        items: [kb.slug],
        suggestion: "Заполнить specSource и sources.",
      });
    }
  }

  return findings;
}

function checkSystemicGaps(): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const padsWithoutMeasurement = pads.filter((p) => p.frictionSource !== "cisA");
  if (padsWithoutMeasurement.length > 0) {
    findings.push({
      id: "pads-unmeasured",
      severity: "note",
      category: "mousepad",
      title: `${padsWithoutMeasurement.length} ковриков без прямых измерений`,
      detail: `Записи опираются на близкие модели или оценки: ${padsWithoutMeasurement.map((p) => `${p.brand} ${p.name}`).join(", ")}.`,
      items: padsWithoutMeasurement.map((p) => p.slug),
      suggestion: "Найти измерения в таблице cisA или пометить как требующие проверки в интерфейсе.",
    });
  }

  // У мышей нет полей достоверности — это архитектурный пробел.
  findings.push({
    id: "mice-no-confidence-fields",
    severity: "warning",
    category: "mouse",
    title: "У мышей отсутствуют поля достоверности данных",
    detail: `Все ${mice.length} записей не имеют specSource и sources, хотя часть характеристик является оценкой. Пользователь не может отличить официальные данные от предположений.`,
    items: [],
    suggestion: "Добавить specSource и sources в интерфейс Mouse по аналогии с Keyboard.",
  });

  const kbEstimated = keyboards.filter((k) => k.specSource === "estimated");
  if (kbEstimated.length > 0) {
    findings.push({
      id: "kb-estimated-bulk",
      severity: "note",
      category: "keyboard",
      title: `${kbEstimated.length} клавиатур со статусом «требует проверки»`,
      detail: "Характеристики не подтверждены первоисточником и не должны использоваться для точных сравнений.",
      items: kbEstimated.map((k) => k.slug),
      suggestion: "Сверить с официальными спецификациями и переключить статус на official.",
    });
  }

  return findings;
}

const SEVERITY_ORDER: Record<AuditSeverity, number> = {
  blocker: 0,
  warning: 1,
  note: 2,
};

export function runAudit(ranOn: string): AuditReport {
  const findings = [
    ...checkSlugUniqueness(),
    ...checkNearDuplicates(),
    ...checkPadConsistency(),
    ...checkGlideConsistency(),
    ...checkMouseConsistency(),
    ...checkKeyboardConsistency(),
    ...checkSystemicGaps(),
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    ranOn,
    totals: {
      mouse: mice.length,
      keyboard: keyboards.length,
      mousepad: pads.length,
      glide: glides.length,
      accessory: 0,
    },
    findings,
    dataQuality: {
      padsMeasured: pads.filter((p) => p.frictionSource === "cisA").length,
      padsTotal: pads.length,
      keyboardsVerified: keyboards.filter(
        (k) => k.specSource === "official" || k.specSource === "user-provided",
      ).length,
      keyboardsTotal: keyboards.length,
      glidesVerified: glides.filter(
        (g) => g.specSource === "official" || g.specSource === "user-provided",
      ).length,
      glidesTotal: glides.length,
    },
  };
}
