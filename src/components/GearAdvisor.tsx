"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { advise } from "@/lib/discovery/advisor";
import { categoryLabel, priceSegmentLabel } from "@/lib/discovery/types";

const EXAMPLES = [
  "Мне нужны недорогие глайды для быстрой игры",
  "Мышь для CS2 до 10000 рублей, claw grip, маленькая рука",
  "Контрольный коврик до $40",
  "Беспроводная мышь до 50 грамм",
  "Клавиатура с Hall Effect и Rapid Trigger до $100",
];

const statusStyle = {
  confirmed: "text-neon",
  estimated: "text-volt",
  unknown: "text-dim",
} as const;

const statusLabel = {
  confirmed: "данные подтверждены",
  estimated: "требует проверки",
  unknown: "статус не установлен",
} as const;

export function GearAdvisor() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const result = useMemo(() => (submitted ? advise(submitted) : null), [submitted]);

  return (
    <div className="space-y-8">
      <section className="card p-5">
        <label
          htmlFor="advisor-query"
          className="mono mb-2 block text-xs uppercase tracking-widest text-dim"
        >
          что вы ищете
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="advisor-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSubmitted(query);
            }}
            placeholder="например: недорогие глайды для быстрой игры"
            className="min-w-64 flex-1 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-white outline-none transition-shadow focus:border-volt focus:shadow-[0_0_16px_rgba(198,255,0,0.25)]"
          />
          <button
            onClick={() => setSubmitted(query)}
            className="glow-volt cursor-pointer rounded-lg bg-volt px-5 py-3 text-sm font-semibold text-bg transition-transform hover:scale-105"
          >
            Подобрать
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => {
                setQuery(e);
                setSubmitted(e);
              }}
              className="chip cursor-pointer text-left"
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      {result && (
        <>
          <section className="card p-5">
            <h2 className="mono mb-3 text-xs uppercase tracking-widest text-dim">
              что распознано в запросе
            </h2>
            {result.intent.recognized.length === 0 ? (
              <p className="text-sm text-dim">
                Признаки не распознаны. Попробуйте указать категорию устройства, бюджет
                и предпочтение по скольжению.
              </p>
            ) : (
              <div className="mono flex flex-wrap gap-1.5 text-xs">
                {result.intent.recognized.map((r) => (
                  <span key={r} className="chip chip-active">
                    {r}
                  </span>
                ))}
              </div>
            )}
            {result.intent.unrecognized.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-dim">
                {result.intent.unrecognized.map((u) => (
                  <li key={u}>— {u}</li>
                ))}
              </ul>
            )}
          </section>

          {result.notes.length > 0 && (
            <section className="card border-volt/40 bg-volt/5 p-5">
              <h2 className="mono mb-3 text-xs uppercase tracking-widest text-volt">
                важные оговорки
              </h2>
              <ul className="space-y-1.5 text-sm leading-relaxed text-dim">
                {result.notes.map((n) => (
                  <li key={n}>— {n}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
              подходящие варианты из базы: {result.recommendations.length}
            </h2>
            {result.recommendations.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="font-medium">Ничего не найдено</p>
                <p className="mt-2 text-sm leading-relaxed text-dim">
                  В базе GearLab нет устройств под все условия запроса. Советник не предлагает
                  товары, которых нет в базе — это защита от выдуманных рекомендаций.
                </p>
              </div>
            ) : (
              <div className="stagger grid gap-4 md:grid-cols-2">
                {result.recommendations.map((r) => (
                  <article
                    key={`${r.category}-${r.slug}`}
                    className="card anim-fade-up flex flex-col p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="mono text-[11px] uppercase tracking-widest text-dim">
                          {categoryLabel(r.category)} · {priceSegmentLabel(r.segment)}
                        </p>
                        <h3 className="mt-1 font-semibold leading-snug">
                          <Link href={r.href} className="hover:text-volt">
                            {r.label}
                          </Link>
                        </h3>
                      </div>
                      <span className="mono shrink-0 rounded-md bg-raised px-2 py-1 text-xs text-volt">
                        ${r.priceUsd}
                      </span>
                    </div>

                    <ul className="mt-3 flex-1 space-y-1 text-xs leading-relaxed text-dim">
                      {r.reasons.map((reason) => (
                        <li key={reason}>— {reason}</li>
                      ))}
                    </ul>

                    {r.cautions.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs leading-relaxed text-volt">
                        {r.cautions.map((c) => (
                          <li key={c}>! {c}</li>
                        ))}
                      </ul>
                    )}

                    <p className={`mono mt-3 text-[11px] ${statusStyle[r.dataStatus]}`}>
                      {statusLabel[r.dataStatus]}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="card p-5 text-sm leading-relaxed text-dim">
            <h2 className="mono mb-3 text-xs uppercase tracking-widest text-dim">
              как работает советник
            </h2>
            <p>
              Это детерминированный разбор запроса по ключевым словам, а не языковая модель.
              Плюс подхода: советник физически не может выдумать модель или характеристику —
              он выбирает только из существующих записей базы. Ограничение: произвольные
              формулировки он понимает хуже, чем LLM.
            </p>
            <p className="mt-3">
              Для проверки связки мыши, коврика и глайдов используйте{" "}
              <Link href="/tools/synergy" className="text-neon hover:underline">
                калькулятор синергии
              </Link>
              .
            </p>
          </section>
        </>
      )}
    </div>
  );
}
