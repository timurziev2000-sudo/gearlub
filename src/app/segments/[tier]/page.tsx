import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  itemsInSegment,
  picksForSegment,
  segmentCounts,
} from "@/lib/discovery/segments";
import {
  PRICE_SEGMENTS,
  categoryLabel,
  priceSegmentLabel,
  type PriceSegment,
} from "@/lib/discovery/types";
import { breadcrumbJsonLd, jsonLd } from "@/lib/schema";

const SLUG_TO_SEGMENT: Record<string, PriceSegment> = {
  budget: "budget",
  mid: "mid",
  "mid-plus": "mid-plus",
  premium: "premium",
  "high-end": "high-end",
};

const SEGMENT_INTRO: Record<PriceSegment, string> = {
  budget:
    "Доступный вход в тему. Здесь встречаются как честные бюджетные решения, так и компромиссы по материалам и сборке.",
  mid: "Основной сегмент: технологичные материалы без переплаты за бренд.",
  "mid-plus":
    "Верхняя часть среднего сегмента: заметно лучше материалы и отделка, но без флагманских наценок.",
  premium:
    "Премиум: алюминиевые корпуса, продвинутые сенсоры, стекло и керамика в глайдах.",
  "high-end":
    "High-End: флагманы без компромиссов. Разница с премиумом часто в отделке и мелочах, а не в характеристиках.",
};

export function generateStaticParams() {
  return Object.keys(SLUG_TO_SEGMENT).map((tier) => ({ tier }));
}

export async function generateMetadata({
  params,
}: PageProps<"/segments/[tier]">): Promise<Metadata> {
  const { tier } = await params;
  const segment = SLUG_TO_SEGMENT[tier];
  if (!segment) return {};
  const count = segmentCounts()[segment];
  return {
    title: `${priceSegmentLabel(segment)} периферия: ${count} устройств | GearLab`,
    description: `Мыши, клавиатуры, коврики и глайды сегмента ${priceSegmentLabel(segment)}. ${SEGMENT_INTRO[segment]}`,
  };
}

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

export default async function SegmentPage(props: PageProps<"/segments/[tier]">) {
  const { tier } = await props.params;
  const segment = SLUG_TO_SEGMENT[tier];
  if (!segment) notFound();

  const items = itemsInSegment(segment);
  const picks = picksForSegment(segment);
  const counts = segmentCounts();

  const crumbs = [
    { name: "Главная", url: "/" },
    { name: "Сегменты", url: "/segments/budget" },
    { name: priceSegmentLabel(segment), url: `/segments/${tier}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd(crumbs))}
      />

      <nav className="mono mb-6 flex flex-wrap gap-2 text-xs">
        {PRICE_SEGMENTS.map((s) => {
          const slug = Object.entries(SLUG_TO_SEGMENT).find(([, v]) => v === s)?.[0] ?? "budget";
          return (
            <Link
              key={s}
              href={`/segments/${slug}`}
              className={`chip ${s === segment ? "chip-active" : ""}`}
            >
              {priceSegmentLabel(s)} · {counts[s]}
            </Link>
          );
        })}
      </nav>

      <p className="mono text-xs uppercase tracking-widest text-neon">price segment</p>
      <h1 className="anim-fade-up mt-2 text-3xl font-bold sm:text-4xl">
        {priceSegmentLabel(segment)}
      </h1>
      <p className="anim-fade-up mt-4 max-w-2xl leading-relaxed text-dim">
        {SEGMENT_INTRO[segment]}
      </p>

      <div className="card mt-6 p-5 text-sm leading-relaxed text-dim">
        Сегмент определяется по цене внутри своей категории: глайды за 25 долларов — премиум,
        а мышь за те же деньги — бюджет. Границы заданы вручную и пересматриваются при сдвиге
        рыночных цен. Цены ориентировочные и не являются live-данными.
      </div>

      {picks.length > 0 && (
        <section className="mt-10">
          <h2 className="mono mb-2 text-xs uppercase tracking-widest text-dim">
            заметные позиции сегмента
          </h2>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-dim">
            Отбор по достоверности данных и цене относительно медианы сегмента. Это не рейтинг
            качества: для него нужны лабораторные тесты, которых у GearLab пока нет.
          </p>
          <div className="stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {picks.map(({ item, reasons }) => (
              <article
                key={`${item.category}-${item.slug}`}
                className="card anim-fade-up flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#C6FF00] hover:shadow-[0_0_20px_rgba(198,255,0,0.15)]"
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
                <p className="mono mt-3 text-xs text-dim">{item.meta}</p>
                <ul className="mt-3 flex-1 space-y-1 text-xs leading-relaxed text-dim">
                  {reasons.map((r) => (
                    <li key={r}>— {r}</li>
                  ))}
                </ul>
                <p className={`mono mt-3 text-[11px] ${statusStyle[item.dataStatus]}`}>
                  {statusLabel[item.dataStatus]}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
          все устройства сегмента: {items.length}
        </h2>
        {items.length === 0 ? (
          <div className="card p-8 text-center text-dim">
            В этом сегменте пока нет устройств.
          </div>
        ) : (
          <div className="card divide-y divide-line">
            {items.map((item) => (
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
                  <span className={statusStyle[item.dataStatus]}>
                    {item.dataStatus === "confirmed"
                      ? "✓"
                      : item.dataStatus === "estimated"
                        ? "~"
                        : "?"}
                  </span>
                  <span className="text-volt">${item.priceUsd}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
