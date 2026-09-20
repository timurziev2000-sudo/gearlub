import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Как перевести сенсу из Warface в Valorant и CS2 | GearLab",
  description:
    "Пошаговый способ перевести чувствительность мыши из Warface в Valorant, CS2 и другие игры через одинаковый cm/360°.",
};

const faq = [
  {
    q: "Какая сенса Warface будет в Valorant?",
    a: "При одинаковом DPI умножьте сенсу Warface на 0.00333 и разделите на 0.07. Например, 7.33 в Warface превращается примерно в 0.348699 в Valorant.",
  },
  {
    q: "Нужно ли выставлять одинаковый DPI?",
    a: "Нет. Если DPI в целевой игре отличается, укажите его в поле «DPI целевой игры». Конвертер пересчитает значение так, чтобы физическое расстояние на полный оборот осталось одинаковым.",
  },
];

export default function WarfaceSensGuide() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Как перевести сенсу из Warface в Valorant и CS2",
    description: metadata.description,
    mainEntityOfPage: "https://gearlab.example/guides/warface-sens",
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/guides" className="hover:text-white">← Все гайды</Link>
      </nav>
      <p className="mono text-xs uppercase tracking-widest text-volt">Warface → другие игры</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Как перевести сенсу из Warface в Valorant и CS2</h1>
      <p className="mt-4 text-lg leading-relaxed text-dim">
        Переводите не цифру сенсы, а одинаковое физическое движение мыши. Для этого сохраняем показатель cm/360°.
      </p>

      <div className="card mt-8 p-6">
        <h2 className="font-semibold">Формула для одинакового DPI</h2>
        <p className="mt-3 font-mono text-lg text-volt">sens₂ = sens₁ × yaw₁ / yaw₂</p>
        <p className="mt-3 text-sm leading-relaxed text-dim">
          Для Warface → Valorant: <span className="text-white">sens₂ = sens₁ × 0.00333 / 0.07</span>.
          Поэтому Warface 7.33 даёт Valorant 0.348699.
        </p>
      </div>

      <h2 className="mt-10 text-2xl font-bold">Как сделать перевод</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-dim">
        <li>Запишите внутриигровую сенсу и DPI из Warface.</li>
        <li>Выберите Warface как исходную, а Valorant или CS2 как целевую игру.</li>
        <li>Введите сенсу и DPI. Если DPI меняется, заполните поле целевого DPI.</li>
        <li>Проверьте результат в тренировке и сделайте несколько минут разминки.</li>
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/tools/sens-calculator" className="chip chip-active">Открыть конвертер →</Link>
        <Link href="/database/mice" className="chip">Подобрать мышь →</Link>
      </div>

      <h2 className="mt-10 text-2xl font-bold">Частые вопросы</h2>
      <div className="mt-4 space-y-3">
        {faq.map(({ q, a }) => (
          <section key={q} className="card p-5">
            <h3 className="font-semibold">{q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-dim">{a}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
