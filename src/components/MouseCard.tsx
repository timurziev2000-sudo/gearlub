import Link from "next/link";
import { MouseVisual } from "@/components/DeviceVisual";
import { FavoriteButton } from "@/components/FavoriteButton";
import { gripLabel } from "@/lib/labels";
import type { Mouse } from "@/lib/types";

export function MouseCard({ mouse }: { mouse: Mouse }) {
  const specs: [string, string][] = [
    ["сенсор", mouse.sensor],
    ["вес", `${mouse.weightG} г`],
    ["polling", `${mouse.pollingHz} Hz`],
    ["латентность", `${mouse.clickLatencyMs} ms`],
  ];

  return (
    <article className="card card-hover anim-fade-up group relative flex flex-col p-5">
      {/* Кнопка избранного вне ссылки: иначе клик уводит со страницы. */}
      <div className="absolute right-4 top-4 z-10">
        <FavoriteButton kind="mouse" slug={mouse.slug} />
      </div>

      <Link href={`/database/mice/${mouse.slug}`} className="flex flex-1 flex-col">
        <MouseVisual mouse={mouse} />

        <div className="mt-4 flex items-start justify-between gap-3 pr-8">
          <h3 className="text-[15px] font-semibold leading-snug transition-colors group-hover:text-volt">
            {mouse.brand} {mouse.name}
          </h3>
          <span className="mono shrink-0 text-sm font-bold text-volt">
            ${mouse.priceUsd}
          </span>
        </div>

        <dl className="mono mt-4 space-y-1 text-[11px]">
          {specs.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-faint">{label}</dt>
              <dd className="truncate text-dim">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
          {mouse.grips.map((g) => (
            <span key={g} className="badge-muted">
              {gripLabel(g)}
            </span>
          ))}
          {mouse.motionSync && <span className="badge-updated">sync</span>}
          {mouse.pollingHz >= 8000 && <span className="badge-new">8K</span>}
        </div>
      </Link>
    </article>
  );
}