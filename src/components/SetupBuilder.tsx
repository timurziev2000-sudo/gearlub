"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import { KeyboardVisual, MouseVisual, PadVisual } from "@/components/DeviceVisual";
import { GAMES } from "@/lib/games";
import { sensBandLabel } from "@/lib/games";
import { fmtFriction, textureLabel } from "@/lib/friction";
import { gripLabel, kbLayoutLabel, materialLabel, surfaceLabel } from "@/lib/labels";
import {
  defaultSetup,
  readSavedSetup,
  resolveSetup,
  setupFromParams,
  setupToQuery,
  setupToText,
  type SetupSelection,
} from "@/lib/setup";
import { effortClassLabel, severityLabel, type Severity } from "@/lib/synergy";
import { useFavorites, useSavedSetup } from "@/lib/storage";
import type { GripStyle } from "@/lib/types";

const selectCls =
  "w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-white outline-none transition-shadow focus:border-volt focus:shadow-[0_0_16px_rgba(198,255,0,0.25)]";
const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm text-white outline-none transition-shadow focus:border-volt focus:shadow-[0_0_16px_rgba(198,255,0,0.25)]";

const severityStyle: Record<Severity, string> = {
  critical: "text-red-400",
  warning: "text-volt",
  info: "text-dim",
  good: "text-neon",
};

const byName = <T extends { brand: string; name: string }>(a: T, b: T) =>
  `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, "ru");

const sortedMice = [...mice].sort(byName);
const sortedKeyboards = [...keyboards].sort(byName);
const sortedPads = [...pads].sort(byName);
const sortedGlides = [...glides].sort(byName);

const gripOptions: GripStyle[] = ["palm", "claw", "fingertip"];

export function SetupBuilder() {
  const router = useRouter();

  const [setup, setSetup] = useState<SetupSelection>(defaultSetup);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<"link" | "text" | null>(null);

  const [savedSetup, setSavedSetup] = useSavedSetup<SetupSelection>();
  const favorites = useFavorites();

  // Приоритет: URL → сохранённый сетап → значения по умолчанию.
  // Читаем один раз при монтировании, чтобы дальше не перетирать выбор.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlHasData = ["m", "k", "p", "g"].some((key) => urlParams.get(key));
    const initial = urlHasData
      ? setupFromParams(urlParams)
      : readSavedSetup() ?? defaultSetup;

    if (initial !== defaultSetup) {
      queueMicrotask(() => {
        setSetup(initial);
        setHydrated(true);
      });
    } else {
      queueMicrotask(() => setHydrated(true));
    }
  }, []);

  const resolved = useMemo(() => resolveSetup(setup), [setup]);

  const patch = (next: Partial<SetupSelection>) => setSetup({ ...setup, ...next });

  const shareUrl = useMemo(() => {
    const q = new URLSearchParams(setupToQuery(setup)).toString();
    if (typeof window === "undefined") return `/my-setup?${q}`;
    return `${window.location.origin}/my-setup?${q}`;
  }, [setup]);

  const copy = async (kind: "link" | "text") => {
    const payload = kind === "link" ? shareUrl : setupToText(resolved, shareUrl);
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard недоступен */
    }
  };

  const applyToUrl = () => {
    const q = new URLSearchParams(setupToQuery(setup)).toString();
    router.replace(`/my-setup?${q}`, { scroll: false });
  };

  const favoriteMice = favorites.ofKind("mouse");

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="mono text-xs uppercase tracking-widest text-dim">Мышь</label>
            {resolved.mouse && (
              <button
                onClick={() => favorites.toggle("mouse", resolved.mouse!.slug)}
                className={`mono cursor-pointer text-xs transition-colors ${
                  favorites.has("mouse", resolved.mouse.slug)
                    ? "text-volt"
                    : "text-dim hover:text-white"
                }`}
              >
                {favorites.has("mouse", resolved.mouse.slug) ? "★ в избранном" : "☆ в избранное"}
              </button>
            )}
          </div>
          <select
            value={setup.mouseSlug ?? ""}
            onChange={(e) => patch({ mouseSlug: e.target.value || null })}
            className={selectCls}
          >
            <option value="">— не выбрано —</option>
            {sortedMice.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.brand} {m.name} — {m.weightG} г
              </option>
            ))}
          </select>
          {resolved.mouse && (
            <div className="mt-4">
              <MouseVisual mouse={resolved.mouse} />
              <p className="mono mt-3 text-xs text-dim">
                {resolved.mouse.sensor} · {resolved.mouse.pollingHz} Hz ·{" "}
                <Link
                  href={`/database/mice/${resolved.mouse.slug}`}
                  className="text-neon hover:underline"
                >
                  подробнее
                </Link>
              </p>
              {favoriteMice.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {favoriteMice.slice(0, 6).map((f) => {
                    const m = mice.find((x) => x.slug === f.slug);
                    if (!m) return null;
                    return (
                      <button
                        key={f.slug}
                        onClick={() => patch({ mouseSlug: f.slug })}
                        className={`chip cursor-pointer ${
                          setup.mouseSlug === f.slug ? "chip-active" : ""
                        }`}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="mono text-xs uppercase tracking-widest text-dim">Клавиатура</label>
            {resolved.keyboard && (
              <button
                onClick={() => favorites.toggle("keyboard", resolved.keyboard!.slug)}
                className={`mono cursor-pointer text-xs transition-colors ${
                  favorites.has("keyboard", resolved.keyboard.slug)
                    ? "text-volt"
                    : "text-dim hover:text-white"
                }`}
              >
                {favorites.has("keyboard", resolved.keyboard.slug)
                  ? "★ в избранном"
                  : "☆ в избранное"}
              </button>
            )}
          </div>
          <select
            value={setup.keyboardSlug ?? ""}
            onChange={(e) => patch({ keyboardSlug: e.target.value || null })}
            className={selectCls}
          >
            <option value="">— не выбрано —</option>
            {sortedKeyboards.map((k) => (
              <option key={k.slug} value={k.slug}>
                {k.brand} {k.name} — {kbLayoutLabel(k.layout)}
              </option>
            ))}
          </select>
          {resolved.keyboard && (
            <div className="mt-4">
              <KeyboardVisual kb={resolved.keyboard} />
              <p className="mono mt-3 text-xs text-dim">
                {resolved.keyboard.switches} · {resolved.keyboard.pollRateHz} Hz ·{" "}
                <Link
                  href={`/database/keyboards/${resolved.keyboard.slug}`}
                  className="text-neon hover:underline"
                >
                  подробнее
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="mono text-xs uppercase tracking-widest text-dim">Коврик</label>
            {resolved.pad && (
              <button
                onClick={() => favorites.toggle("pad", resolved.pad!.slug)}
                className={`mono cursor-pointer text-xs transition-colors ${
                  favorites.has("pad", resolved.pad.slug) ? "text-volt" : "text-dim hover:text-white"
                }`}
              >
                {favorites.has("pad", resolved.pad.slug) ? "★ в избранном" : "☆ в избранное"}
              </button>
            )}
          </div>
          <select
            value={setup.padSlug ?? ""}
            onChange={(e) => patch({ padSlug: e.target.value || null })}
            className={selectCls}
          >
            <option value="">— не выбрано —</option>
            {sortedPads.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.brand} {p.name} —{" "}
                {fmtFriction((p.dynamicFrictionX + p.dynamicFrictionY) / 2)}
              </option>
            ))}
          </select>
          {resolved.pad && (
            <div className="mt-4">
              <PadVisual pad={resolved.pad} />
              <p className="mono mt-3 text-xs text-dim">
                {textureLabel(resolved.pad.surfaceTexture)} · {surfaceLabel(resolved.pad.surface)} ·{" "}
                <Link
                  href={`/database/pads/${resolved.pad.slug}`}
                  className="text-neon hover:underline"
                >
                  подробнее
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="mono text-xs uppercase tracking-widest text-dim">Глайды</label>
            {resolved.glide && (
              <button
                onClick={() => favorites.toggle("glide", resolved.glide!.slug)}
                className={`mono cursor-pointer text-xs transition-colors ${
                  favorites.has("glide", resolved.glide.slug)
                    ? "text-volt"
                    : "text-dim hover:text-white"
                }`}
              >
                {favorites.has("glide", resolved.glide.slug) ? "★ в избранном" : "☆ в избранное"}
              </button>
            )}
          </div>
          <select
            value={setup.glideSlug ?? ""}
            onChange={(e) => patch({ glideSlug: e.target.value || null })}
            className={selectCls}
          >
            <option value="">— не выбрано —</option>
            {sortedGlides.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.brand} {g.name} — {materialLabel(g.material)}
              </option>
            ))}
          </select>
          {resolved.glide && (
            <p className="mono mt-4 text-xs text-dim">
              {materialLabel(resolved.glide.material)} · {resolved.glide.thicknessMm} мм ·
              долговечность {resolved.glide.durabilityIndex}/100
            </p>
          )}
        </div>
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mono mb-2 block text-xs uppercase tracking-widest text-dim">DPI</label>
          <input
            type="number"
            min={50}
            step={50}
            value={setup.dpi}
            onChange={(e) => patch({ dpi: Number(e.target.value) })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mono mb-2 block text-xs uppercase tracking-widest text-dim">
            Sensitivity
          </label>
          <input
            type="number"
            min={0}
            step="0.001"
            value={setup.sens}
            onChange={(e) => patch({ sens: Number(e.target.value) })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mono mb-2 block text-xs uppercase tracking-widest text-dim">Игра</label>
          <select
            value={setup.gameId}
            onChange={(e) => patch({ gameId: e.target.value as SetupSelection["gameId"] })}
            className={selectCls}
          >
            {GAMES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mono mb-2 block text-xs uppercase tracking-widest text-dim">Хват</label>
          <div className="flex flex-wrap gap-1.5">
            {gripOptions.map((g) => (
              <button
                key={g}
                onClick={() => patch({ grip: g })}
                className={`chip cursor-pointer ${setup.grip === g ? "chip-active" : ""}`}
              >
                {gripLabel(g)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono text-xs uppercase tracking-widest text-dim">заполнено</p>
            <p className="mono mt-1 text-3xl font-bold text-white">{resolved.filled} / 4</p>
          </div>
          <div>
            <p className="mono text-xs uppercase tracking-widest text-dim">eDPI</p>
            <p className="mono mt-1 text-3xl font-bold text-white">
              {resolved.edpi ? Math.round(resolved.edpi) : "—"}
            </p>
          </div>
          <div>
            <p className="mono text-xs uppercase tracking-widest text-dim">cm / 360°</p>
            <p className="mono mt-1 text-3xl font-bold text-volt">
              {resolved.cm360 !== null ? `${resolved.cm360.toFixed(1)}` : "—"}
            </p>
            {resolved.band && (
              <p className="mono text-[11px] text-dim">{sensBandLabel(resolved.band)}</p>
            )}
          </div>
          <div>
            <p className="mono text-xs uppercase tracking-widest text-dim">синергия</p>
            <p
              className={`mono mt-1 text-3xl font-bold ${
                resolved.synergy
                  ? resolved.synergy.score >= 75
                    ? "text-neon"
                    : resolved.synergy.score >= 50
                      ? "text-volt"
                      : "text-red-400"
                  : "text-dim"
              }`}
            >
              {resolved.synergy ? resolved.synergy.score : "—"}
            </p>
            {resolved.synergy && (
              <p className="mono text-[11px] text-dim">
                {effortClassLabel(resolved.synergy.effortClass)}
              </p>
            )}
          </div>
          <div>
            <p className="mono text-xs uppercase tracking-widest text-dim">сумма</p>
            <p className="mono mt-1 text-3xl font-bold text-white">
              {resolved.totalPriceUsd > 0 ? `$${resolved.totalPriceUsd}` : "—"}
            </p>
          </div>
        </div>

        {resolved.synergy && (
          <div className="mt-6">
            <div className="mono flex justify-between text-[11px] text-dim">
              <span>быстро</span>
              <span>
                сопротивление {fmtFriction(resolved.synergy.effectiveResistance)} · ресурс глайдов ≈{" "}
                {resolved.synergy.glideLifeWeeks} нед.
              </span>
              <span>медленно</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-raised">
              <div
                className="anim-bar h-full rounded-full bg-gradient-to-r from-neon to-volt"
                style={{ width: `${resolved.synergy.effortPercent}%` }}
              />
            </div>
          </div>
        )}

        {!resolved.synergy && (
          <p className="mt-6 text-sm leading-relaxed text-dim">
            Выберите мышь, коврик и глайды — движок посчитает эффективное сопротивление связки и
            ресурс глайдов.{" "}
            <Link href="/tools/synergy" className="text-neon hover:underline">
              Как это считается
            </Link>
          </p>
        )}
      </section>

      {resolved.synergy && resolved.synergy.issues.length > 0 && (
        <section>
          <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">Анализ связки</h2>
          <ul className="space-y-2">
            {resolved.synergy.issues.map((i) => (
              <li key={i.title} className="card p-4">
                <span
                  className={`mono text-[11px] uppercase tracking-widest ${severityStyle[i.severity]}`}
                >
                  {severityLabel(i.severity)}
                </span>
                <p className="mt-1 font-medium">{i.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-dim">{i.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resolved.notes.length > 0 && (
        <section>
          <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
            Замечания по сетапу
          </h2>
          <ul className="space-y-2">
            {resolved.notes.map((n) => (
              <li key={n} className="card p-4 text-sm leading-relaxed text-dim">
                {n}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">Сохранить и поделиться</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSavedSetup(setup)}
            className="chip chip-active cursor-pointer"
          >
            сохранить в браузере
          </button>
          <button onClick={applyToUrl} className="chip cursor-pointer">
            зафиксировать в адресе
          </button>
          <button onClick={() => copy("link")} className="chip cursor-pointer">
            {copied === "link" ? "✓ ссылка скопирована" : "копировать ссылку"}
          </button>
          <button onClick={() => copy("text")} className="chip cursor-pointer">
            {copied === "text" ? "✓ текст скопирован" : "копировать текстом"}
          </button>
          <button onClick={() => setSetup(defaultSetup)} className="chip cursor-pointer">
            сбросить
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-dim">
          Сетап хранится только в вашем браузере — ничего не отправляется на сервер. Ссылка
          содержит весь выбор целиком, поэтому её можно отправить другому человеку или открыть на
          другом устройстве.
        </p>
        {hydrated && savedSetup && (
          <button
            onClick={() => setSetup(savedSetup)}
            className="mono mt-3 cursor-pointer text-xs text-neon hover:underline"
          >
            загрузить сохранённый сетап
          </button>
        )}
      </section>
    </div>
  );
}
