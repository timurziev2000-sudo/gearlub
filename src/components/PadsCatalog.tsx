"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Mousepad } from "@/lib/types";
import { PadVisual } from "@/components/DeviceVisual";
import { FavoriteButton } from "@/components/FavoriteButton";
import { surfaceLabel } from "@/lib/labels";
import {
  anisotropy,
  anisotropyLabel,
  anisotropyLevel,
  avgDynamic,
  fmtFriction,
  frictionPercent,
  frictionSourceLabel,
  speedClass,
  speedClassLabel,
  textureLabel,
} from "@/lib/friction";

type SortKey = "friction-asc" | "friction-desc" | "anisotropy-desc" | "price-asc";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "friction-asc", label: "быстрее → медленнее" },
  { key: "friction-desc", label: "медленнее → быстрее" },
  { key: "anisotropy-desc", label: "по анизотропии X/Y" },
  { key: "price-asc", label: "по цене" },
];

const textures: Mousepad["surfaceTexture"][] = ["smooth", "textured", "abrasive", "glass"];

export function PadsCatalog({ pads }: { pads: Mousepad[] }) {
  const [sort, setSort] = useState<SortKey>("friction-asc");
  const [texture, setTexture] = useState<Mousepad["surfaceTexture"] | "all">("all");
  const [measuredOnly, setMeasuredOnly] = useState(false);

  const visible = useMemo(() => {
    let list = texture === "all" ? [...pads] : pads.filter((p) => p.surfaceTexture === texture);
    if (measuredOnly) list = list.filter((p) => p.frictionSource === "cisA");
    switch (sort) {
      case "friction-asc":
        return list.sort((a, b) => avgDynamic(a) - avgDynamic(b));
      case "friction-desc":
        return list.sort((a, b) => avgDynamic(b) - avgDynamic(a));
      case "anisotropy-desc":
        return list.sort((a, b) => anisotropy(b) - anisotropy(a));
      case "price-asc":
        return list.sort((a, b) => a.priceUsd - b.priceUsd);
    }
  }, [pads, sort, texture, measuredOnly]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTexture("all")}
          className={`chip cursor-pointer ${texture === "all" ? "chip-active" : ""}`}
        >
          все поверхности
        </button>
        {textures.map((t) => (
          <button
            key={t}
            onClick={() => setTexture(t)}
            className={`chip cursor-pointer ${texture === t ? "chip-active" : ""}`}
          >
            {textureLabel(t)}
          </button>
        ))}
        <button
          onClick={() => setMeasuredOnly(!measuredOnly)}
          className={`chip cursor-pointer ${measuredOnly ? "chip-active" : ""}`}
        >
          только измеренные cisA
        </button>
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
        <span className="mono ml-auto text-xs text-dim">{visible.length} из {pads.length}</span>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => {
          const aniso = anisotropyLevel(p);
          return (
            <article
              key={p.slug}
              className="card anim-fade-up flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#00E5FF] hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]"
            >
              <PadVisual pad={p} />
              <div className="mt-4 flex items-start justify-between gap-2">
                <h2 className="font-semibold">
                  <Link href={`/database/pads/${p.slug}`} className="hover:text-neon">
                    {p.brand} {p.name}
                  </Link>
                </h2>
                <div className="flex shrink-0 items-center gap-1.5">
                  <FavoriteButton kind="pad" slug={p.slug} />
                  <span className="mono rounded-md bg-raised px-2 py-1 text-xs text-volt">
                    ${p.priceUsd}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <div className="mono flex justify-between text-[11px] text-dim">
                  <span>скорость</span>
                  <span className="text-white">{speedClassLabel(speedClass(p))}</span>
                  <span>контроль</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-raised">
                  <div
                    className="anim-bar h-full rounded-full bg-gradient-to-r from-neon to-volt"
                    style={{ width: `${frictionPercent(p)}%` }}
                  />
                </div>
              </div>

              <dl className="mono mt-4 flex-1 space-y-1 text-xs text-dim">
                <div>
                  динамика X/Y:{" "}
                  <span className="text-white">
                    {fmtFriction(p.dynamicFrictionX)} / {fmtFriction(p.dynamicFrictionY)}
                  </span>
                </div>
                <div>
                  статика X/Y:{" "}
                  <span className="text-white">
                    {fmtFriction(p.staticFrictionX)} / {fmtFriction(p.staticFrictionY)}
                  </span>
                </div>
                <div>
                  поверхность: <span className="text-white">{textureLabel(p.surfaceTexture)}</span>
                </div>
                <div>
                  тип: <span className="text-white">{surfaceLabel(p.surface)}</span>
                </div>
                <div>
                  толщина: <span className="text-white">{p.thickness} мм</span>
                </div>
                <div>
                  источник:{" "}
                  <span className={p.frictionSource === "cisA" ? "text-white" : "text-neon"}>
                    {frictionSourceLabel(p.frictionSource)}
                  </span>
                </div>
              </dl>

              {aniso !== "low" && (
                <span
                  className={`mono mt-4 w-fit rounded-md px-2 py-1 text-[11px] ${
                    aniso === "high"
                      ? "bg-volt/10 text-volt"
                      : "bg-raised text-dim"
                  }`}
                >
                  {anisotropyLabel(aniso)} · Δ{fmtFriction(anisotropy(p))}
                </span>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
