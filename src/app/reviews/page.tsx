import type { Metadata } from "next";
import Link from "next/link";
import { reviewSources, type ReviewSourceKind } from "@/data/reviews";

export const metadata: Metadata = {
  title: "Обзоры и внешний research периферии — GearLab",
  description:
    "Обзоры мышей, клавиатур и ковриков: внешние материалы, обсуждения Reddit и методология будущих тестов GearLab.",
};

const kindLabel: Record<ReviewSourceKind, string> = {
  reddit: "Reddit",
  youtube: "YouTube",
  manufacturer: "Производитель",
};

export default function ReviewsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-xs uppercase tracking-widest text-neon">External research</p>
          <h1 className="mt-2 text-3xl font-bold">Обзоры</h1>
          <p className="mt-2 max-w-2xl text-dim">
            Подборка внешних материалов для предварительного исследования. GearLab не выдаёт чужие
            замеры за собственные и не копирует тексты авторов.
          </p>
        </div>
        <Link href="/reviews/methodology" className="chip chip-active">
          Методология GearLab →
        </Link>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="mono text-xs uppercase tracking-widest text-dim">Материалы для проверки</h2>
          <span className="mono text-xs text-dim">{reviewSources.length} подборок</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviewSources.map((source) => (
            <article key={source.slug} className="card flex flex-col p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="mono text-xs uppercase tracking-widest text-volt">
                  {kindLabel[source.kind]}
                </span>
                <span className="text-xs text-dim">{source.category}</span>
              </div>
              <h3 className="mt-4 font-semibold">{source.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-dim">{source.note}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="mono text-[11px] text-dim">проверено {source.checkedOn}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="chip chip-active"
                >
                  Открыть источник ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card mt-10 p-6">
        <h2 className="font-semibold">Как мы используем внешние обзоры</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-dim">
          <li>Сверяем повторяющиеся наблюдения, а не доверяем одному комментарию.</li>
          <li>Отделяем субъективное ощущение поверхности от измерений.</li>
          <li>Фиксируем автора, ссылку и дату проверки материала.</li>
          <li>Для собственных выводов GearLab нужны отдельные тесты и условия измерения.</li>
        </ul>
      </section>
    </div>
  );
}
