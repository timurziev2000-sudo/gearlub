import type { Metadata } from "next";
import Link from "next/link";
import {
  categoriesWithoutDates,
  newReleases,
  segmentCounts,
} from "@/lib/discovery/segments";
import { categoryLabel, priceSegmentLabel } from "@/lib/discovery/types";

export const metadata: Metadata = {
  title: "Новинки игровой периферии 2025–2026 | GearLab",
  description:
    "Недавно вышедшие мыши, клавиатуры, коврики и глайды в базе GearLab с указанием года выхода, ценового сегмента и статуса достоверности характеристик.",
};

const currentYear = new Date().getFullYear();

const statusStyle = {
  confirmed: "text-neon",
  estimated: "text-volt",
  unknown: "text-dim",
} as const;

const statusLabel = {
  confirmed: "подтверждено",
  estimated: "требует проверки",
  unknown: "статус не установлен",
} as const;

export default function NewReleasesPage() {
  const releases = newReleases(currentYear - 2);
  const noDates = categoriesWithoutDates();
  const counts = segmentCounts();

  const byYear = new Map<number, typeof releases>();
  for (const item of releases) {
    const list = byYear.get(item.releaseYear) ?? [];
    list.push(item);
    byYear.set(item.releaseYear, list);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="mono text-xs uppercase tracking-widest text-neon">new releases</p>
      <h1 className="anim-fade-up mt-2 text-3xl font-bold sm:text-4xl">Новинки</h1>
      <p className="anim-fade-up mt-4 max-w-2xl leading-relaxed text-dim">
        Устройства с подтверждённым годом выхода. Список формируется из поля даты релиза:
        если дата неизвестна, устройство сюда не попадает — приблизительных дат мы не ставим.
      </p>

      <div className="anim-fade-up mono mt-4 flex flex-wrap gap-2 text-xs">
        <span className="chip chip-active">{releases.length} новинок</span>
        {years.map((y) => (
          <span key={y} className="chip">
            {y}: {byYear.get(y)?.length ?? 0}
          </span>
        ))}
      </div>

      {noDates.length > 0 && (
        <div className="card mt-6 p-5 text-sm leading-relaxed text-dim">
          <p className="mono mb-2 text-xs uppercase tracking-widest text-volt">
            пробел в данных
          </p>
          <p>
            В категориях {noDates.map((c) => categoryLabel(c)).join(", ")} поле даты выхода
            не заполнено ни у одной записи, поэтому новинки по ним не отображаются. Это
            ограничение данных, а не отсутствие новинок на рынке.
          </p>
        </div>
      )}

      {years.map((year) => (
        <section key={year} className="mt-10">
          <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">{year}</h2>
          <div className="stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {byYear.get(year)?.map((item) => (
              <article
                key={`${item.category}-${item.slug}`}
                className="card anim-fade-up flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#00E5FF] hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="mono text-[11px] uppercase tracking-widest text-dim">
                      {categoryLabel(item.category)}
                    </p>
                    <h3 className="mt-1 font-semibold leading-snug">
                      <Link href={item.href} className="hover:text-volt">
                        {item.brand} {item.name}
                      </Link>
                    </h3>
                  </div>
                  <span className="mono shrink-0 rounded-md bg-raised px-2 py-1 text-xs text-volt">
                    ${item.priceUsd}
                  </span>
                </div>
                <p className="mono mt-3 flex-1 text-xs leading-relaxed text-dim">{item.meta}</p>
                <div className="mono mt-4 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="chip">{priceSegmentLabel(item.segment)}</span>
                  <span className={statusStyle[item.dataStatus]}>
                    {statusLabel[item.dataStatus]}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          по ценовым сегментам
        </h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["budget", "Budget"],
              ["mid", "Mid"],
              ["mid-plus", "Mid+"],
              ["premium", "Premium"],
              ["high-end", "High-End"],
            ] as const
          ).map(([slug, label]) => (
            <Link key={slug} href={`/segments/${slug}`} className="chip">
              {label} · {counts[slug === "mid-plus" ? "mid-plus" : slug]}
            </Link>
          ))}
        </div>
      </section>

      <p className="mono mt-10 text-xs text-dim">
        <Link href="/trending" className="text-neon hover:underline">
          → тренды рынка и состав базы
        </Link>
      </p>
    </div>
  );
}
