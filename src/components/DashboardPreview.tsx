"use client";

import Link from "next/link";
import { Activity, ArrowRight, Cpu } from "lucide-react";

/**
 * Превью дашборда GearLab. Показывает реальные метрики из базы —
 * сюда передаются посчитанные значения, а не декоративные цифры.
 */

export interface DashboardRow {
  slot: string;
  label: string;
  meta: string;
  href: string;
  badge?: "new" | "updated";
}

export function DashboardPreview({
  rows,
  totalUsd,
  matchScore,
  matchVerdict,
  bars,
}: {
  rows: DashboardRow[];
  totalUsd: number;
  matchScore: number;
  matchVerdict: string;
  bars: { label: string; value: number; hint: string }[];
}) {
  return (
    <div className="group relative">
      {/* Основная панель */}
      <div className="panel relative z-10 overflow-hidden transition-transform duration-500 ease-out group-hover:-translate-y-1">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-volt anim-pulse-glow" />
            <span className="mono text-[11px] uppercase tracking-widest text-dim">
              Recommended setup
            </span>
          </div>
          <span className="mono text-[11px] text-faint">live from database</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4">
          <div>
            <p className="mono text-[10px] uppercase tracking-widest text-faint">
              Сумма конфигурации
            </p>
            <p className="mono mt-1 text-3xl font-bold tracking-tight">
              ${totalUsd.toLocaleString("ru-RU")}
            </p>
          </div>
          <div className="text-right">
            <p className="mono text-[10px] uppercase tracking-widest text-faint">
              Synergy score
            </p>
            <p className="mono mt-1 text-3xl font-bold tracking-tight text-volt">
              {matchScore}
              <span className="text-lg text-faint">/100</span>
            </p>
          </div>
        </div>

        <ul className="divide-hair border-t border-line">
          {rows.map((row) => (
            <li key={row.slot}>
              <Link
                href={row.href}
                className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-raised"
              >
                <span className="mono w-16 shrink-0 text-[10px] uppercase tracking-widest text-faint">
                  {row.slot}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm">{row.label}</span>
                    {row.badge === "new" && <span className="badge-new">new</span>}
                    {row.badge === "updated" && (
                      <span className="badge-updated">upd</span>
                    )}
                  </span>
                  <span className="mono block truncate text-[11px] text-faint">
                    {row.meta}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint transition-colors group-hover:text-dim" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-line px-5 py-4">
          <div className="space-y-3">
            {bars.map((bar) => (
              <div key={bar.label}>
                <div className="mono mb-1.5 flex items-baseline justify-between text-[11px]">
                  <span className="text-dim">{bar.label}</span>
                  <span className="text-faint">{bar.hint}</span>
                </div>
                <div className="meter">
                  <div
                    className="meter-fill anim-bar"
                    style={{ width: `${Math.min(100, Math.max(2, bar.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI-панель: выходит за границы основной панели */}
      <div className="panel-raised absolute -bottom-5 -left-4 z-20 w-52 p-4 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-out group-hover:-translate-y-2 sm:-left-8">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-volt" />
          <span className="mono text-[10px] uppercase tracking-widest text-dim">
            AI match
          </span>
        </div>
        <p className="mono mt-2 text-2xl font-bold text-volt">{matchScore}%</p>
        <p className="mt-1 text-[11px] leading-snug text-dim">{matchVerdict}</p>
      </div>

      {/* Индикатор свежести */}
      <div className="panel-raised absolute -right-3 -top-4 z-20 flex items-center gap-2 px-3 py-2 sm:-right-6">
        <Activity className="h-3.5 w-3.5 text-neon" />
        <span className="mono text-[10px] text-dim">данные проверены</span>
      </div>
    </div>
  );
}
