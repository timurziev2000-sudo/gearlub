"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { keyboards as kbList } from "@/data/keyboards";
import { KeyboardVisual } from "@/components/DeviceVisual";
import { FavoriteButton } from "@/components/FavoriteButton";
import { kbConnLabel, kbLayoutLabel } from "@/lib/labels";
import type { Keyboard } from "@/lib/types";

type KbType = "all" | "mech" | "he";

const layouts = [...new Set(kbList.map((k) => k.layout))];
const connTypes = ["tri-mode", "wireless", "wired"] as const;

export function KeyboardCatalog({ data }: { data: Keyboard[] }) {
  const [layoutSel, setLayoutSel] = useState<string[]>([]);
  const [type, setType] = useState<KbType>("all");
  const [connSel, setConnSel] = useState<string[]>([]);
  const [hotSwapOnly, setHotSwapOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(220);

  const filtered = useMemo(
    () =>
      data.filter((k) => {
        if (layoutSel.length && !layoutSel.includes(k.layout)) return false;
        if (type === "mech" && k.hallEffect) return false;
        if (type === "he" && !k.hallEffect) return false;
        if (connSel.length && !connSel.includes(k.connectivity)) return false;
        if (hotSwapOnly && !k.hotSwap) return false;
        if (k.priceUsd > maxPrice) return false;
        return true;
      }),
    [data, layoutSel, type, connSel, hotSwapOnly, maxPrice],
  );

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const reset = () => {
    setLayoutSel([]);
    setType("all");
    setConnSel([]);
    setHotSwapOnly(false);
    setMaxPrice(220);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-6">
        <div>
          <h3 className="mono mb-2 text-xs uppercase tracking-widest text-dim">Форм-фактор</h3>
          <div className="flex flex-wrap gap-1.5">
            {layouts.map((l) => (
              <button
                key={l}
                onClick={() => toggle(layoutSel, l, setLayoutSel)}
                className={`chip mono cursor-pointer ${layoutSel.includes(l) ? "chip-active" : ""}`}
              >
                {kbLayoutLabel(l)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mono mb-2 text-xs uppercase tracking-widest text-dim">Тип свичей</h3>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "Любые"],
                ["mech", "Механика"],
                ["he", "Hall Effect"],
              ] as [KbType, string][]
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setType(v)}
                className={`chip cursor-pointer ${type === v ? "chip-active" : ""}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mono mb-2 text-xs uppercase tracking-widest text-dim">Подключение</h3>
          <div className="flex flex-wrap gap-1.5">
            {connTypes.map((c) => (
              <button
                key={c}
                onClick={() => toggle(connSel, c, setConnSel)}
                className={`chip cursor-pointer ${connSel.includes(c) ? "chip-active" : ""}`}
              >
                {kbConnLabel(c)}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hotSwapOnly}
            onChange={(e) => setHotSwapOnly(e.target.checked)}
            className="accent-volt"
          />
          Только hot-swap
        </label>

        <div>
          <h3 className="mono mb-2 text-xs uppercase tracking-widest text-dim">
            Бюджет: <span className="text-volt">${maxPrice}</span>
          </h3>
          <input
            type="range"
            min={25}
            max={220}
            step={5}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-volt"
          />
        </div>

        <button onClick={reset} className="cursor-pointer text-sm text-dim underline hover:text-white">
          Сбросить фильтры
        </button>
      </aside>

      <section>
        <p className="mono mb-4 text-sm text-dim">
          Найдено: <span className="text-volt">{filtered.length}</span> / {data.length}
        </p>
        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-dim">
            Ничего не найдено. Смягчите фильтры или сбросьте их.
          </div>
        ) : (
          <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((k) => (
              <KeyboardCard key={k.slug} kb={k} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KeyboardCard({ kb }: { kb: Keyboard }) {
  return (
    <article className="card anim-fade-up p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#C6FF00] hover:shadow-[0_0_20px_rgba(198,255,0,0.15)]">
      <KeyboardVisual kb={kb} />
      <div className="mt-4 flex items-start justify-between gap-2">
        <Link href={`/database/keyboards/${kb.slug}`} className="font-semibold leading-snug hover:text-volt">
          {kb.brand} {kb.name}
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <FavoriteButton kind="keyboard" slug={kb.slug} />
          <span className="mono rounded-md bg-raised px-2 py-1 text-xs text-volt">
            ${kb.priceUsd}
          </span>
        </div>
      </div>
      <dl className="mono mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-dim">
        <div>layout: <span className="text-white">{kbLayoutLabel(kb.layout)}</span></div>
        <div>switches: <span className="text-white">{kb.switches}</span></div>
        <div>polling: <span className="text-white">{kb.pollRateHz} Hz</span></div>
        <div>mount: <span className="text-white">{kb.mount}</span></div>
        {kb.releaseYear && (
          <div>год: <span className="text-white">{kb.releaseYear}</span></div>
        )}
        {kb.caseMaterial && (
          <div>корпус: <span className="text-white">{kb.caseMaterial}</span></div>
        )}
      </dl>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="chip">{kbConnLabel(kb.connectivity)}</span>
        {kb.hotSwap && <span className="chip">hot-swap</span>}
        {kb.hallEffect && <span className="chip chip-active">hall effect</span>}
        {kb.rapidTrigger && <span className="chip chip-active">rapid trigger</span>}
        {kb.analogInput && <span className="chip">analog</span>}
      </div>
    </article>
  );
}
