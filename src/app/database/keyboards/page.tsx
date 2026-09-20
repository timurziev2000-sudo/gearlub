import type { Metadata } from "next";
import Link from "next/link";
import { KeyboardCatalog } from "@/components/KeyboardCatalog";
import { keyboards } from "@/data/keyboards";
import { SITE_URL, jsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Игровые клавиатуры 2025–2026: Hall Effect и Rapid Trigger | GearLab",
  description:
    "Каталог игровых клавиатур: Wooting, SteelSeries, Razer, Keychron, ATK, DrunkDeer, MCHOSE, Aula. Магнитные Hall Effect платы с Rapid Trigger, 8000 Hz опрос, фильтры по форм-фактору и цене.",
};

export default function KeyboardsPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: keyboards.length,
    itemListElement: keyboards.map((k, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${k.brand} ${k.name}`,
      url: `${SITE_URL}/database/keyboards/${k.slug}`,
    })),
  };

  const heCount = keyboards.filter((k) => k.hallEffect).length;
  const freshCount = keyboards.filter((k) => (k.releaseYear ?? 0) >= 2025).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(itemList)} />
      <h1 className="anim-fade-up text-3xl font-bold">Клавиатуры</h1>
      <p className="anim-fade-up mt-2 max-w-2xl leading-relaxed text-dim">
        Механика и магнитные Hall Effect платы с Rapid Trigger. От бюджетных gasket-сборок до
        киберспортивных 60% с опросом 8000 Hz.{" "}
        <Link
          href={{ pathname: "/compare", query: { type: "keyboards" } }}
          className="text-neon hover:underline"
        >
          → сравнить клавиатуры
        </Link>
      </p>
      <div className="anim-fade-up mono mt-4 mb-8 flex flex-wrap gap-2 text-xs">
        <span className="chip">{keyboards.length} моделей</span>
        <span className="chip chip-active">{heCount} Hall Effect</span>
        <span className="chip">{freshCount} новинок 2025–2026</span>
      </div>
      <KeyboardCatalog data={keyboards} />
    </div>
  );
}
