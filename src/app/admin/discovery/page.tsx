import type { Metadata } from "next";
import Link from "next/link";
import { runDiscovery, scheduleSummary } from "@/lib/discovery/engine";
import {
  channelsByPriority,
  DISCOVERY_QUERIES,
  GLIDE_MATERIAL_WATCH,
} from "@/lib/discovery/sources";
import { GLIDE_WATCHLIST } from "@/lib/discovery/queue";
import {
  categoryLabel,
  confidenceLabel,
  sourceTypeLabel,
  stageLabel,
  type DiscoveryCategory,
} from "@/lib/discovery/types";

export const metadata: Metadata = {
  title: "Discovery Console — GearLab",
  description: "Внутренняя консоль мониторинга рынка и аудита базы данных.",
  robots: { index: false, follow: false },
};

const severityStyle = {
  blocker: "border-red-500/50 bg-red-500/5",
  warning: "border-volt/40 bg-volt/5",
  note: "border-line",
} as const;

const severityText = {
  blocker: "text-red-400",
  warning: "text-volt",
  note: "text-dim",
} as const;

const severityLabel = {
  blocker: "блокер",
  warning: "предупреждение",
  note: "заметка",
} as const;

export default async function DiscoveryConsole() {
  const report = await runDiscovery();

  const blockers = report.audit.findings.filter((f) => f.severity === "blocker");
  const warnings = report.audit.findings.filter((f) => f.severity === "warning");
  const notes = report.audit.findings.filter((f) => f.severity === "note");

  const dq = report.audit.dataQuality;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/" className="hover:text-white">
          GearLab
        </Link>
        {" / admin / discovery"}
      </nav>

      <p className="mono text-xs uppercase tracking-widest text-neon">internal console</p>
      <h1 className="mt-2 text-3xl font-bold">Discovery Console</h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-dim">
        Мониторинг рынка, очередь обнаруженных продуктов и аудит опубликованной базы.
        Запуск от {report.ranOn}. Ни одна запись не попадает в публичный каталог
        без ручного подтверждения.
      </p>

      {/* Состояние движка */}
      <section
        className={`card mt-8 border p-6 ${
          report.collectorConnected ? "border-neon/40" : "border-volt/40 bg-volt/5"
        }`}
      >
        <h2 className="mono text-xs uppercase tracking-widest text-dim">состояние движка</h2>
        <p className="mt-3 font-semibold">
          {report.collectorConnected
            ? "Сборщик источников подключён."
            : "Сборщик источников не подключён — работает режим аудита и трендов."}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          Очередь кандидатов пуста намеренно: заполнять её правдоподобными записями
          без реального источника означало бы нарушить главное правило — не придумывать
          данные. Ниже перечислено, что нужно для полной автоматизации.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-dim">
          {report.blockers.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-volt">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Сводка */}
      <section className="mono mt-8 grid gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["опубликовано", Object.values(report.published).reduce((a, b) => a + b, 0)],
          ["в очереди", report.queue.total],
          ["получено", report.intake.received],
          ["блокеры", blockers.length],
          ["предупреждения", warnings.length],
          ["заметки", notes.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="card p-4">
            <p className="text-dim">{label}</p>
            <p className="mt-1 text-2xl text-white">{value}</p>
          </div>
        ))}
      </section>

      {/* Качество данных */}
      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          качество данных
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "коврики с измерениями cisA",
              value: dq.padsMeasured,
              total: dq.padsTotal,
            },
            {
              label: "клавиатуры с подтверждёнными данными",
              value: dq.keyboardsVerified,
              total: dq.keyboardsTotal,
            },
            {
              label: "глайды с подтверждёнными данными",
              value: dq.glidesVerified,
              total: dq.glidesTotal,
            },
          ].map((row) => {
            const share = row.total === 0 ? 0 : row.value / row.total;
            return (
              <div key={row.label} className="card p-5">
                <p className="text-sm text-dim">{row.label}</p>
                <p className="mono mt-2 text-2xl text-white">
                  {row.value} / {row.total}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised">
                  <div
                    className="anim-bar h-full rounded-full bg-gradient-to-r from-volt to-neon"
                    style={{ width: `${share * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Очередь */}
      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          очередь обнаруженных продуктов
        </h2>
        {report.queue.total === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-medium">Очередь пуста</p>
            <p className="mt-2 text-sm leading-relaxed text-dim">
              Конвейер готов: обнаружено → на проверке → подтверждено → опубликовано.
              Записи появятся здесь после подключения сборщика источников.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {report.reviews.map((review) => (
              <article key={review.candidateId} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">{review.candidateId}</h3>
                  <div className="mono flex flex-wrap gap-2 text-xs">
                    <span className="chip">{stageLabel(review.stage)}</span>
                    <span className="chip">{confidenceLabel(review.confidence)}</span>
                    <span className="chip chip-active">trend {review.trend.score}</span>
                    <span className="chip">pop {review.popularity.score}</span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-dim">
                  {review.findings.map((f, i) => (
                    <li key={i} className={severityText[f.severity]}>
                      {severityLabel[f.severity]}: <span className="text-dim">{f.message}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Аудит */}
      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          аудит базы данных
        </h2>
        {report.audit.findings.length === 0 ? (
          <div className="card p-8 text-center text-dim">Проблем не обнаружено.</div>
        ) : (
          <div className="space-y-3">
            {report.audit.findings.map((f) => (
              <article key={f.id} className={`card border p-5 ${severityStyle[f.severity]}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`mono text-[11px] uppercase tracking-widest ${severityText[f.severity]}`}
                  >
                    {severityLabel[f.severity]}
                  </span>
                  <span className="mono text-[11px] text-dim">
                    {f.category === "all" ? "общее" : categoryLabel(f.category as DiscoveryCategory)}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-dim">{f.detail}</p>
                <p className="mono mt-3 text-xs text-neon">→ {f.suggestion}</p>
                {f.items.length > 0 && f.items.length <= 8 && (
                  <p className="mono mt-2 text-[11px] text-dim">{f.items.join(", ")}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Бренды */}
      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          бренды: {report.brands.known} известных, {report.brands.unknown.length} в наблюдении
        </h2>
        {report.brands.unknown.length > 0 && (
          <div className="card p-5">
            <p className="text-sm text-dim">
              Бренды из списка наблюдения, моделей которых нет в базе:
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {report.brands.unknown.map((b) => (
                <span key={b.id} className="chip">
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Тренды */}
      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          динамика по датам релиза
        </h2>
        {report.trends.temporal.length === 0 ? (
          <div className="card p-6 text-sm text-dim">
            Данных для расчёта динамики недостаточно: нужны даты релиза у записей.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {report.trends.temporal.map((t) => (
              <article key={t.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{t.title}</h3>
                  <span
                    className={`mono text-xs ${
                      t.direction === "rising"
                        ? "text-neon"
                        : t.direction === "declining"
                          ? "text-red-400"
                          : "text-dim"
                    }`}
                  >
                    {t.direction === "rising"
                      ? "↑ растёт"
                      : t.direction === "declining"
                        ? "↓ снижается"
                        : "= без изменений"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-dim">{t.detail}</p>
                <p className="mono mt-3 text-[11px] text-volt">{t.caveat}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          структурный срез базы
        </h2>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-dim">
          Это состав каталога GearLab, а не доли рынка. Настоящая динамика появится
          после сравнения двух снимков базы, снятых с интервалом.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.trends.structural.map((t) => (
            <article key={t.id} className="card p-4">
              <p className="mono text-[11px] uppercase tracking-widest text-dim">
                {categoryLabel(t.category)}
              </p>
              <h3 className="mt-1.5 text-sm font-semibold">{t.title}</h3>
              <div className="mono mt-3 flex items-baseline justify-between">
                <span className="text-2xl text-volt">{Math.round(t.share * 100)}%</span>
                <span className="text-xs text-dim">
                  {t.count} / {t.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
                <div
                  className="anim-bar h-full rounded-full bg-volt"
                  style={{ width: `${t.share * 100}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Каналы */}
      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          каналы мониторинга: {report.channels.automatable} автоматизируемых,{" "}
          {report.channels.manual} требуют ручной работы
        </h2>
        <div className="space-y-3">
          {channelsByPriority().map((c) => (
            <article key={c.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">{c.label}</h3>
                <div className="mono flex flex-wrap gap-2 text-xs">
                  <span className="chip">{sourceTypeLabel(c.sourceType)}</span>
                  <span
                    className={`chip ${
                      c.policy === "manual-only" || c.policy === "search-operator"
                        ? ""
                        : "chip-active"
                    }`}
                  >
                    {c.policy}
                  </span>
                  <span className="chip">≥ {c.minIntervalH} ч</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-dim">
                извлекается: {c.extracts.join(", ")}
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed text-dim">
                {c.constraints.map((con) => (
                  <li key={con} className="flex gap-2">
                    <span className="text-volt">!</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Наблюдение за глайдами */}
      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          усиленное наблюдение: глайды
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold">Бренды в списке наблюдения</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {GLIDE_WATCHLIST.map((b) => (
                <span key={b} className="chip">
                  {b}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              Список — стартовая точка, а не ограничение: новые производители
              добавляются автоматически при обнаружении в источниках.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold">Материалы под наблюдением</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {GLIDE_MATERIAL_WATCH.map((m) => (
                <span key={m} className="chip">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="card mt-4 p-5">
          <h3 className="text-sm font-semibold">Поисковые шаблоны для глайдов</h3>
          <div className="mono mt-3 flex flex-wrap gap-1.5 text-[11px]">
            {DISCOVERY_QUERIES.glide.map((q) => (
              <span key={q} className="chip">
                {q}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Расписание */}
      <section className="mt-10">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">расписание</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {scheduleSummary().map((job) => (
            <article key={job.name} className="card p-5">
              <span className="mono text-[11px] uppercase tracking-widest text-neon">
                {job.kind}
              </span>
              <h3 className="mt-1.5 font-semibold">{job.name}</h3>
              <p className="mt-2 text-sm text-dim">{job.description}</p>
              <ol className="mono mt-3 space-y-1 text-[11px] text-dim">
                {job.steps.map((s, i) => (
                  <li key={s}>
                    {i + 1}. {s}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs leading-relaxed text-dim">{job.rationale}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Дальнейшие шаги */}
      <section className="card mt-10 p-6">
        <h2 className="mono mb-3 text-xs uppercase tracking-widest text-dim">
          что делать дальше
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-dim">
          {report.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
