"use client";

import { useMemo, useState } from "react";
import { cmPer360Of, edpiOf, type ProGame, type ProSettings } from "@/data/pros";

const GAMES: { id: ProGame; name: string }[] = [
  { id: "cs2", name: "CS2" },
  { id: "valorant", name: "Valorant" },
];

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 font-mono text-lg text-white outline-none transition-shadow focus:border-volt focus:shadow-[0_0_16px_rgba(198,255,0,0.25)]";

function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 100) return n.toFixed(0);
  if (abs >= 10) return n.toFixed(1);
  return String(Number(n.toFixed(2)));
}

interface Ranked extends ProSettings {
  proCm: number;
  deltaPct: number | null;
}

export function ProSensCompare({ players }: { players: ProSettings[] }) {
  const [game, setGame] = useState<ProGame>("cs2");
  const [dpiRaw, setDpiRaw] = useState("800");
  const [sensRaw, setSensRaw] = useState("1");

  const ranked = useMemo<Ranked[]>(() => {
    const dpi = Number(dpiRaw.replace(",", "."));
    const sens = Number(sensRaw.replace(",", "."));
    if (!isFinite(dpi) || !isFinite(sens) || dpi <= 0 || sens <= 0) return [];

    const userCm = (360 * 2.54) / (dpi * sens * (game === "cs2" ? 0.022 : 0.07));
    return players
      .filter((p) => p.game === game)
      .map((p) => {
        const proCm = cmPer360Of(p);
        return { ...p, proCm, deltaPct: ((proCm - userCm) / userCm) * 100 };
      })
      .sort((a, b) => Math.abs(a.deltaPct!) - Math.abs(b.deltaPct!));
  }, [players, game, dpiRaw, sensRaw]);

  const userEdpi = useMemo(() => {
    const dpi = Number(dpiRaw.replace(",", "."));
    const sens = Number(sensRaw.replace(",", "."));
    if (!isFinite(dpi) || !isFinite(sens) || dpi <= 0 || sens <= 0) return null;
    return { edpi: dpi * sens, cm: (360 * 2.54) / (dpi * sens * (game === "cs2" ? 0.022 : 0.07)) };
  }, [dpiRaw, sensRaw, game]);

  const fasterCount = userEdpi
    ? ranked.filter((p) => p.proCm < userEdpi.cm).length
    : 0;

  return (
    <section className="card mt-8 p-6">
      <h2 className="mono text-xs uppercase tracking-widest text-volt">
        сравни свою сенсу с про
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dim">
        Введите свои DPI и сенсу — покажем, кто из про-игроков ближе всего к вашему разгону и
        насколько их сенса быстрее или медленнее вашей.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mono mb-1.5 block text-xs text-dim">Игра</label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value as ProGame)}
              className={`${inputCls} cursor-pointer appearance-none`}
            >
              {GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mono mb-1.5 block text-xs text-dim">DPI</label>
            <input
              type="number"
              min={50}
              step={50}
              value={dpiRaw}
              onChange={(e) => setDpiRaw(e.target.value)}
              placeholder="800"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mono mb-1.5 block text-xs text-dim">Сенса</label>
            <input
              type="number"
              step="0.001"
              min={0}
              value={sensRaw}
              onChange={(e) => setSensRaw(e.target.value)}
              placeholder="1.0"
              className={inputCls}
            />
          </div>
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <span className="mono text-2xl text-dim">→</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-volt/40 bg-raised px-4 py-3 shadow-[0_0_16px_rgba(198,255,0,0.15)]">
            <p className="mono text-xs text-dim">ваша см/360</p>
            <p className={`font-mono text-2xl ${userEdpi ? "text-volt" : "text-dim"}`}>
              {userEdpi ? `${fmt(userEdpi.cm)} см` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-raised px-4 py-3">
            <p className="mono text-xs text-dim">ваш eDPI</p>
            <p className={`font-mono text-2xl ${userEdpi ? "text-white" : "text-dim"}`}>
              {userEdpi ? fmt(userEdpi.edpi) : "—"}
            </p>
          </div>
        </div>
      </div>

      {ranked.length > 0 ? (
        <>
          <p className="mt-5 text-sm text-dim">
            {fasterCount === ranked.length
              ? "Ваша сенса медленнее, чем у всех про из списка."
              : fasterCount === 0
                ? "Ваша сенса быстрее, чем у всех про из списка."
                : `Вы между про-игроками: быстрее ${ranked.length - fasterCount}, медленнее ${fasterCount} из списка.`}
          </p>

          <div className="stagger mt-4 space-y-2">
            {ranked.map((p, i) => (
              <div
                key={p.slug}
                className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-3 ${
                  i === 0
                    ? "border-volt/50 bg-raised shadow-[0_0_12px_rgba(198,255,0,0.1)]"
                    : "border-line"
                }`}
              >
                <span className="mono w-6 text-xs text-faint">{i + 1}</span>
                <span className="font-bold">{p.player}</span>
                <span className="mono text-xs text-faint">{p.team ?? "без команды"}</span>
                <span className="mono ml-auto text-xs text-dim">
                  eDPI {fmt(edpiOf(p))} · {p.proCm} см/360
                </span>
                <span
                  className={`mono w-40 text-right text-xs ${
                    p.deltaPct === 0
                      ? "text-volt"
                      : Math.abs(p.deltaPct!) < 10
                        ? "text-fg"
                        : "text-dim"
                  }`}
                >
                  {Math.abs(p.deltaPct!) < 1
                    ? "≈ ваша сенса"
                    : p.deltaPct! < 0
                      ? `быстрее на ${fmt(Math.abs(p.deltaPct!))}%`
                      : `медленнее на ${fmt(p.deltaPct!)}%`}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">
            «Быстрее» = меньше см на 360°. Сортировка — по близости к вашей сенсе.
          </p>
        </>
      ) : (
        <p className="mt-5 text-sm text-dim">
          Введите DPI и сенсу, чтобы увидеть сравнение.
        </p>
      )}
    </section>
  );
}
