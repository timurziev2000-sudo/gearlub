import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { keyboards } from "@/data/keyboards";
import { KeyboardVisual } from "@/components/DeviceVisual";
import { kbConnLabel, kbLayoutLabel, specSourceLabel } from "@/lib/labels";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLd,
  keyboardProductJsonLd,
} from "@/lib/schema";

export function generateStaticParams() {
  return keyboards.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/database/keyboards/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const kb = keyboards.find((k) => k.slug === slug);
  if (!kb) return {};
  return {
    title: `${kb.brand} ${kb.name} — характеристики | GearLab`,
    description: `${kbLayoutLabel(kb.layout)}, ${kb.switches}${kb.hallEffect ? ", Hall Effect с Rapid Trigger" : ""}, ${kbConnLabel(kb.connectivity)}. Цена ~$${kb.priceUsd}.`,
  };
}

export default async function KeyboardPage(
  props: PageProps<"/database/keyboards/[slug]">,
) {
  const { slug } = await props.params;
  const kb = keyboards.find((k) => k.slug === slug);
  if (!kb) notFound();

  const specs: [string, string][] = [
    ["Форм-фактор", kbLayoutLabel(kb.layout)],
    ["Свичи", kb.switches],
    [
      "Сила срабатывания",
      kb.actuationG ? `${kb.actuationG} г` : "регулируемая (магнитные)",
    ],
    ["Hot-swap", kb.hotSwap ? "да" : "нет"],
    ["Подключение", kbConnLabel(kb.connectivity)],
    ["Крепление", kb.mount === "gasket" ? "gasket mount" : "tray mount"],
    ["Polling rate", `${kb.pollRateHz} Hz`],
    ["Hall Effect", kb.hallEffect ? "да" : "нет"],
    ["Rapid Trigger", kb.rapidTrigger ? "да" : "нет"],
    ...(kb.analogInput !== undefined
      ? ([["Аналоговый ввод", kb.analogInput ? "да" : "нет"]] as [string, string][])
      : []),
    ...(kb.caseMaterial ? ([["Корпус", kb.caseMaterial]] as [string, string][]) : []),
    ...(kb.releaseYear
      ? ([["Год выхода", String(kb.releaseYear)]] as [string, string][])
      : []),
    ["Ориентировочная цена", `$${kb.priceUsd}`],
  ];

  const compat: string[] = [];
  if (kb.hallEffect && kb.rapidTrigger)
    compat.push("Rapid Trigger — ключевой режим для шутеров: сброс клавиши мгновенно регистрируется, стрейфы становятся короче. Включается в фирменном ПО.");
  if (kb.hallEffect && !kb.hotSwap)
    compat.push("Магнитные свичи не подразумевают обычную замену — подбор аналогов ограничен.");
  if (kb.hotSwap && !kb.hallEffect)
    compat.push("Hot-swap: свичи меняются без пайки — можно тюнинговать звук и нажатие.");
  if (kb.connectivity === "tri-mode")
    compat.push("Tri-mode: Bluetooth — для работы, 2.4 GHz донгл — для игр (минимальная задержка).");
  if (kb.mount === "gasket")
    compat.push("Gasket mount даёт мягче нажатие и глубже звук, чем tray.");

  const faqs = [
    {
      q: `Какой форм-фактор у ${kb.brand} ${kb.name} и кому он подходит?`,
      a: `Раскладка ${kbLayoutLabel(kb.layout)}. Компактные форм-факторы освобождают место для мыши — актуально для low sens игроков.`,
    },
    {
      q: `Есть ли в ${kb.name} Hall Effect и Rapid Trigger?`,
      a: kb.hallEffect
        ? `Да: магнитные свичи (${kb.switches})${kb.rapidTrigger ? " с поддержкой Rapid Trigger" : ""}, точка срабатывания регулируется программно.`
        : "Нет, это классическая механическая модель.",
    },
    {
      q: `Можно ли заменить свичи на ${kb.name}?`,
      a: kb.hotSwap
        ? "Да, плата hot-swap — свичи извлекаются специальным съёмником без пайки."
        : "Нет, свичи распаяны — замена требует пайки.",
    },
  ];

  const crumbs = [
    { name: "Главная", url: "/" },
    { name: "База данных", url: "/database" },
    { name: "Клавиатуры", url: "/database/keyboards" },
    { name: `${kb.brand} ${kb.name}`, url: `/database/keyboards/${kb.slug}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(keyboardProductJsonLd(kb))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd(crumbs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />

      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/database" className="hover:text-white">База данных</Link>
        {" / "}
        <Link href="/database/keyboards" className="hover:text-white">Клавиатуры</Link>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">
          {kb.brand} {kb.name}
        </h1>
        <span className="mono rounded-lg bg-volt px-4 py-2 font-bold text-bg">${kb.priceUsd}</span>
      </div>

      <Link
        href={{ pathname: "/compare", query: { type: "keyboards", ids: kb.slug } }}
        className="mono mt-3 inline-block text-sm text-neon hover:underline"
      >
        → добавить в сравнение
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="anim-fade-in mb-8 max-w-lg">
            <KeyboardVisual kb={kb} />
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
            <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
              Заметки совместимости
            </h2>
            <ul className="space-y-2">
              {compat.map((c) => (
                <li key={c} className="card p-4 text-sm text-dim">{c}</li>
              ))}
            </ul>
          </div>

          {kb.sources && kb.sources.length > 0 && (
            <div>
              <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
                Источники и проверка
              </h2>
              <div className="card p-4">
                {kb.specSource && (
                  <p className="mono mb-3 text-xs text-neon">
                    статус данных: {specSourceLabel(kb.specSource)}
                  </p>
                )}
                <ul className="space-y-2 text-sm">
                  {kb.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-dim transition-colors hover:text-neon"
                      >
                        {s.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
