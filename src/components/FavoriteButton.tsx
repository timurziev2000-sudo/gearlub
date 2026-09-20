"use client";

import { useFavorites, type FavoriteKind } from "@/lib/storage";

/**
 * Кнопка избранного. Работает без регистрации: список хранится
 * в localStorage браузера.
 */
export function FavoriteButton({
  kind,
  slug,
  className = "",
}: {
  kind: FavoriteKind;
  slug: string;
  className?: string;
}) {
  const { has, toggle } = useFavorites();
  const active = has(kind, slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        // Карточки часто обёрнуты в ссылку — не уводим со страницы.
        e.preventDefault();
        e.stopPropagation();
        toggle(kind, slug);
      }}
      aria-pressed={active}
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      title={active ? "Убрать из избранного" : "Добавить в избранное"}
      className={`mono cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors ${
        active
          ? "border-volt/60 text-volt"
          : "border-line text-dim hover:border-volt/40 hover:text-white"
      } ${className}`}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
