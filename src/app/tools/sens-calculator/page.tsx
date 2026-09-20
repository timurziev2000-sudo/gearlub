import type { Metadata } from "next";
import Link from "next/link";
import { SensConverter } from "@/components/SensConverter";

export const metadata: Metadata = {
  title: "Конвертер чувствительности и eDPI калькулятор — CS2, Valorant, Warface, OW2 | GearLab",
  description:
    "Перевод сенсы между CS2/Apex, Valorant, Overwatch 2 и Warface с сохранением cm/360°. Расчёт eDPI и умный вердикт по подбору коврика и глайдов.",
};

export default function SensCalculatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdFaq()}
      />
      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/tools/calculator" className="hover:text-white">
          ← Калькулятор совместимости
        </Link>
      </nav>
      <h1 className="text-3xl font-bold">Конвертер чувствительности</h1>
      <p className="mb-8 mt-2 max-w-2xl text-dim">
        Переносите sens между играми без потери мышечной памяти: конвертация держит
        одинаковое расстояние на оборот (cm/360°) и считает eDPI.
      </p>
      <SensConverter />
    </div>
  );
}

function jsonLdFaq() {
  return {
    __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Что такое eDPI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "eDPI (effective DPI) — произведение аппаратного DPI мыши на внутриигровую чувствительность. Позволяет сравнивать сенсу игроков между собой.",
        },
      },
      {
        "@type": "Question",
        name: "Почему важен показатель cm/360°?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "cm/360° показывает, сколько сантиметров нужно провести мышью для полного разворота на 360 градусов. Одинаковый cm/360° в разных играх означает одинаковое физическое движение руки.",
        },
      },
    ],
    }),
  };
}
