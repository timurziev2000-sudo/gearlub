import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mice, pads } from "@/data/gear";
import { MouseVisual } from "@/components/DeviceVisual";
import { gripList, surfaceLabel } from "@/lib/labels";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLd,
  mouseProductJsonLd,
} from "@/lib/schema";

export function generateStaticParams() {
  return mice.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/database/mice/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const mouse = mice.find((m) => m.slug === slug);
  if (!mouse) return {};
  return {
    title: `${mouse.brand} ${mouse.name} — характеристики и метрики | GearLab`,
    description: `${mouse.sensor}, ${mouse.weightG} г, ${mouse.pollingHz} Hz, клик-латентность ${mouse.clickLatencyMs} ms. Совместимость с ковриками и глайдами.`,
  };
}

function buildFaqs(mouse: (typeof mice)[number]) {
  return [
    {
      q: `Какой сенсор в ${mouse.brand} ${mouse.name}?`,
      a: `Сенсор ${mouse.sensor} с максимальным разрешением ${mouse.dpiMax.toLocaleString("ru-RU")} DPI${mouse.motionSync ? " и поддержкой Motion Sync" : ""}.`,
    },
    {
      q: `Сколько весит ${mouse.name} и для какого хвата она подходит?`,
      a: `Вес — ${mouse.weightG} г. Форма (${mouse.shape === "symmetric" ? "симметричная" : "эргономичная"}) оптимизирована под хват: ${mouse.grips.join(", ")}.`,
    },
    {
      q: `Какая задержка клика у ${mouse.name}?`,
      a: `Усреднённая клик-латентность — ${mouse.clickLatencyMs} ms при polling rate ${mouse.pollingHz} Hz.`,
    },
  ];
}

export default async function MousePage(props: PageProps<"/database/mice/[slug]">) {
  const { slug } = await props.params;
  const mouse = mice.find((m) => m.slug === slug);
  if (!mouse) notFound();

  const specs: [string, string][] = [
    ["Сенсор", mouse.sensor],
    ["Макс. DPI", mouse.dpiMax.toLocaleString("ru-RU")],
    ["Вес", `${mouse.weightG} г`],
    ["Форма", mouse.shape === "symmetric" ? "симметричная" : "эргономичная"],
    ["Хваты", gripList(mouse.grips)],
    ["Подключение", connLabel(mouse.connectivity)],
    ["Polling rate", `${mouse.pollingHz} Hz`],
    ["Motion Sync", mouse.motionSync ? "да" : "нет"],
    ["Свичи", mouse.switches],
    ["Клик-латентность", `${mouse.clickLatencyMs} ms`],
    ["Размер кисти", handLabel(mouse.handSize)],
  ];

  if (mouse.dimensionsMm) specs.push(["Габариты, мм", mouse.dimensionsMm]);
  if (mouse.batteryMah)
    specs.push([
      "Аккумулятор",
      mouse.batteryLifeH ? `${mouse.batteryMah} мАч · до ${mouse.batteryLifeH} ч @1000 Hz` : `${mouse.batteryMah} мАч`,
    ]);
  if (mouse.mcu) specs.push(["Контроллер (MCU)", mouse.mcu]);
  if (mouse.coating) specs.push(["Покрытие", mouse.coating]);
  specs.push(["Ориентировочная цена", `$${mouse.priceUsd}`]);

  const compat: string[] = [];
  if (mouse.weightG <= 45)
    compat.push("Ультралёгкий корпус: на мягких контроль-ковриках следите за износом глайдов — тонкие слайды быстрее «проваливаются».");
  if (mouse.pollingHz >= 4000)
    compat.push(`Polling ${mouse.pollingHz} Hz требует запаса по CPU; на low sens выгоды почти нет.`);
  if (!mouse.motionSync)
    compat.push("Без motion sync возможен асимметричный трекинг на высоких скоростях мыпи.");

  const relatedPads = pads.slice(0, 3);
  const faqs = buildFaqs(mouse);

  const crumbs = [
    { name: "Главная", url: "/" },
    { name: "База данных", url: "/database" },
    { name: "Мыши", url: "/database/mice" },
    { name: `${mouse.brand} ${mouse.name}`, url: `/database/mice/${mouse.slug}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(mouseProductJsonLd(mouse))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd(crumbs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />

      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/database" className="hover:text-white">База данных</Link>
        {" / "}
        <Link href="/database/mice" className="hover:text-white">Мыши</Link>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">
          {mouse.brand} {mouse.name}
        </h1>
        <span className="mono rounded-lg bg-volt px-4 py-2 font-bold text-bg">${mouse.priceUsd}</span>
      </div>

      <Link
        href={{ pathname: "/compare", query: { ids: mouse.slug } }}
        className="mono mt-3 inline-block text-sm text-neon hover:underline"
      >
        → добавить в сравнение
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="anim-fade-in mb-8 max-w-sm">
            <MouseVisual mouse={mouse} />
          </div>
          <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">Спецификации</h2>
          <dl className="card divide-y divide-line">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between px-5 py-3">
                <dt className="text-dim">{k}</dt>
                <dd className="mono text-sm">{v}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-10 max-w-2xl">
            <h2 className="mb-4 text-xl font-semibold">FAQ</h2>
            <div className="space-y-2">
              {faqs.map((f) => (
                <details key={f.q} className="card p-4">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-2 text-sm text-dim">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-6">
          <div>
            <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">Заметки совместимости</h2>
            <ul className="space-y-2">
              {compat.map((c) => (
                <li key={c} className="card p-4 text-sm text-dim">{c}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">Популярные коврики</h2>
            <ul className="space-y-2">
              {relatedPads.map((p) => (
                <li key={p.slug} className="card flex items-center justify-between p-4 text-sm">
                  <span>{p.brand} {p.name}</span>
                  <span className="chip">{surfaceLabel(p.surface)}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function connLabel(c: string): string {
  const map: Record<string, string> = {
    wired: "проводная",
    wireless: "2.4 GHz беспроводная",
    hybrid: "гибрид (2.4 GHz + провод)",
  };
  return map[c] ?? c;
}

function handLabel(h: string): string {
  const map: Record<string, string> = {
    small: "маленькая / средняя",
    medium: "средняя",
    large: "крупная",
    universal: "универсальная",
  };
  return map[h] ?? h;
}
