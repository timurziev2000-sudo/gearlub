import type { Glide, GlideMaterial, Mouse, Mousepad } from "@/lib/types";
import { anisotropy, avgDynamic, avgStatic, speedClass } from "@/lib/friction";

/**
 * Движок синергии «мышь + глайды + коврик».
 *
 * Метрики трения коврика взяты из таблицы cisA и измерены на стандартном
 * тестовом грузе. Реальное сопротивление под рукой зависит ещё от материала
 * глайдов и массы мыши, поэтому здесь считается скорректированное
 * эффективное сопротивление, а не голое трение поверхности.
 *
 * Все коэффициенты — эвристики на основе физики скольжения и практики
 * сообщества, а не лабораторные измерения связок. Они дают сравнительную
 * оценку между вариантами, но не абсолютные значения в ньютонах.
 */

/** Множитель сопротивления по материалу глайда. */
const GLIDE_FACTOR: Record<GlideMaterial, number> = {
  ptfe: 1,
  "ptfe-mos2": 0.92,
  "uhmw-pe": 0.96,
  glass: 0.78,
  ceramic: 0.72,
};

/** Абразивность поверхности: во сколько раз быстрее стачивается глайд. */
const WEAR_FACTOR: Record<Mousepad["surfaceTexture"], number> = {
  smooth: 1,
  textured: 1.35,
  abrasive: 1.8,
  glass: 2.6,
};

/** Стойкость материала глайда к истиранию. */
const GLIDE_ENDURANCE: Record<GlideMaterial, number> = {
  ptfe: 1,
  "ptfe-mos2": 1.4,
  "uhmw-pe": 1.7,
  glass: 3.2,
  ceramic: 3.6,
};

export type Severity = "critical" | "warning" | "info" | "good";

export interface SynergyIssue {
  severity: Severity;
  title: string;
  detail: string;
}

export type EffortClass =
  | "very-light"
  | "light"
  | "balanced"
  | "heavy"
  | "very-heavy";

export interface SynergyResult {
  /** Эффективное сопротивление связки с учётом глайдов и веса мыши. */
  effectiveResistance: number;
  /** Сопротивление только поверхности, без поправок. */
  padResistance: number;
  /** Вклад глайдов в процентах: отрицательный = связка стала быстрее. */
  glideDelta: number;
  /** Вклад веса мыши в процентах. */
  weightDelta: number;
  effortClass: EffortClass;
  /** Позиция на шкале 0–100: 0 = максимально быстро. */
  effortPercent: number;
  /** Ожидаемый ресурс глайдов в неделях активной игры. */
  glideLifeWeeks: number;
  /** Итоговая оценка связки 0–100. */
  score: number;
  issues: SynergyIssue[];
  /** Что заменить, чтобы связка стала лучше. */
  suggestions: string[];
}

export function effortClassLabel(c: EffortClass): string {
  const map: Record<EffortClass, string> = {
    "very-light": "очень легкое ведение",
    light: "легкое ведение",
    balanced: "сбалансированное ведение",
    heavy: "тяжелое ведение",
    "very-heavy": "очень тяжелое ведение",
  };
  return map[c];
}

export function severityLabel(s: Severity): string {
  const map: Record<Severity, string> = {
    critical: "критично",
    warning: "внимание",
    info: "к сведению",
    good: "хорошо",
  };
  return map[s];
}

function classifyEffort(value: number): EffortClass {
  if (value < 14) return "very-light";
  if (value < 18) return "light";
  if (value < 22) return "balanced";
  if (value < 26) return "heavy";
  return "very-heavy";
}

/**
 * Поправка на массу мыши. Нормальная сила прижима растёт с весом,
 * поэтому тяжёлая мышь ощущается медленнее на том же коврике.
 * База — 55 г, характерный вес киберспортивной мыши.
 */
function weightFactor(weightG: number): number {
  return 1 + (weightG - 55) / 240;
}

export interface SynergyInput {
  mouse: Mouse;
  pad: Mousepad;
  glide: Glide;
  sens: "low" | "medium" | "high";
}

export function analyzeSynergy({ mouse, pad, glide, sens }: SynergyInput): SynergyResult {
  const padResistance = avgDynamic(pad);
  const gFactor = GLIDE_FACTOR[glide.material];
  const wFactor = weightFactor(mouse.weightG);

  const effectiveResistance = padResistance * gFactor * wFactor;

  const glideDelta = (gFactor - 1) * 100;
  const weightDelta = (wFactor - 1) * 100;

  const effortClass = classifyEffort(effectiveResistance);
  const effortPercent = Math.min(
    100,
    Math.max(0, ((effectiveResistance - 10) / 22) * 100),
  );

  // Ресурс глайдов: базовые 14 недель делятся на абразивность и умножаются
  // на стойкость материала. Тяжёлая мышь дополнительно ускоряет износ.
  const wearLoad = WEAR_FACTOR[pad.surfaceTexture] * wFactor;
  const glideLifeWeeks = Math.max(
    1,
    Math.round((14 * GLIDE_ENDURANCE[glide.material]) / wearLoad),
  );

  const issues: SynergyIssue[] = [];
  const suggestions: string[] = [];

  // Износ: главный практический риск при неверной связке.
  if (pad.surfaceTexture === "glass" && glide.material === "ptfe") {
    issues.push({
      severity: "critical",
      title: "Чистый PTFE на стекле сотрётся быстро",
      detail: `Стекло абразивнее ткани примерно в 2,6 раза. Ожидаемый ресурс — около ${glideLifeWeeks} нед. активной игры, после чего появится провал по высоте и мышь начнёт цеплять корпусом.`,
    });
    suggestions.push("Замените глайды на керамические или стеклянные.");
  } else if (pad.surfaceTexture === "abrasive" && glide.material === "ptfe") {
    issues.push({
      severity: "warning",
      title: "Абразивная поверхность съедает чистый PTFE",
      detail: `Ресурс порядка ${glideLifeWeeks} нед. Для абразивных ковриков практичнее PTFE с MoS₂ — он держит истирание примерно на 40% дольше.`,
    });
    suggestions.push("Рассмотрите глайды PTFE + MoS₂ вместо чистого PTFE.");
  } else if (glideLifeWeeks >= 20) {
    issues.push({
      severity: "good",
      title: "Связка долговечна",
      detail: `Ожидаемый ресурс глайдов — около ${glideLifeWeeks} нед. активной игры. Замена потребуется редко.`,
    });
  }

  // Керамика и стекло на контрольном коврике: контроль теряется.
  if (
    (glide.material === "ceramic" || glide.material === "glass") &&
    pad.surface === "control" &&
    avgDynamic(pad) >= 24
  ) {
    issues.push({
      severity: "warning",
      title: "Быстрые глайды гасят смысл контрольного коврика",
      detail:
        "Вы платите за высокое трение поверхности и тут же снижаете его глайдами. Либо возьмите более быстрый коврик, либо оставьте PTFE.",
    });
    suggestions.push("Для контрольного коврика логичнее PTFE или PTFE + MoS₂.");
  }

  // Сочетание веса и трения.
  if (mouse.weightG <= 42 && effectiveResistance >= 24) {
    issues.push({
      severity: "warning",
      title: "Легкая мышь на очень медленной поверхности",
      detail: `${mouse.weightG} г при сопротивлении ${effectiveResistance.toFixed(1)}: мыши не хватает инерции, движение будет обрывистым, а микрокоррекции — дёрганными.`,
    });
    suggestions.push("Возьмите коврик побыстрее или мышь тяжелее 50 г.");
  }

  if (mouse.weightG >= 75 && effectiveResistance >= 23) {
    issues.push({
      severity: "warning",
      title: "Тяжелая мышь плюс высокое трение",
      detail:
        "Такая связка быстро утомляет предплечье на длинных сессиях. Для сохранения контроля лучше снизить трение поверхности.",
    });
  }

  // Соответствие сенсы.
  if (sens === "low" && effectiveResistance >= 25) {
    issues.push({
      severity: "warning",
      title: "Low sens требует запаса свободного хода",
      detail:
        "При низкой чувствительности разворот идёт длинным движением. Высокое трение делает его тяжёлым — нужен коврик размера XL или XXL и более скользкая связка.",
    });
    suggestions.push("Для low sens ориентируйтесь на сопротивление ниже 22.");
  }

  if (sens === "high" && effectiveResistance <= 15) {
    issues.push({
      severity: "warning",
      title: "High sens на очень быстрой связке",
      detail:
        "Цена ошибки в микрокоррекциях возрастает: небольшое лишнее движение уводит прицел далеко. Обычно комфортнее добавить контроля.",
    });
    suggestions.push("Для high sens возьмите коврик с трением выше 21.");
  }

  // Залипание при старте движения.
  const stiction = avgStatic(pad) - avgDynamic(pad);
  if (stiction >= 2.5) {
    issues.push({
      severity: "info",
      title: "Заметное усилие срыва с места",
      detail: `Разница между статикой и динамикой — ${stiction.toFixed(2)}. Старт движения будет ощущаться резче продолжения, это мешает плавному трекингу.`,
    });
  }

  // Анизотропия поверхности.
  const aniso = anisotropy(pad);
  if (aniso >= 3) {
    issues.push({
      severity: "info",
      title: "Поверхность анизотропна",
      detail: `Разница между осями X и Y — ${aniso.toFixed(2)}. Горизонтальные флики и вертикальный трекинг будут ощущаться по-разному, к этому нужно привыкнуть.`,
    });
  }

  // Толстый глайд на тонком коврике.
  if (glide.thicknessMm >= 1.2 && pad.thickness <= 3) {
    issues.push({
      severity: "info",
      title: "Толстые глайды на тонком коврике",
      detail:
        "Мышь встанет выше, изменится угол хвата и ощущение клика. Если привыкли к низкой посадке — берите глайды до 0,9 мм.",
    });
  }

  if (issues.length === 0) {
    issues.push({
      severity: "good",
      title: "Конфликтов не обнаружено",
      detail:
        "Связка сбалансирована: материал глайдов соответствует поверхности, вес мыши согласуется с трением.",
    });
  }

  // Итоговая оценка.
  let score = 78;
  for (const i of issues) {
    if (i.severity === "critical") score -= 30;
    else if (i.severity === "warning") score -= 12;
    else if (i.severity === "info") score -= 4;
    else if (i.severity === "good") score += 8;
  }

  const sensTarget = sens === "low" ? 18 : sens === "high" ? 23 : 20.5;
  score -= Math.min(16, Math.abs(effectiveResistance - sensTarget) * 2.2);

  return {
    effectiveResistance,
    padResistance,
    glideDelta,
    weightDelta,
    effortClass,
    effortPercent,
    glideLifeWeeks,
    score: Math.max(5, Math.min(99, Math.round(score))),
    issues,
    suggestions,
  };
}

/** Подбор глайдов, которые улучшат связку без смены коврика и мыши. */
export function betterGlides(
  input: SynergyInput,
  allGlides: Glide[],
  limit = 3,
): { glide: Glide; score: number }[] {
  return allGlides
    .filter((g) => g.slug !== input.glide.slug)
    .map((g) => ({ glide: g, score: analyzeSynergy({ ...input, glide: g }).score }))
    .filter((r) => r.score > analyzeSynergy(input).score)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Подбор ковриков под уже купленные мышь и глайды. */
export function betterPads(
  input: SynergyInput,
  allPads: Mousepad[],
  limit = 3,
): { pad: Mousepad; score: number }[] {
  const base = analyzeSynergy(input).score;
  return allPads
    .filter((p) => p.slug !== input.pad.slug)
    .map((p) => ({ pad: p, score: analyzeSynergy({ ...input, pad: p }).score }))
    .filter((r) => r.score > base)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export { speedClass };
