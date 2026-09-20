"use client";

import { daysSinceDiscovery, isStillNew } from "@/lib/discovery/types";

/**
 * Метка новизны. Показывается только пока товар действительно новый:
 * бессрочный бейдж NEW обесценивает сам себя.
 */
export function NewBadge({
  newSince,
  today,
  variant = "default",
}: {
  newSince: string;
  /** Дата для сравнения. По умолчанию — текущая на клиенте. */
  today?: string;
  variant?: "default" | "compact";
}) {
  const reference = today ?? new Date().toISOString().slice(0, 10);
  if (!isStillNew(newSince, reference)) return null;

  const days = daysSinceDiscovery(newSince, reference);
  const title =
    days === null
      ? "Недавно обнаружено"
      : days === 0
        ? "Обнаружено сегодня"
        : `Обнаружено ${days} дн. назад`;

  if (variant === "compact") {
    return (
      <span
        title={title}
        className="mono inline-flex shrink-0 items-center rounded-sm bg-volt px-1.5 py-0.5 text-[10px] font-bold leading-none text-bg"
      >
        NEW
      </span>
    );
  }

  return (
    <span
      title={title}
      className="mono inline-flex shrink-0 items-center gap-1 rounded-md border border-volt/50 bg-volt/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-volt"
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-volt shadow-[0_0_6px_rgba(198,255,0,0.8)]"
      />
      новинка
    </span>
  );
}
