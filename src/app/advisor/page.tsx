import type { Metadata } from "next";
import Link from "next/link";
import { GearAdvisor } from "@/components/GearAdvisor";
import { faqJsonLd, jsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Подбор периферии по запросу — AI Gear Advisor | GearLab",
  description:
    "Опишите, что вам нужно: категория, бюджет, стиль игры, хват. Советник подберёт варианты строго из базы GearLab и объяснит выбор.",
};

const faqs = [
  {
    q: "Может ли советник предложить товар, которого нет в базе?",
    a: "Нет. Он выбирает только из существующих записей каталога. Если под условия ничего не подходит, советник сообщает об этом вместо того, чтобы придумать модель.",
  },
  {
    q: "Это языковая модель?",
    a: "Нет, это детерминированный разбор запроса по ключевым словам. Такой подход не может выдумать характеристику, но хуже понимает свободные формулировки, чем LLM.",
  },
  {
    q: "Почему у мышей статус данных «не установлен»?",
    a: "В базе у мышей пока нет полей происхождения характеристик, в отличие от клавиатур, ковриков и глайдов. Мы показываем это честно, а не выдаём оценки за подтверждённые данные.",
  },
];

export default function AdvisorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />

      <nav className="mono mb-6 flex flex-wrap gap-4 text-xs text-dim">
        <Link href="/tools/calculator" className="hover:text-white">
          Калькулятор сетапа →
        </Link>
        <Link href="/tools/synergy" className="hover:text-white">
          Калькулятор синергии →
        </Link>
      </nav>

      <p className="mono text-xs uppercase tracking-widest text-neon">gear advisor</p>
      <h1 className="anim-fade-up mt-2 text-3xl font-bold sm:text-4xl">Подбор по запросу</h1>
      <p className="anim-fade-up mt-4 max-w-2xl leading-relaxed text-dim">
        Опишите задачу словами: категория, бюджет, стиль игры, хват, предпочтение по
        скольжению. Советник разберёт запрос, подберёт варианты из базы GearLab и объяснит,
        почему выбрал именно их.
      </p>

      <div className="mt-10">
        <GearAdvisor />
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
