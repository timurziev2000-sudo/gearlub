"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Счётчик с анимацией. Запускается при появлении в зоне видимости
 * и уважает prefers-reduced-motion: при отключённой анимации
 * сразу показывает конечное значение.
 */
export function StatCounter({
  value,
  suffix = "",
  duration = 1100,
  className = "",
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Вынос из синхронной фазы эффекта: иначе линтер справедливо
      // предупреждает о каскадных ререндерах.
      queueMicrotask(() => setDisplay(value));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          // easeOutCubic: быстрый старт, мягкое завершение.
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(value * eased);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration]);

  const formatted =
    value >= 1000
      ? `${(display / 1000).toFixed(display >= 999 ? 0 : 1)}K`
      : Math.round(display).toString();

  return (
    <span ref={ref} className={className}>
      {formatted}
      {suffix}
    </span>
  );
}
