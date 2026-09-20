import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SetupBuilder } from "@/components/SetupBuilder";
import { faqJsonLd, jsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Мой сетап: мышь, клавиатура, коврик, глайды и настройки | GearLab",
  description:
    "Соберите свой игровой сетап целиком: устройства, DPI, чувствительность, хват и игра. Расчёт eDPI, cm/360 и синергии связки. Ссылкой можно поделиться.",
};

const faqs = [
  {
    q: "Нужна ли регистрация, чтобы сохранить сетап?",
    a: "Нет. Сетап сохраняется в локальном хранилище браузера, а полный выбор кодируется в адресе страницы. Ссылку можно отправить другому человеку или открыть на другом устройстве — данные никуда не передаются.",
  },
  {
    q: "Что показывает оценка синергии?",
    a: "Она учитывает трение коврика по данным cisA, материал глайдов и вес мыши. Движок считает эффективное сопротивление связки, ожидаемый ресурс глайдов и находит конфликты — например, чистый PTFE на стеклянном коврике.",
  },
  {
    q: "Зачем указывать хват и игру?",
    a: "Хват сверяется с формой мыши по данным производителя. Игра нужна для расчёта cm/360: одна и та же чувствительность в разных играх даёт разное физическое расстояние на полный оборот.",
  },
];

export default function MySetupPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />

      <nav className="mono mb-6 flex flex-wrap gap-4 text-xs text-dim">
        <Link href="/tools/synergy" className="hover:text-white">
          Калькулятор синергии →
        </Link>
        <Link href="/tools/sens-calculator" className="hover:text-white">
          Sens-конвертер →
        </Link>
      </nav>

      <p className="mono text-xs uppercase tracking-widest text-neon">personal loadout</p>
      <h1 className="anim-fade-up mt-2 text-3xl font-bold sm:text-4xl">Мой сетап</h1>
      <p className="anim-fade-up mt-4 max-w-2xl leading-relaxed text-dim">
        Соберите конфигурацию целиком: устройства, DPI, чувствительность, хват и игру. GearLab
        посчитает eDPI, расстояние на полный оборот и оценит связку мыши, коврика и глайдов.
        Регистрация не нужна — всё хранится в браузере, а ссылкой можно поделиться.
      </p>

      <div className="mt-10">
        <Suspense
          fallback={
            <div className="card p-10 text-center text-dim">Загрузка конструктора сетапа…</div>
          }
        >
          <SetupBuilder />
        </Suspense>
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
