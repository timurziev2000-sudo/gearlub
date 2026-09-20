import type { Metadata } from "next";
import Link from "next/link";
import { keyboards } from "@/data/keyboards";
import { structuralTrends, temporalTrends } from "@/lib/discovery/trends";
import { brandSummaries, categoriesWithoutDates, newReleases } from "@/lib/discovery/segments";
import { categoryLabel, priceSegmentLabel } from "@/lib/discovery/types";
import { faqJsonLd, jsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Тренды рынка периферии: состав базы и динамика | GearLab",
  description:
    "Что происходит на рынке игровой периферии: доля Hall Effect, опрос 8000 Hz, стеклянные глайды, UHMW-PE, ультралёгкие мыши. Со честным разделением структуры и динамики.",
};

const faqs = [
  {
    q: "Чем структурный срез отличается от тренда?",
    a: "Структурный срез показывает состав каталога GearLab прямо сейчас: например, сколько процентов клавиатур в базе используют Hall Effect. Тренд — это изменение во времени, для него нужны даты или два снимка базы. Мы не выдаём одно за другое.",
  },
  {
    q: "Почему динамика есть только для клавиатур?",
    a: "Только у клавиатур в базе заполнено поле года выхода. У мышей, ковриков и глайдов дат пока нет, поэтому честную динамику по ним посчитать невозможно — а придумывать даты нельзя.",
  },
  {
    q: "Отражают ли эти доли реальный рынок?",
    a: "Нет. Это состав базы GearLab, который зависит от того, какие устройства мы успели добавить. Для оценки рынка нужны данные о продажах, которых у нас нет.",
  },
];

const currentYear = new Date().getFullYear();

export default function TrendingPage() {
  const structural = structuralTrends();
  const temporal = temporalTrends(currentYear);
  const releases = newReleases(currentYear - 1);
  const noDates = categoriesWithoutDates();
  const brands = brandSummaries().slice(0, 12);

  const heShare = keyboards.filter((k) => k.hallEffect).length / keyboards.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />

      <p className="mono text-xs uppercase tracking-widest text-neon">market observatory</p>
      <h1 className="anim-fade-up mt-2 text-3xl font-bold sm:text-4xl">Тренды рынка</h1>
      <p className="anim-fade-up mt-4 max-w-2xl leading-relaxed text-dim">
        Что меняется в игровой периферии: материалы глайдов, магнитные свичи, частоты опроса,
        вес мышей. Ниже разделены две разные вещи — состав базы прямо сейчас и подтверждённая
        динамика по датам выхода.
      </p>

      <div className="card mt-6 border-volt/40 bg-volt/5 p-5 text-sm leading-relaxed text-dim">
        <p className="mono mb-2 text-xs uppercase tracking-widest text-volt">
          как читать эти цифры
        </p>
        <p>
          Доли ниже описывают каталог GearLab, а не рынок целиком. Утверждение «{Math.round(heShare * 100)}%
          клавиатур в базе имеют Hall Effect» не равно утверждению «{Math.round(heShare * 100)}% клавиатур
          на рынке имеют Hall Effect». Настоящая динамика требует наблюдения во времени.
        </p>
      </div>

      {temporal.length > 0 && (
        <section className="mt-10">
          <h2 className="mono mb-2 text-xs uppercase tracking-widest text-dim">
            подтверждённая динамика
          </h2>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-dim">
            Сравнение моделей {currentYear - 1}–{currentYear} годов с более ранними. Единственная
            категория с датами выхода — клавиатуры.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {temporal.map((t) => (
              <article key={t.id} className="card anim-fade-up p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                <div className="mono mt-4 flex items-baseline gap-3">
                  <span className="text-3xl text-volt">{Math.round(t.share * 100)}%</span>
                  {t.deltaShare !== undefined && (
                    <span
                      className={`text-sm ${t.deltaShare > 0 ? "text-neon" : "text-dim"}`}
                    >
                      {t.deltaShare > 0 ? "+" : ""}
                      {Math.round(t.deltaShare * 100)} п.п.
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-dim">{t.detail}</p>
                <p className="mono mt-3 text-[11px] text-volt">{t.caveat}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mono mb-2 text-xs uppercase tracking-widest text-dim">
          состав базы по признакам
        </h2>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-dim">
          Доля устройств с тем или иным признаком в каталоге. Это срез, а не тренд.
        </p>
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {structural.map((t) => (
            <article key={t.id} className="card anim-fade-up p-5">
              <p className="mono text-[11px] uppercase tracking-widest text-dim">
                {categoryLabel(t.category)}
              </p>
              <h3 className="mt-1.5 font-semibold leading-snug">{t.title}</h3>
              <div className="mono mt-4 flex items-baseline justify-between">
                <span className="text-2xl text-volt">{Math.round(t.share * 100)}%</span>
                <span className="text-xs text-dim">
                  {t.count} из {t.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
                <div
                  className="anim-bar h-full rounded-full bg-gradient-to-r from-neon to-volt"
                  style={{ width: `${t.share * 100}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-dim">{t.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="mono text-xs uppercase tracking-widest text-dim">
            новинки {currentYear - 1}–{currentYear}
          </h2>
          <Link href="/new-releases" className="mono text-xs text-neon hover:underline">
            все новинки →
          </Link>
        </div>
        {releases.length === 0 ? (
          <div className="card mt-4 p-8 text-center text-dim">
            Устройств с датой выхода за этот период в базе нет.
          </div>
        ) : (
          <div className="card mt-4 divide-y divide-line">
            {releases.slice(0, 10).map((item) => (
              <div
                key={`${item.category}-${item.slug}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <Link href={item.href} className="font-medium hover:text-volt">
                    {item.brand} {item.name}
                  </Link>
                  <p className="mono mt-0.5 text-xs text-dim">
                    {categoryLabel(item.category)} · {item.meta}
                  </p>
                </div>
                <div className="mono flex shrink-0 items-center gap-3 text-xs">
                  <span className="chip">{item.releaseYear}</span>
                  <span className="chip">{priceSegmentLabel(item.segment)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {noDates.length > 0 && (
          <p className="mono mt-3 text-xs text-dim">
            Без данных о дате выхода:{" "}
            {noDates.map((c) => categoryLabel(c)).join(", ")}. Поле не заполнено, и подставлять
            приблизительные даты мы не будем.
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          бренды в базе
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <article key={b.name} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{b.name}</h3>
                <span className="mono text-xs text-dim">{b.itemCount}</span>
              </div>
              <p className="mono mt-2 text-[11px] text-dim">
                {b.categories.map((c) => categoryLabel(c)).join(", ")}
              </p>
              <p className="mono mt-1 text-[11px] text-dim">
                ${b.minPriceUsd}–${b.maxPriceUsd} ·{" "}
                {b.segments.map((s) => priceSegmentLabel(s)).join(" / ")}
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-raised">
                <div
                  className="anim-bar h-full rounded-full bg-neon"
                  style={{ width: `${b.confirmedShare * 100}%` }}
                />
              </div>
              <p className="mono mt-1.5 text-[10px] text-dim">
                {Math.round(b.confirmedShare * 100)}% записей с подтверждёнными данными
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">Частые вопросы</h2>
        <div className="space-y-2">
          {faqs.map((f) => (
            <details key={f.q} className="card p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-dim">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
