import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Keyboard as KeyboardIcon,
  Layers,
  Mouse as MouseIcon,
  Sparkles,
} from "lucide-react";
import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import { avgDynamic } from "@/lib/friction";

export const metadata: Metadata = {
  title: "База данных периферии — GearLab",
  description:
    "Нормализованные характеристики мышей, клавиатур, ковриков и глайдов. Каждое значение размечено по происхождению: измерение, данные производителя или оценка.",
};

const measuredPads = pads.filter((p) => p.frictionSource === "cisA").length;
const heKeyboards = keyboards.filter((k) => k.hallEffect).length;
const minWeight = Math.min(...mice.map((m) => m.weightG));
const dynRange = pads.map(avgDynamic);

const categories = [
  {
    href: "/database/mice",
    label: "Мыши",
    Icon: MouseIcon,
    count: mice.length,
    desc: "Сенсор, вес, polling rate, свичи, клик-латентность, габариты и аккумулятор.",
    facts: [
      `от ${minWeight} г`,
      `${mice.filter((m) => m.pollingHz >= 8000).length} моделей с 8K`,
      `${new Set(mice.map((m) => m.brand)).size} брендов`,
    ],
  },
  {
    href: "/database/keyboards",
    label: "Клавиатуры",
    Icon: KeyboardIcon,
    count: keyboards.length,
    desc: "Форм-фактор, тип свичей, Rapid Trigger, аналоговый ввод, крепление и корпус.",
    facts: [
      `${heKeyboards} Hall Effect`,
      `${keyboards.filter((k) => k.rapidTrigger).length} с Rapid Trigger`,
      `${keyboards.filter((k) => (k.releaseYear ?? 0) >= 2025).length} релизов 2025+`,
    ],
  },
  {
    href: "/database/pads",
    label: "Коврики",
    Icon: Layers,
    count: pads.length,
    desc: "Сила трения по осям X и Y, анизотропия, залипание, текстура и толщина.",
    facts: [
      `${measuredPads} с измерениями cisA`,
      `динамика ${Math.min(...dynRange).toFixed(1)}–${Math.max(...dynRange).toFixed(1)}`,
      "4 типа поверхности",
    ],
  },
  {
    href: "/database/glides",
    label: "Глайды",
    Icon: Sparkles,
    count: glides.length,
    desc: "Материал, формат, толщина, скорость скольжения и стойкость к истиранию.",
    facts: [
      "5 материалов",
      `${glides.filter((g) => g.tier === "budget").length} бюджетных`,
      `${glides.filter((g) => g.tier === "premium").length} премиальных`,
    ],
  },
];

const quickLinks = [
  { href: "/trending", label: "Тренды рынка", hint: "состав базы и динамика" },
  { href: "/new-releases", label: "Новинки", hint: "релизы с датами" },
  { href: "/segments/budget", label: "Ценовые сегменты", hint: "Budget → High-End" },
  { href: "/compare", label: "Сравнение", hint: "до 4 устройств рядом" },
];

export default function DatabasePage() {
  const total = mice.length + keyboards.length + pads.length + glides.length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
      <header className="anim-fade-up max-w-2xl">
        <p className="eyebrow">каталог</p>
        <h1 className="display mt-3 text-[2.25rem] sm:text-[2.75rem]">
          База данных периферии
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-dim">
          {total} устройств с единой схемой характеристик. Каждое значение размечено
          по происхождению: прямое измерение, данные производителя или оценка —
          и это видно в интерфейсе.
        </p>
      </header>

      <div className="stagger mt-12 grid gap-4 lg:grid-cols-2">
        {categories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="card card-hover anim-fade-up group flex flex-col p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raised text-volt">
                <c.Icon className="h-4 w-4" />
              </span>
              <span className="mono text-3xl font-bold tracking-tight">{c.count}</span>
            </div>

            <h2 className="mt-5 text-lg font-semibold">{c.label}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-dim">{c.desc}</p>

            <div className="mono mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-4 text-[11px] text-faint">
              {c.facts.map((f) => (
                <span key={f}>{f}</span>
              ))}
              <ArrowRight className="ml-auto h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:text-volt" />
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-16">
        <p className="eyebrow">быстрые переходы</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="card card-hover group flex items-center justify-between gap-3 p-4"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{l.label}</span>
                <span className="mono block truncate text-[11px] text-faint">
                  {l.hint}
                </span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-volt" />
            </Link>
          ))}
        </div>
      </section>

      <section className="panel mt-16 p-6">
        <p className="eyebrow">о данных</p>
        <div className="mt-4 grid gap-6 text-sm leading-relaxed text-dim md:grid-cols-3">
          <p>
            <span className="text-fg">Измерения трения</span> взяты из таблицы cisA
            (CIS Aimers), владелец 9Sanya, редакторы KitKatt и Bee. {measuredPads} из{" "}
            {pads.length} ковриков имеют прямые замеры.
          </p>
          <p>
            <span className="text-fg">Характеристики устройств</span> сверяются
            с описаниями производителей. Там, где подтверждения нет, запись помечена
            как требующая проверки.
          </p>
          <p>
            <span className="text-fg">Цены ориентировочные</span> и не являются
            live-данными. Ценовой сегмент определяется по позиционированию внутри
            категории, а не по одной цене одного магазина.
          </p>
        </div>
        <Link
          href="/reviews/methodology"
          className="mono mt-5 inline-flex items-center gap-1.5 text-xs text-dim transition-colors hover:text-volt"
        >
          методология и ограничения
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
