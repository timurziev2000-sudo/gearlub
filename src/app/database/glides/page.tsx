import type { Metadata } from "next";
import Link from "next/link";
import { glides } from "@/data/gear";
import { GlidesCatalog } from "@/components/GlidesCatalog";

export const metadata: Metadata = {
  title: "Глайды для мыши: PTFE, UHMW-PE, стекло и керамика | GearLab",
  description:
    "Каталог глайдов по сегментам: бюджетные ProAim и OEM, средние Nova Union, X-raypad, Corepad, премиальные ESPTIGER и стеклянные Nova Union и Pulsar. Материал, толщина, скорость, стойкость.",
};

export default function GlidesPage() {
  const budget = glides.filter((g) => g.tier === "budget").length;
  const mid = glides.filter((g) => (g.tier ?? "mid") === "mid").length;
  const premium = glides.filter((g) => g.tier === "premium").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/database" className="hover:text-white">
          База данных
        </Link>
        {" / Глайды"}
      </nav>

      <h1 className="anim-fade-up text-3xl font-bold">Глайды</h1>
      <p className="anim-fade-up mt-2 max-w-3xl leading-relaxed text-dim">
        Глайды меняют характер связки сильнее, чем кажется: тот же коврик со стеклянными ножками
        ощущается совершенно иначе, чем с чистым PTFE.{" "}
        <Link href="/tools/synergy" className="text-neon hover:underline">
          → проверить связку в калькуляторе синергии
        </Link>
      </p>

      <div className="anim-fade-up mono mt-4 flex flex-wrap gap-2 text-xs">
        <span className="chip">{glides.length} моделей</span>
        <span className="chip">{budget} бюджетных</span>
        <span className="chip chip-active">{mid} средних</span>
        <span className="chip">{premium} премиальных</span>
      </div>

      <div className="card mt-6 p-5 text-sm leading-relaxed text-dim">
        <p>
          <span className="text-white">Скорость</span> и{" "}
          <span className="text-white">стойкость</span> — сравнительные оценки на основе материала,
          толщины и позиционирования бренда, а не лабораторные измерения. Они помогают выбрать
          между вариантами, но не дают абсолютных значений.
        </p>
        <p className="mt-3">
          Ключевое правило совместимости: чистый PTFE на стеклянном или абразивном коврике
          стачивается за считаные недели. Для таких поверхностей нужны стекло, керамика или
          UHMW-PE.{" "}
          <Link href="/reviews/methodology" className="text-neon hover:underline">
            Методология и ограничения данных
          </Link>
        </p>
      </div>

      <div className="mt-8">
        <GlidesCatalog glides={glides} />
      </div>
    </div>
  );
}
