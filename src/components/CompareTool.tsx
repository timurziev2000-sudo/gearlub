"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keyboards as allKeyboards } from "@/data/keyboards";
import { glides, mice as allMice, pads as allPads } from "@/data/gear";
import { gripList, kbConnLabel, kbLayoutLabel, materialLabel, surfaceLabel } from "@/lib/labels";
import {
  anisotropy,
  avgDynamic,
  fmtFriction,
  frictionSourceLabel,
  speedClass,
  speedClassLabel,
  textureLabel,
} from "@/lib/friction";
import type { Glide, Keyboard, Mouse, Mousepad } from "@/lib/types";

type CompareType = "mice" | "keyboards" | "pads" | "glides";

const MAX = 4;

interface AnyItem {
  slug: string;
  brand: string;
  name: string;
}

interface RowCfg {
  label: string;
  get: (x: never) => string;
  best?: "max" | "min";
}

const miceRows: RowCfg[] = [
  { label: "Сенсор", get: (m: Mouse) => m.sensor },
  { label: "Макс. DPI", get: (m: Mouse) => String(m.dpiMax), best: "max" },
  { label: "Вес, г", get: (m: Mouse) => String(m.weightG), best: "min" },
  { label: "Клик-латентность, ms", get: (m: Mouse) => String(m.clickLatencyMs), best: "min" },
  { label: "Polling rate, Hz", get: (m: Mouse) => String(m.pollingHz), best: "max" },
  { label: "Motion Sync", get: (m: Mouse) => (m.motionSync ? "да" : "нет") },
  { label: "Свичи", get: (m: Mouse) => m.switches },
  { label: "Форма", get: (m: Mouse) => (m.shape === "symmetric" ? "симметричная" : "эргономичная") },
  { label: "Хваты", get: (m: Mouse) => gripList(m.grips) },
  {
    label: "Подключение",
    get: (m: Mouse) =>
      m.connectivity === "wired"
        ? "проводная"
        : m.connectivity === "wireless"
          ? "беспроводная"
          : "гибрид",
  },
  { label: "Цена, $", get: (m: Mouse) => String(m.priceUsd), best: "min" },
];

const keyboardRows: RowCfg[] = [
  { label: "Раскладка", get: (k: Keyboard) => kbLayoutLabel(k.layout) },
  { label: "Свичи", get: (k: Keyboard) => k.switches },
  { label: "Hall Effect", get: (k: Keyboard) => (k.hallEffect ? "да" : "нет") },
  { label: "Rapid Trigger", get: (k: Keyboard) => (k.rapidTrigger ? "да" : "нет") },
  {
    label: "Актюация, Г",
    get: (k: Keyboard) => (k.actuationG === null ? "—" : String(k.actuationG)),
  },
  { label: "Hot-swap", get: (k: Keyboard) => (k.hotSwap ? "да" : "нет") },
  { label: "Подключение", get: (k: Keyboard) => kbConnLabel(k.connectivity) },
  { label: "Крепление", get: (k: Keyboard) => k.mount },
  { label: "Polling rate, Hz", get: (k: Keyboard) => String(k.pollRateHz), best: "max" },
  {
    label: "Аналоговый ввод",
    get: (k: Keyboard) =>
      k.analogInput === true ? "да" : k.analogInput === false ? "нет" : "—",
  },
  {
    label: "Год выхода",
    get: (k: Keyboard) => (k.releaseYear !== undefined ? String(k.releaseYear) : "—"),
  },
  { label: "Корпус", get: (k: Keyboard) => k.caseMaterial ?? "—" },
  { label: "Цена, $", get: (k: Keyboard) => String(k.priceUsd), best: "min" },
];

const padRows: RowCfg[] = [
  { label: "Поверхность", get: (p: Mousepad) => surfaceLabel(p.surface) },
  { label: "На ощупь", get: (p: Mousepad) => textureLabel(p.surfaceTexture) },
  {
    label: "Динамика X / Y",
    get: (p: Mousepad) =>
      `${fmtFriction(p.dynamicFrictionX)} / ${fmtFriction(p.dynamicFrictionY)}`,
  },
  {
    label: "Статика X / Y",
    get: (p: Mousepad) =>
      `${fmtFriction(p.staticFrictionX)} / ${fmtFriction(p.staticFrictionY)}`,
  },
  { label: "Средняя динамика", get: (p: Mousepad) => fmtFriction(avgDynamic(p)) },
  { label: "Класс скольжения", get: (p: Mousepad) => speedClassLabel(speedClass(p)) },
  { label: "Анизотропия Δ X/Y", get: (p: Mousepad) => fmtFriction(anisotropy(p)), best: "min" },
  { label: "Толщина, мм", get: (p: Mousepad) => String(p.thickness) },
  { label: "Прошитые кромки", get: (p: Mousepad) => (p.stitchedEdges ? "да" : "нет") },
  { label: "Основание", get: (p: Mousepad) => p.base },
  { label: "Источник метрик", get: (p: Mousepad) => frictionSourceLabel(p.frictionSource) },
  { label: "Цена, $", get: (p: Mousepad) => String(p.priceUsd), best: "min" },
];

const glideRows: RowCfg[] = [
  { label: "Материал", get: (g: Glide) => materialLabel(g.material) },
  { label: "Толщина, мм", get: (g: Glide) => String(g.thicknessMm) },
  { label: "Скорость /100", get: (g: Glide) => String(g.speedIndex) },
  { label: "Долговечность /100", get: (g: Glide) => String(g.durabilityIndex), best: "max" },
  { label: "Цена, $", get: (g: Glide) => String(g.priceUsd), best: "min" },
];

const typeLabels: Record<CompareType, string> = {
  mice: "Мыши",
  keyboards: "Клавиатуры",
  pads: "Коврики",
  glides: "Глайды",
};

const sources: Record<
  CompareType,
  { arr: AnyItem[]; rows: RowCfg[]; basePath: string }
> = {
  mice: { arr: allMice, rows: miceRows, basePath: "/database/mice" },
  keyboards: { arr: allKeyboards, rows: keyboardRows, basePath: "/database/keyboards" },
  pads: { arr: allPads, rows: padRows, basePath: "/database/pads" },
  glides: { arr: glides, rows: glideRows, basePath: "/database/glides" },
};

export function CompareTool() {
  const searchParams = useSearchParams();

  const initialType = useMemo<CompareType>(() => {
    const t = searchParams.get("type");
    return t === "keyboards" || t === "pads" || t === "glides" ? t : "mice";
  }, [searchParams]);

  const initialIds = useMemo(() => {
    const ids = (searchParams.get("ids") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => sources[initialType].arr.some((d) => d.slug === s));
    return ids.slice(0, MAX);
  }, [searchParams, initialType]);

  const [type, setType] = useState<CompareType>(initialType);
  const [selected, setSelected] = useState<Record<CompareType, string[]>>({
    mice: [],
    keyboards: [],
    pads: [],
    glides: [],
    [initialType]: initialIds,
  });

  const { arr, rows, basePath, label } = useMemo(
    () => ({ ...sources[type], label: typeLabels[type] }),
    [type],
  );

  const chosen = arr.filter((d) => selected[type].includes(d.slug));

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const cur = prev[type];
      const next = cur.includes(slug)
        ? cur.filter((s) => s !== slug)
        : cur.length >= MAX
          ? cur
          : [...cur, slug];
      return { ...prev, [type]: next };
    });
  };

  const bestValues = useMemo(() => {
    const result: Record<string, Set<string>> = {};
    if (chosen.length < 2) return result;
    for (const row of rows) {
      if (!row.best) continue;
      const nums = chosen.map((item) => Number(row.get(item as never)));
      const target = row.best === "max" ? Math.max(...nums) : Math.min(...nums);
      const winners = new Set<string>();
      nums.forEach((n) => {
        if (n === target) winners.add(String(n));
      });
      result[row.label] = winners;
    }
    return result;
  }, [chosen, rows]);

  const available = arr.filter((d) => !selected[type].includes(d.slug));

  return (
    <div className="space-y-8">
      <div className="flex gap-1.5">
        {(Object.keys(typeLabels) as CompareType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`chip cursor-pointer ${type === t ? "chip-active" : ""}`}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      <section className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="mono text-xs uppercase tracking-widest text-dim">
            {label}: выбрано {chosen.length}/{MAX}
          </h2>
          {selected[type].length > 0 && (
            <button
              onClick={() => setSelected((prev) => ({ ...prev, [type]: [] }))}
              className="cursor-pointer text-sm text-dim underline hover:text-white"
            >
              Очистить
            </button>
          )}
        </div>
        {available.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {available.map((d) => (
              <button
                key={d.slug}
                onClick={() => toggle(d.slug)}
                disabled={selected[type].length >= MAX}
                className="chip cursor-pointer hover:border-volt/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + {d.brand} {d.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dim">Добавлено максимум устройств.</p>
        )}
      </section>

      {chosen.length === 0 ? (
        <p className="card p-10 text-center text-dim">
          Добавьте от 2 до {MAX} устройств для сравнения характеристик.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-bg p-3 text-left" />
                {chosen.map((c) => (
                  <th key={c.slug} className="p-3 align-top text-left">
                    <Link href={`${basePath}/${c.slug}`} className="font-semibold hover:text-volt">
                      {c.brand} {c.name}
                    </Link>
                    <button
                      onClick={() => toggle(c.slug)}
                      aria-label={`Убрать ${c.name}`}
                      className="mono ml-2 cursor-pointer rounded border border-line px-1.5 text-xs text-dim hover:border-neon hover:text-neon"
                    >
                      ×
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <td className="sticky left-0 whitespace-nowrap bg-bg p-3 text-dim">{row.label}</td>
                  {chosen.map((c) => {
                    const val = row.get(c as never);
                    const isBest =
                      row.best && chosen.length >= 2 && bestValues[row.label]?.has(val);
                    return (
                      <td
                        key={`${row.label}-${c.slug}`}
                        className={`mono p-3 ${isBest ? "font-semibold text-volt" : ""}`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
