import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { glides, pads } from "@/data/gear";
import { PadVisual } from "@/components/DeviceVisual";
import { materialLabel, surfaceLabel } from "@/lib/labels";
import {
  anisotropy,
  anisotropyLabel,
  anisotropyLevel,
  avgDynamic,
  avgStatic,
  fmtFriction,
  frictionPercent,
  frictionSourceLabel,
  speedClass,
  speedClassLabel,
  stictionDelta,
  textureLabel,
} from "@/lib/friction";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLd,
  padProductJsonLd,
} from "@/lib/schema";

export function generateStaticParams() {
  return pads.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/database/pads/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pad = pads.find((p) => p.slug === slug);
  if (!pad) return {};
  return {
    title: `${pad.brand} ${pad.name} — сила трения X/Y и характеристики | GearLab`,
    description: `Динамика ${fmtFriction(pad.dynamicFrictionX)}/${fmtFriction(pad.dynamicFrictionY)}, статика ${fmtFriction(pad.staticFrictionX)}/${fmtFriction(pad.staticFrictionY)}, ${textureLabel(pad.surfaceTexture)} поверхность, толщина ${pad.thickness} мм.`,
  };
}

export default async function PadPage(props: PageProps<"/database/pads/[slug]">) {
  const { slug } = await props.params;
  const pad = pads.find((p) => p.slug === slug);
  if (!pad) notFound();

  const cls = speedClass(pad);
  const aniso = anisotropyLevel(pad);
  const stiction = stictionDelta(pad);

  const specs: [string, string][] = [
    ["Динамическая сила трения, ось X", fmtFriction(pad.dynamicFrictionX)],
    ["Динамическая сила трения, ось Y", fmtFriction(pad.dynamicFrictionY)],
    ["Статическая сила трения, ось X", fmtFriction(pad.staticFrictionX)],
    ["Статическая сила трения, ось Y", fmtFriction(pad.staticFrictionY)],
    ["Средняя динамика", fmtFriction(avgDynamic(pad))],
    ["Средняя статика", fmtFriction(avgStatic(pad))],
    ["Анизотропия X/Y", `Δ ${fmtFriction(anisotropy(pad))} — ${anisotropyLabel(aniso)}`],
    ["Залипание (статика − динамика)", fmtFriction(stiction)],
    ["Поверхность на ощупь", textureLabel(pad.surfaceTexture)],
    ["Класс скольжения", speedClassLabel(cls)],
    ["Тип", surfaceLabel(pad.surface)],
    ["Толщина", `${pad.thickness} мм`],
    ["Основание", pad.base],
    ["Кромки", pad.stitchedEdges ? "прошитые" : "без прошивки"],
    ["Источник метрик трения", frictionSourceLabel(pad.frictionSource)],
    ["Ориентировочная цена", `$${pad.priceUsd}`],
  ];

  const notes: string[] = [];
  if (pad.surfaceTexture === "glass") {
    notes.push(
      "Стеклянная поверхность быстро изнашивает чистый PTFE. Для стекла берите керамические или стеклянные глайды.",
    );
  }
  if (avgDynamic(pad) >= 24) {
    notes.push(
      "Высокое трение требует запаса свободного хода: на low sens нужен размер XL или больше.",
    );
  }
  if (avgDynamic(pad) < 16) {
    notes.push(
      "Очень быстрая поверхность: на high sens возрастает цена ошибки при микрокоррекциях.",
    );
  }
  if (aniso === "high") {
    notes.push(
      "Разница между осями заметна на практике: горизонтальные флики и вертикальный трекинг будут ощущаться по-разному.",
    );
  }
  if (stiction >= 2.5) {
    notes.push(
      "Заметное усилие срыва с места: старт движения будет более выраженным, чем продолжение.",
    );
  }
  if (notes.length === 0) {
    notes.push("Сбалансированный профиль без выраженных особенностей поведения поверхности.");
  }

  const recommendedGlides = glides
    .filter((g) =>
      pad.surfaceTexture === "glass"
        ? g.material === "glass" || g.material === "ceramic"
        : g.material === "ptfe" || g.material === "ptfe-mos2",
    )
    .slice(0, 3);

  const similar = pads
    .filter((p) => p.slug !== pad.slug)
    .sort(
      (a, b) =>
        Math.abs(avgDynamic(a) - avgDynamic(pad)) - Math.abs(avgDynamic(b) - avgDynamic(pad)),
    )
    .slice(0, 4);

  const faqs = [
    {
      q: `Быстрый или медленный коврик ${pad.brand} ${pad.name}?`,
      a: `Средняя динамическая сила трения — ${fmtFriction(avgDynamic(pad))}, это ${speedClassLabel(cls)} профиль по шкале cisA.`,
    },
    {
      q: `Что означают числа X и Y у ${pad.name}?`,
      a: `X — горизонтальная ось, Y — вертикальная. У этой модели разница составляет ${fmtFriction(anisotropy(pad))}: ${anisotropyLabel(aniso)}.`,
    },
    {
      q: `Какие глайды подходят под ${pad.name}?`,
      a:
        pad.surfaceTexture === "glass"
          ? "Для стеклянной поверхности подходят керамические и стеклянные глайды: чистый PTFE изнашивается быстро."
          : "Для тканевой поверхности подходят PTFE и PTFE + MoS₂ глайды.",
    },
  ];

  const crumbs = [
    { name: "Главная", url: "/" },
    { name: "База данных", url: "/database" },
    { name: "Коврики", url: "/database/pads" },
    { name: `${pad.brand} ${pad.name}`, url: `/database/pads/${pad.slug}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(padProductJsonLd(pad))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd(crumbs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />

      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/database" className="hover:text-white">
          База данных
        </Link>
        {" / "}
        <Link href="/database/pads" className="hover:text-white">
          Коврики
        </Link>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">
          {pad.brand} {pad.name}
        </h1>
        <span className="mono rounded-lg bg-volt px-4 py-2 font-bold text-bg">
          ${pad.priceUsd}
        </span>
      </div>

      <Link
        href={{ pathname: "/compare", query: { type: "pads", ids: pad.slug } }}
        className="mono mt-3 inline-block text-sm text-neon hover:underline"
      >
        → добавить в сравнение
      </Link>
      <Link
        href="/tools/synergy"
        className="mono mt-3 ml-4 inline-block text-sm text-volt hover:underline"
      >
        → проверить связку с мышью и глайдами
      </Link>

      {pad.frictionSource !== "cisA" && (
        <div className="card mt-6 border-neon/40 p-5 text-sm leading-relaxed text-dim">
          <p className="mono mb-2 text-xs uppercase tracking-widest text-neon">
            данные требуют проверки
          </p>
          {pad.frictionSource === "cisA-proxy" ? (
            <p>
              Этой модели нет в таблице cisA. Значения трения приведены по близкой модели той же
              линейки{pad.frictionProxyOf ? `: ${pad.frictionProxyOf}` : ""}. Реальные цифры могут
              отличаться из-за версии поверхности и степени износа.
            </p>
          ) : (
            <p>
              Этой модели нет в таблице cisA. Значения трения являются оценкой на основе типа
              поверхности и не подтверждены измерением. Не используйте их для точных сравнений.
            </p>
          )}
        </div>
      )}

      <section className="card mt-8 p-6">
        <div className="mb-6 max-w-md">
          <PadVisual pad={pad} />
        </div>
        <div className="mono flex items-center justify-between text-xs text-dim">
          <span>скорость</span>
          <span className="text-white">{speedClassLabel(cls)}</span>
          <span>контроль</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-raised">
          <div
            className="anim-bar h-full rounded-full bg-gradient-to-r from-neon to-volt"
            style={{ width: `${frictionPercent(pad)}%` }}
          />
        </div>
        <div className="mono mt-3 grid gap-2 text-xs text-dim sm:grid-cols-3">
          <span>
            динамика:{" "}
            <span className="text-white">
              {fmtFriction(pad.dynamicFrictionX)} / {fmtFriction(pad.dynamicFrictionY)}
            </span>
          </span>
          <span>
            статика:{" "}
            <span className="text-white">
              {fmtFriction(pad.staticFrictionX)} / {fmtFriction(pad.staticFrictionY)}
            </span>
          </span>
          <span>
            Δ X/Y: <span className="text-white">{fmtFriction(anisotropy(pad))}</span>
          </span>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">Спецификации</h2>
          <dl className="card divide-y divide-line">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-3">
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
                  <p className="mt-2 text-sm leading-relaxed text-dim">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-6">
          <div>
            <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
              Поведение поверхности
            </h2>
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n} className="card p-4 text-sm leading-relaxed text-dim">
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
              Совместимые глайды
            </h2>
            <ul className="space-y-2">
              {recommendedGlides.map((g) => (
                <li key={g.slug} className="card flex items-center justify-between gap-2 p-4 text-sm">
                  <span>
                    {g.brand} {g.name}
                  </span>
                  <span className="chip">{materialLabel(g.material)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
              Похожие по трению
            </h2>
            <ul className="space-y-2">
              {similar.map((p) => (
                <li key={p.slug} className="card p-4 text-sm">
                  <Link href={`/database/pads/${p.slug}`} className="hover:text-neon">
                    {p.brand} {p.name}
                  </Link>
                  <span className="mono ml-2 text-xs text-dim">
                    {fmtFriction(avgDynamic(p))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <p className="mono mt-10 text-xs text-dim">
        Метрики трения приведены по методике таблицы cisA (CIS Aimers).{" "}
        <Link href="/reviews/methodology" className="text-neon hover:underline">
          Методология и ограничения данных
        </Link>
      </p>
    </div>
  );
}
