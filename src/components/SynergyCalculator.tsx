"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { glides, mice, pads } from "@/data/gear";
import { fmtFriction, frictionSourceLabel, textureLabel } from "@/lib/friction";
import { materialLabel, surfaceLabel } from "@/lib/labels";
import {
  analyzeSynergy,
  betterGlides,
  betterPads,
  effortClassLabel,
  severityLabel,
  type Severity,
} from "@/lib/synergy";

const selectCls =
  "w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface px-4 py-3 text-sm text-white outline-none transition-shadow focus:border-volt focus:shadow-[0_0_16px_rgba(198,255,0,0.25)]";

const sensOptions = [
  { key: "low", label: "Low sens" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High sens" },
] as const;

const severityStyle: Record<Severity, string> = {
  critical: "border-red-500/50 bg-red-500/5",
  warning: "border-volt/40 bg-volt/5",
  info: "border-line",
  good: "border-neon/40 bg-neon/5",
};

const severityText: Record<Severity, string> = {
  critical: "text-red-400",
  warning: "text-volt",
  info: "text-dim",
  good: "text-neon",
};

const sortedMice = [...mice].sort((a, b) =>
  `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, "ru"),
);
const sortedPads = [...pads].sort((a, b) =>
  `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, "ru"),
);
const sortedGlides = [...glides].sort((a, b) =>
  `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, "ru"),
);

export function SynergyCalculator() {
  const [mouseSlug, setMouseSlug] = useState(sortedMice[0].slug);
  const [padSlug, setPadSlug] = useState(sortedPads[0].slug);
  const [glideSlug, setGlideSlug] = useState(sortedGlides[0].slug);
  const [sens, setSens] = useState<"low" | "medium" | "high">("medium");

  const input = useMemo(() => {
    const mouse = mice.find((m) => m.slug === mouseSlug)!;
    const pad = pads.find((p) => p.slug === padSlug)!;
    const glide = glides.find((g) => g.slug === glideSlug)!;
    return { mouse, pad, glide, sens };
  }, [mouseSlug, padSlug, glideSlug, sens]);

  const result = useMemo(() => analyzeSynergy(input), [input]);
  const glideAlts = useMemo(() => betterGlides(input, glides), [input]);
  const padAlts = useMemo(() => betterPads(input, pads), [input]);

  const scoreTone =
    result.score >= 75 ? "text-neon" : result.score >= 50 ? "text-volt" : "text-red-400";

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <label className="mono mb-2 block text-xs uppercase tracking-widest text-dim">
            Мышь
          </label>
          <select
            value={mouseSlug}
            onChange={(e) => setMouseSlug(e.target.value)}
            className={selectCls}
          >
            {sortedMice.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.brand} {m.name} — {m.weightG} г
              </option>
            ))}
          </select>
          <p className="mono mt-3 text-xs text-dim">
            вес <span className="text-white">{input.mouse.weightG} г</span> · форма{" "}
            <span className="text-white">
              {input.mouse.shape === "symmetric" ? "симметричная" : "эргономичная"}
            </span>
          </p>
        </div>

        <div className="card p-5">
          <label className="mono mb-2 block text-xs uppercase tracking-widest text-dim">
            Коврик
          </label>
          <select
            value={padSlug}
            onChange={(e) => setPadSlug(e.target.value)}
            className={selectCls}
          >
            {sortedPads.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.brand} {p.name} — {fmtFriction((p.dynamicFrictionX + p.dynamicFrictionY) / 2)}
              </option>
            ))}
          </select>
          <p className="mono mt-3 text-xs text-dim">
            {textureLabel(input.pad.surfaceTexture)} · {surfaceLabel(input.pad.surface)} ·{" "}
            <span className={input.pad.frictionSource === "cisA" ? "text-white" : "text-neon"}>
              {frictionSourceLabel(input.pad.frictionSource)}
            </span>
          </p>
        </div>

        <div className="card p-5">
          <label className="mono mb-2 block text-xs uppercase tracking-widest text-dim">
            Глайды
          </label>
          <select
            value={glideSlug}
            onChange={(e) => setGlideSlug(e.target.value)}
            className={selectCls}
          >
            {sortedGlides.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.brand} {g.name} — {materialLabel(g.material)}
              </option>
            ))}
          </select>
          <p className="mono mt-3 text-xs text-dim">
            {materialLabel(input.glide.material)} ·{" "}
            <span className="text-white">{input.glide.thicknessMm} мм</span>
          </p>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <span className="mono text-xs uppercase tracking-widest text-dim">
          профиль чувствительности
        </span>
        {sensOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => setSens(o.key)}
            className={`chip cursor-pointer ${sens === o.key ? "chip-active" : ""}`}
          >
            {o.label}
          </button>
        ))}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono text-xs uppercase tracking-widest text-dim">
              оценка связки
            </p>
            <p className={`mono mt-1 text-5xl font-bold ${scoreTone}`}>{result.score}</p>
          </div>
          <div className="text-right">
            <p className="mono text-xs uppercase tracking-widest text-dim">
              эффективное сопротивление
            </p>
            <p className="mono mt-1 text-2xl text-white">
              {fmtFriction(result.effectiveResistance)}
            </p>
            <p className="mono text-xs text-dim">{effortClassLabel(result.effortClass)}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mono flex justify-between text-[11px] text-dim">
            <span>быстро</span>
            <span>медленно</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-raised">
            <div
              className="anim-bar h-full rounded-full bg-gradient-to-r from-neon to-volt"
              style={{ width: `${result.effortPercent}%` }}
            />
          </div>
        </div>

        <div className="mono mt-6 grid gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-raised p-3">
            <p className="text-dim">трение коврика</p>
            <p className="mt-1 text-white">{fmtFriction(result.padResistance)}</p>
          </div>
          <div className="rounded-lg bg-raised p-3">
            <p className="text-dim">вклад глайдов</p>
            <p className={`mt-1 ${result.glideDelta < 0 ? "text-neon" : "text-white"}`}>
              {result.glideDelta > 0 ? "+" : ""}
              {result.glideDelta.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg bg-raised p-3">
            <p className="text-dim">вклад веса</p>
            <p className={`mt-1 ${result.weightDelta > 0 ? "text-volt" : "text-neon"}`}>
              {result.weightDelta > 0 ? "+" : ""}
              {result.weightDelta.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg bg-raised p-3">
            <p className="text-dim">ресурс глайдов</p>
            <p className="mt-1 text-white">≈ {result.glideLifeWeeks} нед.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          Анализ связки
        </h2>
        <div className="space-y-3">
          {result.issues.map((i) => (
            <article key={i.title} className={`card border p-5 ${severityStyle[i.severity]}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`mono text-[11px] uppercase tracking-widest ${severityText[i.severity]}`}
                >
                  {severityLabel(i.severity)}
                </span>
                <h3 className="font-semibold">{i.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-dim">{i.detail}</p>
            </article>
          ))}
        </div>
      </section>

      {result.suggestions.length > 0 && (
        <section className="card p-5">
          <h2 className="mono mb-3 text-xs uppercase tracking-widest text-dim">
            Что можно поправить
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-dim">
            {result.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {(glideAlts.length > 0 || padAlts.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2">
          {glideAlts.length > 0 && (
            <div>
              <h2 className="mono mb-3 text-xs uppercase tracking-widest text-dim">
                Глайды получше под этот коврик
              </h2>
              <ul className="space-y-2">
                {glideAlts.map(({ glide, score }) => (
                  <li
                    key={glide.slug}
                    className="card flex items-center justify-between gap-3 p-4 text-sm"
                  >
                    <button
                      onClick={() => setGlideSlug(glide.slug)}
                      className="cursor-pointer text-left hover:text-neon"
                    >
                      {glide.brand} {glide.name}
                      <span className="mono ml-2 text-xs text-dim">
                        {materialLabel(glide.material)}
                      </span>
                    </button>
                    <span className="mono shrink-0 text-xs text-volt">{score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {padAlts.length > 0 && (
            <div>
              <h2 className="mono mb-3 text-xs uppercase tracking-widest text-dim">
                Коврики получше под эту мышь и глайды
              </h2>
              <ul className="space-y-2">
                {padAlts.map(({ pad, score }) => (
                  <li
                    key={pad.slug}
                    className="card flex items-center justify-between gap-3 p-4 text-sm"
                  >
                    <button
                      onClick={() => setPadSlug(pad.slug)}
                      className="cursor-pointer text-left hover:text-neon"
                    >
                      {pad.brand} {pad.name}
                      <span className="mono ml-2 text-xs text-dim">
                        {fmtFriction((pad.dynamicFrictionX + pad.dynamicFrictionY) / 2)}
                      </span>
                    </button>
                    <span className="mono shrink-0 text-xs text-volt">{score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="card p-6 text-sm leading-relaxed text-dim">
        <h2 className="mono mb-3 text-xs uppercase tracking-widest text-dim">Как это считается</h2>
        <p className="mono text-white">
          сопротивление = трение коврика × коэффициент глайдов × поправка на вес
        </p>
        <p className="mt-3">
          Трение коврика — средняя динамика по осям X и Y из таблицы cisA. Коэффициент глайдов
          отражает материал: чистый PTFE принят за единицу, PTFE + MoS₂ даёт 0,92, стекло 0,78,
          керамика 0,72. Поправка на вес учитывает, что тяжёлая мышь сильнее прижимается к
          поверхности: база — 55 г.
        </p>
        <p className="mt-3">
          Коэффициенты глайдов и формула ресурса — эвристики на основе физики скольжения и
          практики сообщества, а не лабораторные измерения конкретных связок. Они полезны для
          сравнения вариантов между собой, но не дают абсолютных значений.{" "}
          <Link href="/reviews/methodology" className="text-neon hover:underline">
            Методология и ограничения
          </Link>
        </p>
      </section>
    </div>
  );
}
