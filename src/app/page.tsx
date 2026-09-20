import Link from "next/link";
import {
  ArrowRight,
  Database,
  GitCompare,
  Keyboard as KeyboardIcon,
  Layers,
  Mouse as MouseIcon,
  Sparkles,
  Target,
} from "lucide-react";
import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import { DashboardPreview, type DashboardRow } from "@/components/DashboardPreview";
import { StatCounter } from "@/components/StatCounter";
import { avgDynamic } from "@/lib/friction";
import { analyzeSynergy } from "@/lib/synergy";
import { segmentCounts } from "@/lib/discovery/segments";
import { structuralTrends } from "@/lib/discovery/trends";

/**
 * Главная страница. Все числа берутся из базы: показывать
 * маркетинговые «250K+ устройств» при 106 записях было бы обманом.
 */

const totalDevices = mice.length + keyboards.length + pads.length + glides.length;
const measuredPads = pads.filter((p) => p.frictionSource === "cisA").length;
const heKeyboards = keyboards.filter((k) => k.hallEffect).length;
const freshKeyboards = keyboards.filter((k) => (k.releaseYear ?? 0) >= 2025).length;

/** Демо-конфигурация для дашборда: лучший бандл по движку синергии. */
function buildShowcase() {
  const mouse =
    mice.find((m) => m.slug === "scyrox-v8") ??
    [...mice].sort((a, b) => a.weightG - b.weightG)[0];

  const pad =
    pads.find((p) => p.frictionSource === "cisA" && avgDynamic(p) < 22) ?? pads[0];

  const glide =
    glides.find((g) => g.material === "ptfe-mos2") ?? glides[0];

  const keyboard =
    keyboards.find((k) => k.hallEffect && k.rapidTrigger) ?? keyboards[0];

  const synergy = analyzeSynergy({ mouse, pad, glide, sens: "medium" });

  const rows: DashboardRow[] = [
    {
      slot: "mouse",
      label: `${mouse.brand} ${mouse.name}`,
      meta: `${mouse.weightG} г · ${mouse.sensor} · ${mouse.pollingHz} Hz`,
      href: `/database/mice/${mouse.slug}`,
      badge: "new",
    },
    {
      slot: "keyboard",
      label: `${keyboard.brand} ${keyboard.name}`,
      meta: `${keyboard.layout} · ${keyboard.hallEffect ? "Hall Effect" : "механика"} · ${keyboard.pollRateHz} Hz`,
      href: `/database/keyboards/${keyboard.slug}`,
      badge: keyboard.releaseYear && keyboard.releaseYear >= 2025 ? "new" : undefined,
    },
    {
      slot: "pad",
      label: `${pad.brand} ${pad.name}`,
      meta: `динамика ${avgDynamic(pad).toFixed(2)} · ${pad.thickness} мм`,
      href: `/database/pads/${pad.slug}`,
      badge: "updated",
    },
    {
      slot: "glides",
      label: `${glide.brand} ${glide.name}`,
      meta: `${glide.material} · ресурс ≈ ${synergy.glideLifeWeeks} нед.`,
      href: "/database/glides",
    },
  ];

  const totalUsd =
    mouse.priceUsd + keyboard.priceUsd + pad.priceUsd + glide.priceUsd;

  const bars = [
    {
      label: "Эффективное сопротивление",
      value: synergy.effortPercent,
      hint: synergy.effectiveResistance.toFixed(2),
    },
    {
      label: "Ресурс глайдов",
      value: Math.min(100, synergy.glideLifeWeeks * 4),
      hint: `≈ ${synergy.glideLifeWeeks} нед.`,
    },
    {
      label: "Полнота данных коврика",
      value: pad.frictionSource === "cisA" ? 100 : 45,
      hint: pad.frictionSource === "cisA" ? "измерено" : "оценка",
    },
  ];

  return { rows, totalUsd, synergy, bars };
}

const showcase = buildShowcase();
const counts = segmentCounts();
const topTrends = structuralTrends().slice(0, 3);

const features = [
  {
    num: "01",
    title: "Нормализованная база",
    text: "Единая схема характеристик: сенсор, вес, polling, свичи, сила трения по осям. Каждое значение помечено по происхождению — измерение, данные производителя или оценка.",
    Icon: Database,
    stat: `${measuredPads} из ${pads.length} ковриков с прямыми измерениями`,
    href: "/database",
  },
  {
    num: "02",
    title: "AI Match Engine",
    text: "Движок разбирает запрос, фильтрует базу по бюджету, хвату и стилю игры и объясняет каждый выбор. Если под условия ничего не подходит, он говорит об этом вместо выдумки.",
    Icon: Sparkles,
    stat: `${totalDevices} устройств в выборке`,
    href: "/advisor",
  },
  {
    num: "03",
    title: "Матрица совместимости",
    text: "Расчёт связки «мышь + глайды + коврик» по измеренному трению: эффективное сопротивление, ресурс глайдов и конфликты материалов до покупки, а не после.",
    Icon: Layers,
    stat: "8 правил диагностики связки",
    href: "/tools/synergy",
  },
];

const categories = [
  {
    href: "/database/mice",
    label: "Мыши",
    count: mice.length,
    Icon: MouseIcon,
    meta: `от ${Math.min(...mice.map((m) => m.weightG))} г`,
  },
  {
    href: "/database/keyboards",
    label: "Клавиатуры",
    count: keyboards.length,
    Icon: KeyboardIcon,
    meta: `${heKeyboards} Hall Effect`,
  },
  {
    href: "/database/pads",
    label: "Коврики",
    count: pads.length,
    Icon: Layers,
    meta: `${measuredPads} с измерениями`,
  },
  {
    href: "/database/glides",
    label: "Глайды",
    count: glides.length,
    Icon: Sparkles,
    meta: "5 материалов",
  },
];

const tools = [
  {
    href: "/advisor",
    title: "Подбор по запросу",
    text: "Опишите задачу словами — движок найдёт варианты в базе и объяснит выбор.",
    Icon: Target,
  },
  {
    href: "/my-setup",
    title: "Мой сетап",
    text: "Соберите конфигурацию целиком: eDPI, cm/360, оценка связки. Ссылкой можно поделиться.",
    Icon: Database,
  },
  {
    href: "/tools/synergy",
    title: "Калькулятор синергии",
    text: "Проверка мыши, глайдов и коврика по измеренному трению cisA.",
    Icon: Layers,
  },
  {
    href: "/compare",
    title: "Сравнение",
    text: "До четырёх устройств рядом: характеристики, трение, анизотропия, цена.",
    Icon: GitCompare,
  },
];

export default function Home() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="grid-bg aura relative overflow-hidden border-b border-line">
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-28 pt-16 sm:px-6 lg:pb-32 lg:pt-24">
          <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
            {/* Левая колонка */}
            <div className="anim-fade-up">
              <span className="chip mono text-[10px] uppercase tracking-[0.18em] text-faint">
                input devices knowledge base
              </span>

              <h1 className="display mt-6 text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem]">
                Идеальный сетап
                <br />
                начинается с <span className="text-volt">данных</span>,
                <br />
                а не мнений
              </h1>

              <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-dim">
                Проверенные характеристики устройств. Реальная совместимость.
                Умный анализ конфигураций на измеренных метриках, а не на
                субъективных впечатлениях.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/tools/calculator" className="btn btn-primary">
                  <Sparkles className="h-4 w-4" />
                  Подобрать сетап
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/database" className="btn btn-secondary">
                  <Database className="h-4 w-4" />
                  Каталог устройств
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-6 w-6 rounded-full border border-line bg-raised"
                    />
                  ))}
                </div>
                <p className="text-[13px] text-faint">
                  <span className="text-dim">{totalDevices} устройств</span> с
                  размеченными источниками данных
                </p>
              </div>
            </div>

            {/* Правая колонка: дашборд */}
            <div className="anim-fade-in lg:pl-4">
              <DashboardPreview
                rows={showcase.rows}
                totalUsd={showcase.totalUsd}
                matchScore={showcase.synergy.score}
                matchVerdict={showcase.synergy.issues[0]?.title ?? "Связка сбалансирована"}
                bars={showcase.bars}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- STAT BAR ---------- */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <dl className="grid grid-cols-2 divide-y divide-line sm:grid-cols-4 sm:divide-y-0 lg:divide-x">
            {[
              { value: totalDevices, suffix: "", label: "Устройств в базе" },
              { value: measuredPads, suffix: "", label: "Ковриков с измерениями cisA" },
              { value: heKeyboards, suffix: "", label: "Клавиатур с Hall Effect" },
              { value: freshKeyboards, suffix: "", label: "Релизов 2025–2026" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`px-2 py-7 sm:px-6 ${i > 0 ? "sm:border-l sm:border-line" : ""}`}
              >
                <dd className="mono text-3xl font-bold tracking-tight lg:text-4xl">
                  <StatCounter value={stat.value} suffix={stat.suffix} />
                </dd>
                <dt className="mt-1.5 text-[13px] leading-snug text-faint">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6">
        <p className="eyebrow">наши возможности</p>
        <h2 className="display mt-3 max-w-2xl text-[2rem] sm:text-[2.5rem]">
          Всё, что нужно для обоснованного выбора
        </h2>

        <div className="stagger mt-12 grid gap-4 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.num}
              href={f.href}
              className="card card-hover anim-fade-up group flex flex-col p-6"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raised text-volt">
                  <f.Icon className="h-4 w-4" />
                </span>
                <span className="mono text-2xl font-bold text-faint/40">{f.num}</span>
              </div>

              <h3 className="mt-6 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-dim">{f.text}</p>

              <div className="mono mt-6 flex items-center justify-between gap-2 border-t border-line pt-4 text-[11px]">
                <span className="text-faint">{f.stat}</span>
                <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-volt" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">каталог</p>
              <h2 className="display mt-3 text-[1.75rem] sm:text-[2.25rem]">
                Четыре категории, один стандарт данных
              </h2>
            </div>
            <Link
              href="/database"
              className="mono flex items-center gap-1.5 text-xs text-dim transition-colors hover:text-volt"
            >
              вся база
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="card card-hover anim-fade-up group p-5"
              >
                <div className="flex items-center justify-between">
                  <c.Icon className="h-4 w-4 text-volt" />
                  <span className="mono text-2xl font-bold tracking-tight">
                    {c.count}
                  </span>
                </div>
                <p className="mt-4 font-medium">{c.label}</p>
                <p className="mono mt-1 text-[11px] text-faint">{c.meta}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- TOOLS ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6">
        <p className="eyebrow">инструменты</p>
        <h2 className="display mt-3 max-w-2xl text-[2rem] sm:text-[2.5rem]">
          Расчёты вместо догадок
        </h2>

        <div className="stagger mt-12 grid gap-4 sm:grid-cols-2">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="card card-hover anim-fade-up group flex items-start gap-4 p-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-raised text-volt">
                <t.Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{t.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-volt" />
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-dim">
                  {t.text}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- LIVE DATA ---------- */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="eyebrow">живая база</p>
              <h2 className="display mt-3 text-[1.75rem] sm:text-[2.25rem]">
                Данные размечены по происхождению
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-dim">
                Мы отличаем измерение от предположения. У каждой записи виден
                статус: подтверждено источником, взято по близкой модели или
                является оценкой. Это позволяет не смешивать факты с догадками.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="badge-new">new</span>
                <span className="badge-updated">updated</span>
                <span className="badge-muted">estimated</span>
              </div>
              <Link
                href="/reviews/methodology"
                className="mono mt-7 inline-flex items-center gap-1.5 text-xs text-dim transition-colors hover:text-volt"
              >
                методология
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {topTrends.map((t) => (
                <div key={t.id} className="card p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">{t.title}</p>
                    <span className="mono text-lg font-bold text-volt">
                      {Math.round(t.share * 100)}%
                    </span>
                  </div>
                  <div className="meter mt-3">
                    <div
                      className="meter-fill anim-bar"
                      style={{ width: `${t.share * 100}%` }}
                    />
                  </div>
                  <p className="mono mt-2.5 text-[11px] text-faint">
                    {t.count} из {t.total} записей
                  </p>
                </div>
              ))}
              <Link
                href="/trending"
                className="mono flex items-center gap-1.5 pt-1 text-xs text-dim transition-colors hover:text-volt"
              >
                все тренды и динамика
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- SEGMENTS ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">ценовые сегменты</p>
            <h2 className="display mt-3 text-[1.75rem] sm:text-[2.25rem]">
              От Budget до High-End
            </h2>
          </div>
        </div>

        <div className="stagger mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(
            [
              ["budget", "Budget"],
              ["mid", "Mid"],
              ["mid-plus", "Mid+"],
              ["premium", "Premium"],
              ["high-end", "High-End"],
            ] as const
          ).map(([slug, label]) => (
            <Link
              key={slug}
              href={`/segments/${slug}`}
              className="card card-hover anim-fade-up p-5"
            >
              <p className="mono text-[11px] uppercase tracking-widest text-faint">
                {label}
              </p>
              <p className="mono mt-3 text-2xl font-bold tracking-tight">
                {counts[slug]}
              </p>
              <p className="mt-1 text-[11px] text-faint">устройств</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6">
        <div className="panel glow-soft relative overflow-hidden px-6 py-14 text-center sm:px-12">
          <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />
          <div className="relative">
            <h2 className="display mx-auto max-w-xl text-[1.75rem] sm:text-[2.25rem]">
              Соберите сетап и проверьте связку
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-dim">
              Регистрация не нужна: конфигурация кодируется в ссылке, а расчёты
              выполняются на измеренных метриках.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/my-setup" className="btn btn-primary">
                Открыть конструктор
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tools/synergy" className="btn btn-secondary">
                Калькулятор синергии
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
