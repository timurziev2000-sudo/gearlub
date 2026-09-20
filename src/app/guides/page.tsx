import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Гайды по выбору периферии — GearLab",
  description:
    "Гайды по кластерам: выбор мыши для CS2 и Valorant, бюджетная периферия до $50, базовые понятия (DPI, debounce, motion sync).",
};

const clusters = [
  {
    title: "По играм",
    links: [
      { label: "Как перевести сенсу из Warface", href: "/guides/warface-sens" },
      { label: "Как выбрать мышь для CS2", href: "/guides" },
      { label: "Периферия для Valorant", href: "/guides" },
      { label: "Сетап для MOBA", href: "/guides" },
    ],
  },
  {
    title: "Бюджетные подборки",
    links: [
      { label: "Лучшее до $50", href: "/guides" },
      { label: "Клавиатуры до $70 с Hall Effect", href: "/guides" },
      { label: "Глайды до $10", href: "/guides" },
    ],
  },
  {
    title: "База",
    links: [
      { label: "Что такое motion sync", href: "/guides" },
      { label: "DPI vs eDPI", href: "/guides" },
      { label: "Типы покрытий ковриков", href: "/guides" },
    ],
  },
];

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Гайды</h1>
      <p className="mb-8 mt-2 text-dim">
        Pillar-cluster модель: экспертные хабы + узкие интент-статьи.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {clusters.map((c) => (
          <section key={c.title} className="card p-6">
            <h2 className="mb-3 font-semibold">{c.title}</h2>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-dim hover:text-volt">{l.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
