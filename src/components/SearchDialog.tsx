"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";

interface Entry {
  label: string;
  href: string;
  kind: string;
  meta: string;
}

/** Индекс собирается один раз: данные статические. */
function buildIndex(): Entry[] {
  return [
    ...mice.map((m) => ({
      label: `${m.brand} ${m.name}`,
      href: `/database/mice/${m.slug}`,
      kind: "Мышь",
      meta: `${m.weightG} г · ${m.sensor}`,
    })),
    ...keyboards.map((k) => ({
      label: `${k.brand} ${k.name}`,
      href: `/database/keyboards/${k.slug}`,
      kind: "Клавиатура",
      meta: `${k.layout} · ${k.switches}`,
    })),
    ...pads.map((p) => ({
      label: `${p.brand} ${p.name}`,
      href: `/database/pads/${p.slug}`,
      kind: "Коврик",
      meta: `${p.thickness} мм`,
    })),
    ...glides.map((g) => ({
      label: `${g.brand} ${g.name}`,
      href: "/database/glides",
      kind: "Глайды",
      meta: g.material,
    })),
    { label: "Мой сетап", href: "/my-setup", kind: "Инструмент", meta: "конструктор" },
    { label: "Калькулятор синергии", href: "/tools/synergy", kind: "Инструмент", meta: "трение" },
    { label: "Sens-конвертер", href: "/tools/sens-calculator", kind: "Инструмент", meta: "cm/360" },
    { label: "Подбор по запросу", href: "/advisor", kind: "Инструмент", meta: "advisor" },
    { label: "Тренды рынка", href: "/trending", kind: "Раздел", meta: "аналитика" },
    { label: "Новинки", href: "/new-releases", kind: "Раздел", meta: "релизы" },
  ];
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildIndex(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter((e) => `${e.label} ${e.kind} ${e.meta}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [index, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Поиск по базе"
        className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-line px-2.5 text-dim transition-colors hover:border-line-strong hover:text-fg"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="mono hidden text-[11px] xl:inline">Ctrl K</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="panel w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Поиск по базе GearLab"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Устройство, инструмент, раздел…"
                className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть поиск"
                className="cursor-pointer text-faint transition-colors hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto">
              {query.trim() === "" ? (
                <p className="px-4 py-6 text-sm text-faint">
                  Введите запрос: {index.length} записей в индексе.
                </p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 text-sm text-faint">Ничего не найдено.</p>
              ) : (
                <ul className="divide-hair">
                  {results.map((r) => (
                    <li key={`${r.kind}-${r.href}-${r.label}`}>
                      <Link
                        href={r.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-raised"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{r.label}</span>
                          <span className="mono block truncate text-[11px] text-faint">
                            {r.meta}
                          </span>
                        </span>
                        <span className="badge-muted shrink-0">{r.kind}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
