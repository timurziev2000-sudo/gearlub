import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Методология тестирования GearLab",
  description:
    "Как GearLab будет проверять мыши, клавиатуры, коврики и глайды: условия, измерения, источники и ограничения.",
};

export default function MethodologyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/reviews" className="mono text-xs text-dim hover:text-white">← К обзорам</Link>
      <p className="mono mt-8 text-xs uppercase tracking-widest text-neon">GearLab standard</p>
      <h1 className="mt-2 text-3xl font-bold">Методология тестирования</h1>
      <p className="mt-4 text-dim">
        Эта страница отделяет подтверждённые измерения GearLab от характеристик производителя и
        пользовательских впечатлений из интернета.
      </p>
      <div className="mt-8 space-y-4">
        {[
          ["Мыши", "Вес проверяется с комплектным аккумулятором и без кабеля. Polling и latency фиксируются вместе с DPI, прошивкой и режимом подключения."],
          ["Коврики", "Для friction X/Y записываются направление, состояние поверхности, тип глайдов, нагрузка и дата теста. Изношенные экземпляры маркируются отдельно."],
          ["Клавиатуры", "Rapid Trigger и actuation сравниваются на одной прошивке с фиксацией polling rate, точки срабатывания и режима подключения."],
          ["Внешние источники", "Reddit, YouTube и сайты производителей являются ссылками для исследования. Их выводы не считаются собственным тестом GearLab."],
        ].map(([title, text]) => (
          <section key={title} className="card p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-dim">{text}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
