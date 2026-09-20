import type { Metadata } from "next";
import Link from "next/link";
import {
  cmPer360Of,
  edpiOf,
  proSettings,
  type ProGame,
} from "@/data/pros";
import { SITE_URL, jsonLd } from "@/lib/schema";
import { ProSensCompare } from "@/components/ProSensCompare";

export const metadata: Metadata = {
  title: "Sens и eDPI про-игроков CS2 и Valorant — GearLab",
  description:
    "Настройки сенсы про-игроков: DPI, внутриигровая сенса, eDPI и см/360 в один клик. CS2 и Valorant. Все записи со ссылками на источники и датой сверки.",
};

const gameLabels: Record<ProGame, string> = {
  cs2: "Counter-Strike 2",
  valorant: "Valorant",
};

export default function PlayersPage() {
  const games: ProGame[] = ["cs2", "valorant"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Sens и eDPI про-игроков",
          url: `${SITE_URL}/players`,
        })}
      />

      <p className="mono text-xs uppercase tracking-widest text-neon">pro settings</p>
      <h1 className="anim-fade-up mt-2 text-3xl font-bold sm:text-4xl">Sens про-игроков</h1>
      <p className="anim-fade-up mt-4 max-w-2xl leading-relaxed text-dim">
        Публичные настройки игроков: DPI, сенса, eDPI и дистанция на 360°. eDPI = DPI × сенса,
        см/360 считается по yaw конкретной игры. Введите свои настройки в калькуляторе ниже —
        увидите, насколько ваша сенса быстрее или медленнее каждой. Для перевода сенсы между
        играми есть{" "}
        <Link href="/tools/sens-calculator" className="text-neon hover:underline">
          sens-конвертер
        </Link>
        .
      </p>

      <div className="anim-fade-up mono mt-4 flex flex-wrap gap-2 text-xs">
        <span className="chip chip-active">{proSettings.length} игроков</span>
        {games.map((g) => (
          <span key={g} className="chip">
            {gameLabels[g]}: {proSettings.filter((p) => p.game === g).length}
          </span>
        ))}
      </div>

      <div className="card anim-fade-up mt-6 p-5 text-sm leading-relaxed text-dim">
        <p className="mono mb-2 text-xs uppercase tracking-widest text-volt">
          статус данных
        </p>
        <p>
          Статусы: <span className="text-fg">verified</span> — сверено по источнику в текущем
          обновлении; остальные записи требуют повторной сверки — игроки меняют настройки чаще,
          чем характеристики устройств. У каждой карточки — ссылки на источники и дата обновления.
          Девайсы указаны только при наличии источника.
        </p>
      </div>

      <ProSensCompare players={proSettings} />

      {games.map((game) => {
        const list = proSettings.filter((p) => p.game === game);
        if (list.length === 0) return null;
        return (
          <section key={game} className="mt-10">
            <h2 className="mono mb-4 text-xs uppercase tracking-widest text-dim">
              {gameLabels[game]}
            </h2>
            <div className="stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <article key={p.slug} className="card p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold">{p.player}</h3>
                    <div className="flex items-center gap-2">
                      {p.specSource === "verified" && (
                        <span className="mono rounded bg-volt px-1.5 py-0.5 text-[10px] font-bold text-bg">
                          verified
                        </span>
                      )}
                      <span className="mono text-xs text-volt">{p.role}</span>
                    </div>
                  </div>
                  <p className="mono mt-0.5 text-xs text-faint">
                    {p.team ?? "без команды"}
                  </p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-neon">{edpiOf(p)}</span>
                    <span className="mono text-xs text-dim">eDPI</span>
                  </div>

                  <dl className="mono mt-3 space-y-1 text-xs text-dim">
                    <div className="flex justify-between">
                      <dt>DPI</dt>
                      <dd className="text-fg">{p.dpi}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Сенса</dt>
                      <dd className="text-fg">{p.sens}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>см/360</dt>
                      <dd className="text-fg">{cmPer360Of(p)} см</dd>
                    </div>
                  </dl>

                  {p.gear && (
                    <div className="mt-4 border-t border-dim pt-3">
                      <p className="mono mb-2 text-[10px] uppercase tracking-widest text-faint">
                        девайсы
                      </p>
                      <ul className="space-y-1 text-xs text-dim">
                        {p.gear.mouse && (
                          <li>
                            <span className="text-faint">Мышь: </span>
                            {p.gear.mouseSlug ? (
                              <Link
                                href={`/database/mice/${p.gear.mouseSlug}`}
                                className="text-neon hover:underline"
                              >
                                {p.gear.mouse}
                              </Link>
                            ) : (
                              p.gear.mouse
                            )}
                          </li>
                        )}
                        {p.gear.keyboard && (
                          <li>
                            <span className="text-faint">Клавиатура: </span>
                            {p.gear.keyboard}
                          </li>
                        )}
                        {p.gear.mousepad && (
                          <li>
                            <span className="text-faint">Коврик: </span>
                            {p.gear.mousepad}
                          </li>
                        )}
                        {p.gear.monitor && (
                          <li>
                            <span className="text-faint">Монитор: </span>
                            {p.gear.monitor}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {p.note && <p className="mt-3 text-xs leading-relaxed text-dim">{p.note}</p>}

                  <div className="mono mt-4 flex items-center justify-between text-[11px] text-faint">
                    <span>обновлено {p.updatedAt}</span>
                    <a
                      href={p.sources[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-volt transition-colors hover:text-fg"
                    >
                      источник ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
