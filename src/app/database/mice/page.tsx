import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MiceCatalog } from "@/components/MiceCatalog";
import { facetPages } from "@/data/facets";
import { mice } from "@/data/gear";
import { jsonLd, mouseItemListJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Каталог игровых мышей — GearLab",
  description:
    "Фильтры по сенсору (PAW3395, PAW3950, HERO 2), весу, хвату, polling rate и цене. Технические характеристики для каждой модели.",
};

export default function MicePage() {
  const weights = mice.map((m) => m.weightG);
  const brands = new Set(mice.map((m) => m.brand)).size;
  const highPolling = mice.filter((m) => m.pollingHz >= 8000).length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(mouseItemListJsonLd(mice, "/database/mice"))}
      />

      <nav className="mono mb-6 flex items-center gap-1.5 text-[11px] text-faint">
        <Link href="/database" className="transition-colors hover:text-fg">
          База данных
        </Link>
        <span>/</span>
        <span className="text-dim">Мыши</span>
      </nav>

      <header className="anim-fade-up flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="eyebrow">каталог</p>
          <h1 className="display mt-3 text-[2.25rem] sm:text-[2.75rem]">Игровые мыши</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-dim">
            Фасетный поиск по техническим характеристикам: сенсор, вес, хват,
            частота опроса и клик-латентность.
          </p>
        </div>

        <dl className="mono grid grid-cols-3 gap-x-8 gap-y-1 text-right">
          {[
            [mice.length, "моделей"],
            [`${Math.min(...weights)}–${Math.max(...weights)} г`, "диапазон веса"],
            [brands, "брендов"],
          ].map(([value, label]) => (
            <div key={String(label)}>
              <dd className="text-xl font-bold tracking-tight">{value}</dd>
              <dt className="text-[10px] uppercase tracking-widest text-faint">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </header>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <p className="eyebrow">популярные подборки</p>
          <span className="mono text-[11px] text-faint">{highPolling} моделей с 8K</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {facetPages.map((f) => (
            <Link key={f.slug} href={`/database/mice/f/${f.slug}`} className="chip">
              {f.h1}
              <ArrowRight className="h-3 w-3 opacity-50" />
            </Link>
          ))}
        </div>
      </section>

      <div className="panel mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 text-[13px] text-dim">
        <span>
          <span className="text-fg">Клик-латентность</span> — усреднённое значение,
          не результат собственного замера GearLab.
        </span>
        <Link
          href="/reviews/methodology"
          className="mono ml-auto shrink-0 text-[11px] transition-colors hover:text-volt"
        >
          методология →
        </Link>
      </div>

      <div className="mt-10">
        <MiceCatalog data={mice} />
      </div>
    </div>
  );
}
