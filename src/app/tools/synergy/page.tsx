import type { Metadata } from "next";
import Link from "next/link";
import { SynergyCalculator } from "@/components/SynergyCalculator";
import { faqJsonLd, jsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Калькулятор синергии: мышь + глайды + коврик | GearLab",
  description:
    "Проверьте связку мыши, глайдов и коврика по измеренному трению cisA. Расчёт эффективного сопротивления, ресурса глайдов и предупреждения о конфликтах — например, чистый PTFE на стекле.",
};

const faqs = [
  {
    q: "Почему чистый PTFE нельзя ставить на стеклянный коврик?",
    a: "Стекло абразивнее ткани примерно в 2,6 раза. Чистый PTFE стачивается за несколько недель активной игры, появляется провал по высоте, и мышь начинает цеплять корпусом. Для стекла нужны керамические или стеклянные глайды.",
  },
  {
    q: "Как вес мыши влияет на скольжение?",
    a: "Сила трения растёт с нормальной силой прижима, а она зависит от массы. Одна и та же связка глайдов и коврика с мышью 75 г ощущается заметно медленнее, чем с мышью 40 г.",
  },
  {
    q: "Какое сопротивление подходит для low sens?",
    a: "При низкой чувствительности разворот выполняется длинным движением, поэтому комфортнее держать эффективное сопротивление ниже 22 и брать коврик размера XL или XXL.",
  },
  {
    q: "Откуда взяты числа трения?",
    a: "Динамическая и статическая сила трения по осям X и Y взяты из таблицы cisA (CIS Aimers). Коэффициенты материалов глайдов и формула ресурса — эвристики на основе физики скольжения, а не лабораторные измерения связок.",
  },
];

export default function SynergyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />

      <nav className="mono mb-6 flex flex-wrap gap-4 text-xs text-dim">
        <Link href="/tools/calculator" className="hover:text-white">
          ← Калькулятор сетапа
        </Link>
        <Link href="/tools/sens-calculator" className="hover:text-white">
          Sens-конвертер →
        </Link>
      </nav>

      <p className="mono text-xs uppercase tracking-widest text-neon">friction engine</p>
      <h1 className="anim-fade-up mt-2 text-3xl font-bold sm:text-4xl">
        Калькулятор синергии
      </h1>
      <p className="anim-fade-up mt-4 max-w-2xl leading-relaxed text-dim">
        Коврик, глайды и мышь работают как одна система. Выберите то, что у вас есть или что
        собираетесь купить — движок посчитает эффективное сопротивление связки, ожидаемый ресурс
        глайдов и покажет конфликты до покупки, а не после.
      </p>

      <div className="mt-10">
        <SynergyCalculator />
      </div>

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
