"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "dark" | "light" | "system";

const KEY = "gearlab:theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

const OPTIONS: { value: Theme; Icon: typeof Sun; label: string }[] = [
  { value: "dark", Icon: Moon, label: "Тёмная тема" },
  { value: "light", Icon: Sun, label: "Светлая тема" },
  { value: "system", Icon: Monitor, label: "Как в системе" },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null) ?? "dark";
    queueMicrotask(() => {
      setTheme(stored);
      setMounted(true);
    });
    apply(stored);
  }, []);

  const change = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(KEY, next);
    apply(next);
  };

  // До монтирования показываем нейтральную заглушку, чтобы не мигало.
  const current = mounted ? theme : "dark";
  const index = OPTIONS.findIndex((o) => o.value === current);
  const next = OPTIONS[(index + 1) % OPTIONS.length];
  const Icon = OPTIONS[index === -1 ? 0 : index].Icon;

  return (
    <button
      type="button"
      onClick={() => change(next.value)}
      aria-label={`${OPTIONS[index === -1 ? 0 : index].label}. Переключить на: ${next.label}`}
      title={OPTIONS[index === -1 ? 0 : index].label}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line text-dim transition-colors hover:border-line-strong hover:text-fg"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
