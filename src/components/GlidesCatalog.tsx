"use client";

import { useMemo, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { glideFormLabel, materialLabel, tierLabel } from "@/lib/labels";
import type { Glide, GlideMaterial, PriceTier } from "@/lib/types";

type SortKey = "speed-desc" | "speed-asc" | "durability-desc" | "price-asc";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "speed-desc", label: "быстрее → медленнее" },
  { key: "speed-asc", label: "медленнее → быстрее" },
  { key: "durability-desc", label: "по стойкости" },
  { key: "price-asc", label: "по цене" },
];

const tiers: PriceTier[] = ["budget", "mid", "premium"];

const tierAccent: Record<PriceTier, string> = {
  budget: "text-emerald-400",
  mid: "text-volt",
  premium: "text-neon",
};

export function GlidesCatalog({ glides }: { glides: Glide[] }) {
  const [sort, setSort] = useState<SortKey>("speed-desc");
  const [tier, setTier] = useState<PriceTier | "all">("all");
  const [material, setMaterial] = useState<GlideMaterial | "all">("all");

  const materials = useMemo(
    () => [...new Set(glides.map((g) => g.material))],
    [glides],
  );

  const visible = useMemo(() => {
    let list = [...glides];
    if (tier !== "all") list = list.filter((g) => (g.tier ?? "mid") === tier);
    if (material !== "all") list = list.filter((g) => g.material === material);
    switch (sort) {
      case "speed-desc":
        return list.sort((a, b) => b.speedIndex - a.speedIndex);
      case "speed-asc":
        return list.sort((a, b) => a.speedIndex - b.speedIndex);
      case "durability-desc":
        return list.sort((a, b) => b.durabilityIndex - a.durabilityIndex);
      case "price-asc":
        return list.sort((a, b) => a.priceUsd - b.priceUsd);
    }
  }, [glides, sort, tier, material]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-xs uppercase tracking-widest text-dim">сегмент</span>
        <button
          onClick={() => setTier("all")}
          className={`chip cursor-pointer ${tier === "all" ? "chip-active" : ""}`}
        >
          все
        </button>
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={`chip cursor-pointer ${tier === t ? "chip-active" : ""}`}
          >
            {tierLabel(t)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-xs uppercase tracking-widest text-dim">материал</span>
        <button
          onClick={() => setMaterial("all")}
          className={`chip cursor-pointer ${material === "all" ? "chip-active" : ""}`}
        >
          любой
        </button>
        {materials.map((m) => (
          <button
            key={m}
            onClick={() => setMaterial(m)}
            className={`chip cursor-pointer ${material === m ? "chip-active" : ""}`}
          >
            {materialLabel(m)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-xs uppercase tracking-widest text-dim">сортировка</span>
        {sortOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => setSort(o.key)}
            className={`chip cursor-pointer ${sort === o.key ? "chip-active" : ""}`}
          >
            {o.label}
          </button>
        ))}
        <span className="mono ml-auto text-xs text-dim">
          {visible.length} из {glides.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center text-dim">
          Ничего не найдено. Смягчите фильтры.
        </div>
      ) : (
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((g) => {
            const t = g.tier ?? "mid";
            return (
              <article
                key={g.slug}
                className="card anim-fade-up flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#C6FF00] hover:shadow-[0_0_20px_rgba(198,255,0,0.15)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold leading-snug">
                      {g.brand} {g.name}
                    </h2>
                    <p className={`mono mt-1 text-[11px] uppercase tracking-widest ${tierAccent[t]}`}>
                      {tierLabel(t)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <FavoriteButton kind="glide" slug={g.slug} />
                    <span className="mono rounded-md bg-raised px-2 py-1 text-xs text-volt">
                      ${g.priceUsd}
                    </span>
                  </div>
                </div>

                <dl className="mono mt-4 space-y-1 text-xs text-dim">
                  <div>
                    материал: <span className="text-white">{materialLabel(g.material)}</span>
                  </div>
                  <div>
                    толщина: <span className="text-white">{g.thicknessMm} мм</span>
                  </div>
                  {g.form && (
                    <div>
                      форма: <span className="text-white">{glideFormLabel(g.form)}</span>
                    </div>
                  )}
                  {g.packContents && (
                    <div>
                      в упаковке: <span className="text-white">{g.packContents}</span>
                    </div>
                  )}
                </dl>

                <div className="mt-4 space-y-2">
                  <div>
                    <div className="mono flex justify-between text-[11px] text-dim">
                      <span>скорость</span>
                      <span className="text-white">{g.speedIndex}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
                      <div
                        className="anim-bar h-full rounded-full bg-volt"
                        style={{ width: `${g.speedIndex}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mono flex justify-between text-[11px] text-dim">
                      <span>стойкость</span>
                      <span className="text-white">{g.durabilityIndex}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
                      <div
                        className="anim-bar h-full rounded-full bg-neon"
                        style={{ width: `${g.durabilityIndex}%` }}
                      />
                    </div>
                  </div>
                </div>

                {g.note && (
                  <p className="mt-4 flex-1 text-xs leading-relaxed text-dim">{g.note}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
