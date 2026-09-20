"use client";

import { useMemo, useState } from "react";
import { MouseCard } from "@/components/MouseCard";
import { mice as miceList } from "@/data/gear";
import { gripLabel } from "@/lib/labels";
import type { GripStyle, Mouse } from "@/lib/types";

type WeightBand = "all" | "ultralight" | "light" | "mid";

const sensors = [...new Set(miceList.map((m) => m.sensor))].sort();
const grips: GripStyle[] = ["palm", "claw", "fingertip"];
const connectivities = [
  { value: "wireless" as const, label: "Беспроводные" },
  { value: "wired" as const, label: "Проводные" },
];
const pollings = [8000, 4000, 2000, 1000];

function miceListFilter(
  list: Mouse[],
  opts: {
    sensor: string[];
    grip: GripStyle[];
    connectivity: string[];
    polling: number;
    weight: WeightBand;
    maxPrice: number;
  },
) {
  return list.filter((m) => {
    if (opts.sensor.length && !opts.sensor.includes(m.sensor)) return false;
    if (opts.grip.length && !opts.grip.some((g) => m.grips.includes(g))) return false;
    if (
      opts.connectivity.length &&
      !opts.connectivity.some((c) => c === m.connectivity || m.connectivity === "hybrid")
    )
      return false;
    if (opts.polling && m.pollingHz < opts.polling) return false;
    if (opts.weight === "ultralight" && m.weightG > 45) return false;
    if (opts.weight === "light" && m.weightG > 60) return false;
    if (opts.weight === "mid" && m.weightG > 80) return false;
    if (m.priceUsd > opts.maxPrice) return false;
    return true;
  });
}

export function MiceCatalog({ data }: { data: Mouse[] }) {
  const [sensorSel, setSensorSel] = useState<string[]>([]);
  const [gripSel, setGripSel] = useState<GripStyle[]>([]);
  const [connSel, setConnSel] = useState<string[]>([]);
  const [pollingMin, setPollingMin] = useState(0);
  const [weight, setWeight] = useState<WeightBand>("all");
  const [maxPrice, setMaxPrice] = useState(200);

  const filtered = useMemo(
    () =>
      miceListFilter(data, {
        sensor: sensorSel,
        grip: gripSel,
        connectivity: connSel,
        polling: pollingMin,
        weight,
        maxPrice,
      }),
    [data, sensorSel, gripSel, connSel, pollingMin, weight, maxPrice],
  );

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const reset = () => {
    setSensorSel([]);
    setGripSel([]);
    setConnSel([]);
    setPollingMin(0);
    setWeight("all");
    setMaxPrice(200);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[248px_1fr]">
      <aside className="panel h-fit space-y-6 p-5 lg:sticky lg:top-20">
        <div>
          <h3 className="eyebrow mb-2.5 block">Сенсор</h3>
          <div className="flex flex-wrap gap-1.5">
            {sensors.map((s) => (
              <button
                key={s}
                onClick={() => toggle(sensorSel, s, setSensorSel)}
                className={`chip cursor-pointer ${sensorSel.includes(s) ? "chip-active" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-2.5 block">Хват</h3>
          <div className="flex gap-1.5">
            {grips.map((g) => (
              <button
                key={g}
                onClick={() => toggle(gripSel, g, setGripSel)}
                className={`chip cursor-pointer ${gripSel.includes(g) ? "chip-active" : ""}`}
              >
                {gripLabel(g)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-2.5 block">Подключение</h3>
          <div className="flex gap-1.5">
            {connectivities.map((c) => (
              <button
                key={c.value}
                onClick={() => toggle(connSel, c.value, setConnSel)}
                className={`chip cursor-pointer ${connSel.includes(c.value) ? "chip-active" : ""}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-2.5 block">Polling от</h3>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setPollingMin(0)}
              className={`chip cursor-pointer ${pollingMin === 0 ? "chip-active" : ""}`}
            >
              любой
            </button>
            {pollings.map((p) => (
              <button
                key={p}
                onClick={() => setPollingMin(p)}
                className={`chip mono cursor-pointer ${pollingMin === p ? "chip-active" : ""}`}
              >
                {p} Hz
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-2.5 block">Вес</h3>
          <div className="flex flex-wrap gap-1.5">
            {([
              ["all", "любой"],
              ["ultralight", "< 45 г"],
              ["light", "< 60 г"],
              ["mid", "< 80 г"],
            ] as [WeightBand, string][]).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setWeight(v)}
                className={`chip cursor-pointer ${weight === v ? "chip-active" : ""}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-2.5 block">
            Бюджет до <span className="text-volt">${maxPrice}</span>
          </h3>
          <input
            type="range"
            min={30}
            max={200}
            step={5}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-volt"
          />
        </div>

        <button
          onClick={reset}
          className="mono w-full cursor-pointer rounded-lg border border-line py-2 text-[11px] text-dim transition-colors hover:border-line-strong hover:text-fg"
        >
          Сбросить фильтры
        </button>
      </aside>

      <section>
        <p className="mono mb-5 text-[11px] text-faint">
          Найдено <span className="text-volt">{filtered.length}</span> из {data.length}
        </p>
        {filtered.length === 0 ? (
          <div className="panel p-12 text-center text-dim">
            Ничего не найдено. Смягчите фильтры или сбросьте их.
          </div>
        ) : (
          <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <MouseCard key={m.slug} mouse={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

