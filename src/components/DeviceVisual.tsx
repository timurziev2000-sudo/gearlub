import type { Keyboard, Mouse, Mousepad } from "@/lib/types";
import { avgDynamic } from "@/lib/friction";

/**
 * Схематичные визуалы устройств. Это не фотографии конкретных моделей,
 * а генерируемые силуэты: пропорции и акценты выводятся из характеристик.
 * Так карточки получают картинку без риска использовать чужие фото.
 */

const VOLT = "#C6FF00";
const NEON = "#00E5FF";

function Frame({
  children,
  ratio = "16 / 9",
  label,
}: {
  children: React.ReactNode;
  ratio?: string;
  label: string;
}) {
  return (
    <div
      className="scan-host relative flex items-center justify-center rounded-lg border border-line bg-raised"
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={label}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(38,38,54,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(38,38,54,0.6) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      {children}
    </div>
  );
}

/** Силуэт мыши: ширина корпуса зависит от формы, скос — от эргономики. */
export function MouseVisual({ mouse }: { mouse: Mouse }) {
  const ergo = mouse.shape === "ergonomic";
  const bodyWidth = ergo ? 46 : 40;
  const accent = mouse.weightG <= 45 ? VOLT : NEON;
  const label = `Схема мыши ${mouse.brand} ${mouse.name}: ${
    ergo ? "эргономичная" : "симметричная"
  } форма, ${mouse.weightG} г`;

  return (
    <Frame label={label}>
      <svg viewBox="0 0 120 90" className="relative h-full w-full p-4">
        <defs>
          <linearGradient id={`mg-${mouse.slug}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f1f2c" />
            <stop offset="100%" stopColor="#141420" />
          </linearGradient>
        </defs>

        <path
          d={
            ergo
              ? `M60 8 C ${60 + bodyWidth / 2} 8, ${60 + bodyWidth / 2} 34, ${60 + bodyWidth / 2 - 2} 58 C ${60 + bodyWidth / 2 - 4} 76, 60 82, 60 82 C 60 82, ${60 - bodyWidth / 2 + 6} 76, ${60 - bodyWidth / 2 + 2} 58 C ${60 - bodyWidth / 2} 34, ${60 - bodyWidth / 2} 8, 60 8 Z`
              : `M60 8 C ${60 + bodyWidth / 2} 8, ${60 + bodyWidth / 2} 36, ${60 + bodyWidth / 2} 58 C ${60 + bodyWidth / 2} 76, 60 82, 60 82 C 60 82, ${60 - bodyWidth / 2} 76, ${60 - bodyWidth / 2} 58 C ${60 - bodyWidth / 2} 36, ${60 - bodyWidth / 2} 8, 60 8 Z`
          }
          fill={`url(#mg-${mouse.slug})`}
          stroke={accent}
          strokeOpacity="0.55"
          strokeWidth="1.2"
        />

        {/* Разделение основных кнопок */}
        <line x1="60" y1="10" x2="60" y2="38" stroke={accent} strokeOpacity="0.35" strokeWidth="1" />

        {/* Колесо */}
        <rect x="57" y="16" width="6" height="12" rx="3" fill={accent} fillOpacity="0.75" />

        {/* Сенсор: пульсирует, если есть motion sync */}
        <circle
          cx="60"
          cy="60"
          r="3.4"
          fill={accent}
          className={mouse.motionSync ? "anim-pulse-glow" : ""}
        />

        {mouse.pollingHz >= 8000 && (
          <text x="60" y="88" textAnchor="middle" fontSize="7" fill={VOLT} fontFamily="monospace">
            8K
          </text>
        )}
      </svg>
    </Frame>
  );
}

/** Визуал коврика: плотность штриховки отражает измеренное трение. */
export function PadVisual({ pad }: { pad: Mousepad }) {
  const dyn = avgDynamic(pad);
  const isGlass = pad.surfaceTexture === "glass";
  const density = Math.max(3, Math.min(11, Math.round(dyn / 2.4)));
  const accent = isGlass ? NEON : dyn >= 23 ? VOLT : NEON;
  const label = `Схема коврика ${pad.brand} ${pad.name}: ${
    isGlass ? "стеклянная" : "тканевая"
  } поверхность, средняя динамика ${dyn.toFixed(2)}`;

  return (
    <Frame label={label} ratio="16 / 9">
      <svg viewBox="0 0 160 90" className="relative h-full w-full p-4">
        <rect
          x="6"
          y="10"
          width="148"
          height="70"
          rx={pad.stitchedEdges ? 6 : 3}
          fill="#15151f"
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="1.2"
          strokeDasharray={pad.stitchedEdges ? "4 3" : undefined}
        />

        {isGlass ? (
          <>
            <path d="M14 74 L60 16" stroke={NEON} strokeOpacity="0.35" strokeWidth="6" />
            <path d="M42 74 L88 16" stroke={NEON} strokeOpacity="0.18" strokeWidth="10" />
          </>
        ) : (
          Array.from({ length: density }).map((_, i) => (
            <line
              key={i}
              x1={12 + i * (136 / density)}
              y1="14"
              x2={12 + i * (136 / density)}
              y2="76"
              stroke={accent}
              strokeOpacity={0.06 + (dyn - 15) / 90}
              strokeWidth="1"
            />
          ))
        )}

        {/* Направление осей X/Y: подчёркивает анизотропию */}
        <g stroke={VOLT} strokeOpacity="0.7" strokeWidth="1.2">
          <line x1="20" y1="66" x2="40" y2="66" />
          <line x1="20" y1="66" x2="20" y2="48" />
        </g>
        <text x="43" y="69" fontSize="7" fill={VOLT} fontFamily="monospace">
          X
        </text>
        <text x="15" y="45" fontSize="7" fill={VOLT} fontFamily="monospace">
          Y
        </text>
      </svg>
    </Frame>
  );
}

const layoutKeys: Record<Keyboard["layout"], number> = {
  "60%": 14,
  "65%": 15,
  "75%": 16,
  tkl: 17,
  full: 20,
};

/** Визуал клавиатуры: число колонок соответствует форм-фактору. */
export function KeyboardVisual({ kb }: { kb: Keyboard }) {
  const cols = layoutKeys[kb.layout];
  const rows = kb.layout === "60%" ? 5 : 6;
  const accent = kb.hallEffect ? VOLT : NEON;
  const label = `Схема клавиатуры ${kb.brand} ${kb.name}: ${kb.layout}, ${
    kb.hallEffect ? "магнитные Hall Effect свичи" : "механические свичи"
  }`;

  const keyW = 150 / cols;
  const keyH = 52 / rows;

  return (
    <Frame label={label} ratio="16 / 9">
      <svg viewBox="0 0 160 90" className="relative h-full w-full p-4">
        <rect
          x="4"
          y="16"
          width="152"
          height="58"
          rx="4"
          fill="#15151f"
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="1.2"
        />
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <rect
              key={`${r}-${c}`}
              x={6 + c * keyW + 0.6}
              y={18 + r * keyH + 0.6}
              width={keyW - 1.4}
              height={keyH - 1.4}
              rx="1"
              fill={accent}
              fillOpacity={r === rows - 1 && c > 2 && c < cols - 3 ? 0.05 : 0.14}
            />
          )),
        )}
        {kb.rapidTrigger && (
          <text x="80" y="86" textAnchor="middle" fontSize="7" fill={VOLT} fontFamily="monospace">
            RAPID TRIGGER
          </text>
        )}
      </svg>
    </Frame>
  );
}
