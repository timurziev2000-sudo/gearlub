import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "GearLab — интеллектуальная база игровой периферии",
  description:
    "Проверенные характеристики устройств, реальная совместимость и умный анализ конфигураций. Мыши, клавиатуры, коврики и глайды с измеренными метриками.",
};

const footerGroups = [
  {
    title: "База знаний",
    links: [
      { href: "/database", label: "Обзор базы" },
      { href: "/database/mice", label: "Мыши" },
      { href: "/database/keyboards", label: "Клавиатуры" },
      { href: "/database/pads", label: "Коврики" },
      { href: "/database/glides", label: "Глайды" },
    ],
  },
  {
    title: "Инструменты",
    links: [
      { href: "/advisor", label: "Подбор по запросу" },
      { href: "/my-setup", label: "Мой сетап" },
      { href: "/tools/synergy", label: "Калькулятор синергии" },
      { href: "/tools/calculator", label: "Подбор сетапа" },
      { href: "/tools/sens-calculator", label: "Sens-конвертер" },
    ],
  },
  {
    title: "Аналитика",
    links: [
      { href: "/trending", label: "Тренды рынка" },
      { href: "/new-releases", label: "Новинки" },
      { href: "/segments/budget", label: "Ценовые сегменты" },
      { href: "/compare", label: "Сравнение" },
    ],
  },
  {
    title: "Материалы",
    links: [
      { href: "/reviews", label: "Обзоры" },
      { href: "/reviews/methodology", label: "Методология" },
      { href: "/guides", label: "Гайды" },
      { href: "/guides/warface-sens", label: "Сенса в Warface" },
    ],
  },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-volt focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
        >
          К основному содержанию
        </a>

        <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
          <div className="relative mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
            <Link
              href="/"
              className="mono shrink-0 text-[15px] font-bold tracking-tight text-fg"
            >
              GEAR<span className="text-volt">LAB</span>
            </Link>
            <HeaderNav />
          </div>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="mt-24 border-t border-line">
          <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
              <div>
                <Link href="/" className="mono text-[15px] font-bold tracking-tight">
                  GEAR<span className="text-volt">LAB</span>
                </Link>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-dim">
                  Интеллектуальная база игровой периферии: измеренные метрики,
                  проверка совместимости и анализ конфигураций.
                </p>
                <p className="mono mt-4 text-[11px] text-faint">
                  Данные помечены по происхождению. Цены ориентировочные.
                </p>
              </div>

              <nav
                className="grid grid-cols-2 gap-8 sm:grid-cols-4"
                aria-label="Карта сайта"
              >
                {footerGroups.map((group) => (
                  <div key={group.title}>
                    <p className="eyebrow mb-3">{group.title}</p>
                    <ul className="space-y-2">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="text-sm text-dim transition-colors hover:text-fg"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            <div className="mono mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[11px] text-faint">
              <span>GearLab · база знаний о геймерской периферии</span>
              <span>Метрики трения — по методике cisA (CIS Aimers)</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}