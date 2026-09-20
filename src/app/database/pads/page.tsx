import type { Metadata } from "next";
import Link from "next/link";
import { pads } from "@/data/gear";
import { PadsCatalog } from "@/components/PadsCatalog";
import { jsonLd, padItemListJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Коврики для мыши: сила трения X/Y, поверхность, толщина | GearLab",
  description:
    "Каталог игровых ковриков с физическими метриками: динамическая и статическая сила трения по осям X и Y, тип поверхности, толщина, анизотропия скольжения.",
};

export default function PadsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(padItemListJsonLd(pads, "/database/pads"))}
      />

      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/database" className="hover:text-white">
          База данных
        </Link>
        {" / Коврики"}
      </nav>

      <h1 className="text-3xl font-bold">Коврики</h1>
      <p className="mt-2 max-w-3xl leading-relaxed text-dim">
        Сила трения указана в ньютонах × 100 по методике таблицы cisA: отдельно по горизонтальной
        оси X и вертикальной оси Y. Меньшее значение — быстрее скольжение, большее — сильнее
        контроль.{" "}
        <Link
          href={{ pathname: "/compare", query: { type: "pads" } }}
          className="text-neon hover:underline"
        >
          → сравнить коврики
        </Link>
      </p>

      <div className="card mt-6 p-5 text-sm leading-relaxed text-dim">
        <p>
          <span className="text-white">Динамическая</span> сила трения — сопротивление при уже
          начавшемся движении.{" "}
          <span className="text-white">Статическая</span> — усилие, необходимое для срыва мыши с
          места. Разница между осями X и Y (анизотропия) показывает, одинаково ли ощущаются
          горизонтальные флики и вертикальный трекинг.
        </p>
        <p className="mt-3">
          Источник измерений: таблица cisA (CIS Aimers), владелец 9Sanya, редакторы KitKatt и Bee.
          Значения для части позиций требуют дополнительной проверки —{" "}
          <Link href="/reviews/methodology" className="text-neon hover:underline">
            методология GearLab
          </Link>
          .
        </p>
      </div>

      <div className="mt-8">
        <PadsCatalog pads={pads} />
      </div>
    </div>
  );
}
