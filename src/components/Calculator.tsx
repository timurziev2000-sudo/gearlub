"use client";

import { useState } from "react";
import Link from "next/link";
import { buildBundles } from "@/lib/calculator";
import type { Bundle, GameProfile, GripStyle, QuizInput } from "@/lib/types";

const profiles: [GameProfile, string][] = [
  ["tactical-fps", "Тактический шутер (CS2, Valorant)"],
  ["hero-shooter", "Hero shooter (Apex, Overwatch)"],
  ["battle-royale", "Battle royale (Fortnite, PUBG)"],
  ["moba", "MOBA (Dota 2, LoL)"],
  ["mmo", "MMO"],
];

const grips: [GripStyle, string][] = [
  ["palm", "Ладонный"],
  ["claw", "Когтевой"],
  ["fingertip", "Пальцевый"],
];

const sensOpts: [QuizInput["sens"], string][] = [
  ["low", "Низкий sens"],
  ["medium", "Средний"],
  ["high", "Высокий"],
];

const weights: [QuizInput["weightPref"], string][] = [
  ["ultralight", "< 45 г"],
  ["light", "45–60 г"],
  ["balanced", "60–80 г"],
  ["any", "Не важно"],
];

export function Calculator() {
  const [profile, setProfile] = useState<GameProfile>("tactical-fps");
  const [grip, setGrip] = useState<GripStyle>("claw");
  const [sens, setSens] = useState<QuizInput["sens"]>("medium");
  const [weightPref, setWeightPref] = useState<QuizInput["weightPref"]>("any");
  const [kbPref, setKbPref] = useState<QuizInput["kbPref"]>("none");
  const [budget, setBudget] = useState(120);
  const [submitted, setSubmitted] = useState(false);

  const budgetMax = kbPref === "none" ? 250 : 420;

  const bundles: Bundle[] = submitted
    ? buildBundles({ profile, grip, sens, weightPref, budgetUsd: budget, kbPref })
    : [];

  return (
    <div className="space-y-10">
      <section className="card space-y-6 p-6">
        <Group title="Жанр / профиль игры">
          <div className="flex flex-wrap gap-1.5">
            {profiles.map(([v, l]) => (
              <button
                key={v}
                onClick={() => setProfile(v)}
                className={`chip cursor-pointer ${profile === v ? "chip-active" : ""}`}
              >
                {l}
              </button>
            ))}
          </div>
        </Group>

        <div className="grid gap-6 sm:grid-cols-3">
          <Group title="Тип хвата">
            <div className="flex gap-1.5">
              {grips.map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setGrip(v)}
                  className={`chip cursor-pointer ${grip === v ? "chip-active" : ""}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Group>
          <Group title="Sens-профиль">
            <div className="flex flex-wrap gap-1.5">
              {sensOpts.map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setSens(v)}
                  className={`chip cursor-pointer ${sens === v ? "chip-active" : ""}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Group>
          <Group title="Предпочтение по весу">
            <div className="flex flex-wrap gap-1.5">
              {weights.map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setWeightPref(v)}
                  className={`chip cursor-pointer ${weightPref === v ? "chip-active" : ""}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Group>
        </div>

        <Group title="Клавиатура в бандле">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["none", "Не нужна"],
                ["he", "Hall Effect (шутеры)"],
                ["mech", "Механика"],
              ] as [QuizInput["kbPref"], string][]
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => {
                  setKbPref(v);
                  if (v !== "none" && budget < 120) setBudget(160);
                }}
                className={`chip cursor-pointer ${kbPref === v ? "chip-active" : ""}`}
              >
                {l}
              </button>
            ))}
          </div>
        </Group>

        <Group title={`Бюджет${kbPref !== "none" ? " на весь сетап" : ""}: $${budget}`}>
          <input
            type="range"
            min={40}
            max={budgetMax}
            step={10}
            value={Math.min(budget, budgetMax)}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-volt"
          />
        </Group>

        <button
          onClick={() => setSubmitted(true)}
          className="glow-volt w-full cursor-pointer rounded-lg bg-volt py-3 font-semibold text-bg transition-transform hover:scale-[1.01]"
        >
          Собрать бандл
        </button>
      </section>

      {submitted && (
        <section className="space-y-6">
          {bundles.map((b) => {
            const cells: { label: string; item: (typeof b.mouse) }[] = [
              { label: "Мышь", item: b.mouse },
              { label: "Коврик", item: b.pad },
              { label: "Глайды", item: b.glides },
            ];
            if (b.keyboard) cells.push({ label: "Клавиатура", item: b.keyboard });
            const total =
              b.mouse.priceUsd + b.pad.priceUsd + b.glides.priceUsd + (b.keyboard?.priceUsd ?? 0);
            return (
            <article key={`${b.mouse.slug}-${b.pad.slug}`} className="card p-6">
              <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Рекомендованная связка</h2>
                <div className="flex items-center gap-2">
                  <span className="mono text-sm text-dim">итого ${total}</span>
                  <span className="mono rounded-md bg-raised px-3 py-1 text-sm text-volt">
                    match {b.score}%
                  </span>
                </div>
              </header>
              <div className={`grid gap-4 sm:grid-cols-2 ${cells.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
                {cells.map(({ label, item }) => (
                  <Link
                    key={item.slug}
                    href={item.href as never}
                    className="rounded-lg border border-line bg-raised p-4 transition-colors hover:border-volt/50"
                  >
                    <span className="mono text-xs uppercase tracking-widest text-dim">{label}</span>
                    <p className="mt-1 font-semibold leading-snug">{item.label}</p>
                    <p className="mono mt-1 text-xs text-dim">{item.meta}</p>
                    <p className="mono mt-2 text-sm text-volt">${item.priceUsd}</p>
                  </Link>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mono mb-2 text-xs uppercase tracking-widest text-dim">Почему это работает</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-dim">
                    {b.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                {b.warnings.length > 0 && (
                  <div>
                    <h3 className="mono mb-2 text-xs uppercase tracking-widest text-neon">Совместимость</h3>
                    <ul className="space-y-1 text-sm text-dim">
                      {b.warnings.map((w) => (
                        <li key={w} className="rounded-md border border-line bg-raised p-2">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mono mb-2 text-xs uppercase tracking-widest text-dim">{title}</h3>
      {children}
    </div>
  );
}
