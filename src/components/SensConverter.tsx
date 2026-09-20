"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const GAMES = [
  { id: "warface", name: "Warface", yaw: 0.00333 },
  { id: "cs2", name: "CS2 / Apex Legends", yaw: 0.022 },
  { id: "valorant", name: "Valorant", yaw: 0.07 },
  { id: "ow2", name: "Overwatch 2", yaw: 0.0066 },
  { id: "pubg", name: "PUBG", yaw: 0.002 },
  { id: "fortnite", name: "Fortnite", yaw: 0.005555 },
  { id: "r6", name: "Rainbow Six Siege", yaw: 0.00223 },
] as const;

type GameId = (typeof GAMES)[number]["id"];

function getGame(id: GameId) {
  return GAMES.find((g) => g.id === id)!;
}

function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 100) return n.toFixed(0);
  if (abs >= 10) return n.toFixed(1);
  return String(Number(n.toFixed(6)));
}

interface Verdict {
  emoji: string;
  title: string;
  tone: "warn" | "ok" | "fast";
  text: string;
  links: { href: string; label: string }[];
}

function getVerdict(cm360: number): Verdict {
  if (cm360 < 25)
    return {
      emoji: "⚠️",
      title: "Быстрая сенса",
      tone: "warn",
      text: "High Sens: критичен контроль микродвижений. Рекомендуем коврики с высоким контролем (LGG Saturn, Zowie G-SR-SE) и PTFE глайды.",
      links: [
        { href: "/database/pads", label: "Коврики control →" },
        { href: "/database/glides", label: "PTFE глайды →" },
      ],
    };
  if (cm360 <= 45)
    return {
      emoji: "✅",
      title: "Сбалансированная сенса",
      tone: "ok",
      text: "Medium Sens: универсальный коридор большинства про-игроков. Подходит под большинство Hybrid/Speed ковриков и глайды Nova Union Volna.",
      links: [
        { href: "/database/pads", label: "Hybrid-коврики →" },
        { href: "/tools/calculator", label: "Собрать полный бандл →" },
      ],
    };
  return {
    emoji: "🚀",
    title: "Низкая киберспортивная сенса",
    tone: "fast",
    text: "Low Sens: нужен большой коврик размера XL/XXL (Artisan Raiden, MCHOSE MP80) и лёгкая мышь до 55 грамм для комфортных разворотов.",
    links: [
      { href: "/database/mice/f/weight-under-60", label: "Мыши легче 60 г →" },
      { href: "/database/pads", label: "Коврики XL →" },
    ],
  };
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 font-mono text-lg text-white outline-none transition-shadow focus:border-volt focus:shadow-[0_0_16px_rgba(198,255,0,0.25)]";
const selectCls =
  "w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface px-4 py-3 text-white outline-none transition-shadow focus:border-volt focus:shadow-[0_0_16px_rgba(198,255,0,0.25)]";

export function SensConverter() {
  const [copied, setCopied] = useState(false);

  const [srcId, setSrcId] = useState<GameId>("cs2");
  const [tgtId, setTgtId] = useState<GameId>("valorant");
  const [dpiRaw, setDpiRaw] = useState("800");
  const [tgtDpiRaw, setTgtDpiRaw] = useState("");
  const [sensRaw, setSensRaw] = useState("1");

  const result = useMemo(() => {
    const dpi = Number(dpiRaw.replace(",", "."));
    const sens = Number(sensRaw.replace(",", "."));
    if (!isFinite(dpi) || !isFinite(sens) || dpi <= 0 || sens <= 0) return null;

    const tgtDpiParsed = Number(tgtDpiRaw.replace(",", "."));
    const dpiTarget =
      tgtDpiRaw.trim() !== "" && isFinite(tgtDpiParsed) && tgtDpiParsed > 0
        ? tgtDpiParsed
        : dpi;

    const src = getGame(srcId);
    const tgt = getGame(tgtId);

    const cm360 = (360 * 2.54) / (src.yaw * sens * dpi);
    const edpi = dpi * sens;
    const targetEdpi = src.yaw * sens * dpi;
    const targetSens = targetEdpi / (tgt.yaw * dpiTarget);

    return { cm360, edpi, targetSens, dpiTarget, verdict: getVerdict(cm360) };
  }, [dpiRaw, tgtDpiRaw, sensRaw, srcId, tgtId]);

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(fmt(result.targetSens));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard недоступен */
    }
  };

  const toneCls =
    result === null
      ? ""
      : result.verdict.tone === "warn"
        ? "border-neon/60 shadow-[0_0_20px_rgba(0,229,255,0.15)]"
        : result.verdict.tone === "ok"
          ? "border-volt/60 shadow-[0_0_20px_rgba(198,255,0,0.15)]"
          : "border-neon/60 shadow-[0_0_20px_rgba(0,229,255,0.15)]";

  const swap = () => {
    setSrcId(tgtId);
    setTgtId(srcId);
    setDpiRaw(tgtDpiRaw || dpiRaw);
    setTgtDpiRaw("");
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <section className="card p-6">
          <h2 className="mono mb-1 text-xs uppercase tracking-widest text-dim">Исходная игра</h2>
          <div className="space-y-4">
            <div>
              <label className="mono mb-1.5 block text-xs text-dim">Игра</label>
              <select
                value={srcId}
                onChange={(e) => setSrcId(e.target.value as GameId)}
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
              <label className="mono mb-1.5 block text-xs text-dim">DPI мыши</label>
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
              <label className="mono mb-1.5 block text-xs text-dim">In-game sensitivity</label>
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
        </section>

        <div className="flex items-center justify-center lg:flex-col">
          <button
            onClick={swap}
            aria-label="Поменять игры местами"
            className="glow-volt cursor-pointer rounded-full border border-volt/40 bg-raised px-5 py-4 font-mono text-xl text-volt transition-transform hover:scale-110 lg:rotate-90"
          >
            ⇄
          </button>
        </div>

        <section className="card p-6">
          <h2 className="mono mb-1 text-xs uppercase tracking-widest text-dim">Целевая игра</h2>
          <div className="space-y-4">
            <div>
              <label className="mono mb-1.5 block text-xs text-dim">Игра</label>
              <select
                value={tgtId}
                onChange={(e) => setTgtId(e.target.value as GameId)}
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
              <label className="mono mb-1.5 block text-xs text-dim">
                Требуемая сенса {result && result.dpiTarget !== Number(dpiRaw.replace(",", ".")) ? `(при ${fmt(result.dpiTarget)} DPI)` : ""}
              </label>
              <div
                className={`flex items-center justify-between gap-3 rounded-lg border border-volt/40 bg-raised px-4 py-3 shadow-[0_0_16px_rgba(198,255,0,0.15)]`}
              >
                <span
                  className={`font-mono text-2xl text-volt ${result ? "" : "text-dim"}`}
                >
                  {result ? fmt(result.targetSens) : "—"}
                </span>
                <button
                  onClick={copyResult}
                  disabled={!result}
                  className="mono shrink-0 cursor-pointer rounded-md border border-line px-2 py-1 text-xs text-dim transition-colors hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copied ? "✓ скопировано" : "копировать"}
                </button>
              </div>
            </div>
            <div>
              <label className="mono mb-1.5 block text-xs text-dim">DPI целевой игры</label>
              <input
                type="number"
                min={50}
                step={50}
                value={tgtDpiRaw}
                onChange={(e) => setTgtDpiRaw(e.target.value)}
                placeholder={dpiRaw || "как в исходной"}
                className={inputCls}
              />
            </div>
            <p className="text-xs leading-relaxed text-dim">
              Значение сохраняет ваш физический разгон мышью: расстояние на полный оборот
              останется прежним в обеих играх.
            </p>
          </div>
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="eDPI (исходная)" value={result ? fmt(result.edpi) : "—"} hint="DPI × сенса" />
        <StatCard
          label="cm / 360°"
          value={result ? `${fmt(result.cm360)} см` : "—"}
          hint="путь мыши на полный оборот"
        />
      </section>

      {result && (
        <section className={`card border p-6 ${toneCls}`}>
          <div className="flex flex-wrap items-start gap-4">
            <span className="text-3xl leading-none">{result.verdict.emoji}</span>
            <div className="min-w-64 flex-1">
              <h3 className="font-semibold">{result.verdict.title}</h3>
              <p className="mt-1 text-sm text-dim">{result.verdict.text}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {result.verdict.links.map((l) => (
                <Link key={l.href + l.label} href={l.href} className="chip chip-active hover:opacity-80">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="card p-6 text-sm text-dim">
        <h3 className="mono mb-2 text-xs uppercase tracking-widest text-dim">
          Как считается
        </h3>
        <p className="font-mono leading-relaxed">
          cm/360° = 914.4 / (m_yaw × sens × DPI) ·{" "}
          <span className="text-white">914.4 = 360° × 2.54</span>
        </p>
        <p className="mt-2">
          Целевая сенса: sens₂ = (yaw₁ × sens₁ × DPI₁) / (yaw₂ × DPI₂). Если DPI цели
          отличается от исходного — укажите его в поле «DPI целевой игры», иначе результат
          будет считаться для того же DPI.
        </p>
      </section>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card p-6">
      <h3 className="mono text-xs uppercase tracking-widest text-dim">{label}</h3>
      <p className="mt-2 font-mono text-4xl text-white">{value}</p>
      <p className="mt-1 text-xs text-dim">{hint}</p>
    </div>
  );
}
