"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Keyboard, Layers, Menu, Mouse, Sparkles, X } from "lucide-react";
import { SearchDialog } from "@/components/SearchDialog";
import { ThemeToggle } from "@/components/ThemeToggle";

const deviceLinks = [
  { href: "/database/mice", label: "Мыши", Icon: Mouse, color: "text-volt" },
  { href: "/database/pads", label: "Коврики", Icon: Layers, color: "text-neon" },
  { href: "/database/keyboards", label: "Клавиатуры", Icon: Keyboard, color: "text-dim" },
  { href: "/database/glides", label: "Глайды", Icon: Sparkles, color: "text-volt" },
] as const;

const knowledgeLinks = [
  { href: "/database", label: "Обзор базы", hint: "все категории" },
  { href: "/trending", label: "Тренды рынка", hint: "аналитика" },
  { href: "/new-releases", label: "Новинки", hint: "свежие релизы" },
  { href: "/players", label: "Sens про-игроков", hint: "eDPI, см/360" },
  { href: "/segments/budget", label: "Ценовые сегменты", hint: "от Budget до High-End" },
] as const;

const toolLinks = [
  { href: "/advisor", label: "Подбор по запросу" },
  { href: "/my-setup", label: "Мой сетап" },
  { href: "/tools/synergy", label: "Калькулятор синергии" },
  { href: "/tools/calculator", label: "Подбор сетапа" },
] as const;

const plainLinks = [
  { href: "/compare", label: "Сравнение" },
  { href: "/reviews", label: "Обзоры" },
  { href: "/guides", label: "Гайды" },
  { href: "/tools/sens-calculator", label: "Sens-конвертер" },
] as const;

export function HeaderNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Закрываем мобильное меню при переходе. queueMicrotask выносит
  // обновление состояния из синхронной фазы эффекта.
  useEffect(() => {
    queueMicrotask(() => setOpen(false));
  }, [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav
        className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
        aria-label="Основная навигация"
      >
        <Dropdown label="База знаний" isActive={knowledgeLinks.some((l) => active(l.href))}>
          {knowledgeLinks.map(({ href, label, hint }) => (
            <Link
              key={href}
              href={href}
              className="flex items-baseline justify-between gap-3 px-3.5 py-2.5 text-sm text-dim transition-colors hover:bg-raised hover:text-fg"
            >
              {label}
              <span className="mono text-[10px] text-faint">{hint}</span>
            </Link>
          ))}
        </Dropdown>

        <Dropdown label="Устройства" isActive={active("/database")}>
          {deviceLinks.map(({ href, label, Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-dim transition-colors hover:bg-raised hover:text-fg"
            >
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              {label}
            </Link>
          ))}
        </Dropdown>

        <Dropdown label="Калькулятор" isActive={toolLinks.some((l) => active(l.href))}>
          {toolLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3.5 py-2.5 text-sm transition-colors hover:bg-raised hover:text-fg ${
                active(href) ? "text-volt" : "text-dim"
              }`}
            >
              {label}
            </Link>
          ))}
        </Dropdown>

        {plainLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-raised ${
              active(href) ? "text-volt" : "text-dim hover:text-fg"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
        <div className="hidden sm:block">
          <SearchDialog />
        </div>
        <ThemeToggle />
        <Link
          href="/my-setup"
          className="mono hidden h-8 items-center rounded-lg border border-line px-3 text-[11px] text-dim transition-colors hover:border-line-strong hover:text-fg sm:flex"
        >
          Профиль
        </Link>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line text-dim transition-colors hover:text-fg lg:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[80vh] overflow-y-auto border-b border-line bg-bg px-4 pb-6 pt-3 lg:hidden">
          <div className="mb-4 sm:hidden">
            <SearchDialog />
          </div>
          <MobileGroup title="База знаний" links={knowledgeLinks} activeFn={active} />
          <MobileGroup title="Устройства" links={deviceLinks} activeFn={active} />
          <MobileGroup title="Инструменты" links={toolLinks} activeFn={active} />
          <MobileGroup title="Материалы" links={plainLinks} activeFn={active} />
        </div>
      )}
    </>
  );
}

function Dropdown({
  label,
  isActive,
  children,
}: {
  label: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className={`flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors group-hover:bg-raised ${
          isActive ? "text-volt" : "text-dim group-hover:text-fg"
        }`}
      >
        {label}
        <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 w-56 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="panel overflow-hidden shadow-[0_24px_48px_-16px_rgba(0,0,0,0.9)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function MobileGroup({
  title,
  links,
  activeFn,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  activeFn: (href: string) => boolean;
}) {
  return (
    <div className="mb-5">
      <p className="eyebrow mb-1.5 px-2">{title}</p>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`block rounded-lg px-2 py-2.5 text-[15px] transition-colors ${
            activeFn(href) ? "bg-raised text-volt" : "text-dim"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
