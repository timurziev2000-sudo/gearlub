"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Локальное хранилище без бэкенда. Все данные остаются в браузере
 * пользователя: ничего не отправляется на сервер.
 *
 * Чтение построено на useSyncExternalStore, поэтому значение доступно
 * сразу при рендере и не требует setState внутри эффекта.
 */

const KEY_FAVORITES = "gearlab:favorites:v1";
const KEY_SETUP = "gearlab:setup:v1";
const KEY_COMPARE_HISTORY = "gearlab:compare-history:v1";

const EVENT = "gearlab:storage";

export type FavoriteKind = "mouse" | "keyboard" | "pad" | "glide";

export interface FavoriteItem {
  kind: FavoriteKind;
  slug: string;
  addedAt: number;
}

/** Кэш распарсенных значений: useSyncExternalStore требует стабильных ссылок. */
const cache = new Map<string, { raw: string | null; parsed: unknown }>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getSnapshot<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.parsed as T;

  let parsed: unknown = fallback;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = fallback;
    }
  }
  cache.set(key, { raw, parsed });
  return parsed as T;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* переполнение или приватный режим */
  }
  // Событие storage срабатывает только в других вкладках,
  // поэтому текущую оповещаем вручную.
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function useStored<T>(key: string, fallback: T): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => getSnapshot<T>(key, fallback),
    () => fallback,
  );

  const update = useCallback((next: T) => write(key, next), [key]);

  return [value, update];
}

const EMPTY_FAVORITES: FavoriteItem[] = [];

export function useFavorites() {
  const [items, setItems] = useStored<FavoriteItem[]>(KEY_FAVORITES, EMPTY_FAVORITES);

  const has = useCallback(
    (kind: FavoriteKind, slug: string) =>
      items.some((i) => i.kind === kind && i.slug === slug),
    [items],
  );

  const toggle = useCallback(
    (kind: FavoriteKind, slug: string) => {
      const exists = items.some((i) => i.kind === kind && i.slug === slug);
      setItems(
        exists
          ? items.filter((i) => !(i.kind === kind && i.slug === slug))
          : [...items, { kind, slug, addedAt: Date.now() }],
      );
    },
    [items, setItems],
  );

  const remove = useCallback(
    (kind: FavoriteKind, slug: string) =>
      setItems(items.filter((i) => !(i.kind === kind && i.slug === slug))),
    [items, setItems],
  );

  const clear = useCallback(() => setItems(EMPTY_FAVORITES), [setItems]);

  const ofKind = useCallback(
    (kind: FavoriteKind) => items.filter((i) => i.kind === kind),
    [items],
  );

  return { items, has, toggle, remove, clear, ofKind };
}

export function useSavedSetup<T>(): [T | null, (v: T | null) => void] {
  return useStored<T | null>(KEY_SETUP, null);
}

export interface CompareHistoryEntry {
  type: string;
  slugs: string[];
  at: number;
}

const EMPTY_HISTORY: CompareHistoryEntry[] = [];
const HISTORY_LIMIT = 10;

export function useCompareHistory() {
  const [entries, setEntries] = useStored<CompareHistoryEntry[]>(
    KEY_COMPARE_HISTORY,
    EMPTY_HISTORY,
  );

  const push = useCallback(
    (type: string, slugs: string[]) => {
      if (slugs.length < 2) return;
      const key = `${type}:${[...slugs].sort().join(",")}`;
      const rest = entries.filter(
        (e) => `${e.type}:${[...e.slugs].sort().join(",")}` !== key,
      );
      setEntries([{ type, slugs, at: Date.now() }, ...rest].slice(0, HISTORY_LIMIT));
    },
    [entries, setEntries],
  );

  const clear = useCallback(() => setEntries(EMPTY_HISTORY), [setEntries]);

  const recent = useMemo(() => entries.slice(0, HISTORY_LIMIT), [entries]);

  return { entries: recent, push, clear };
}
