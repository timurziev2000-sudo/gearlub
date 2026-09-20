export type ProGame = "cs2" | "valorant";

export type SpecStatus = "estimated" | "verified";

export interface ProGear {
  mouse?: string;
  mouseSlug?: string;
  keyboard?: string;
  mousepad?: string;
  monitor?: string;
}

export interface ProSettings {
  slug: string;
  player: string;
  team: string | null;
  game: ProGame;
  role: string;
  dpi: number;
  sens: number;
  gear?: ProGear;
  updatedAt: string;
  specSource: SpecStatus;
  sources: { label: string; url: string }[];
  note?: string;
}

// Настройки и девайсы из публичных баз (prosettings.net, specs.gg).
// verified — сверено по источнику в текущем обновлении; estimated —
// требует повторной сверки. Gear заполняется только при наличии
// источника: пустое поле означает «нет данных», а не «не пользуется».
// eDPI = dpi * sens; см/360 считается на странице по yaw игры
// (CS2: 0.022, Valorant: 0.07).
export const proSettings: ProSettings[] = [
  {
    slug: "s1mple",
    player: "s1mple",
    team: "BC.Game",
    game: "cs2",
    role: "AWPer",
    dpi: 400,
    sens: 3.09,
    gear: {
      mouse: "Logitech G Pro X Superlight 2",
      mouseSlug: "logitech-gpro-x2",
    },
    updatedAt: "2026-09",
    specSource: "verified",
    sources: [
      { label: "prosettings.net — s1mple", url: "https://prosettings.net/players/s1mple/" },
      { label: "specs.gg — s1mple", url: "https://specs.gg/s1mple" },
    ],
    note: "После ухода из NAVI играет за BC.Game. Мышь — Superlight 2 по данным prosettings (август 2026).",
  },
  {
    slug: "zywoo",
    player: "ZywOo",
    team: "Team Vitality",
    game: "cs2",
    role: "AWPer",
    dpi: 400,
    sens: 2.0,
    gear: {
      mouse: "Pulsar ZywOo the Chosen",
      keyboard: "ASUS ROG Falchion Ace HFX ZywOo Edition",
      monitor: "ZOWIE XL2586X+",
    },
    updatedAt: "2026-09",
    specSource: "estimated",
    sources: [
      { label: "prosettings.net — ZywOo", url: "https://prosettings.net/players/zywoo/" },
      { label: "specs.gg — ZywOo", url: "https://specs.gg/ZywOo" },
    ],
    note: "Сигнатурная мышь Pulsar и коллаборация с ASUS — по данным specs.gg (сентябрь 2026). Настройки 400/2.0 — по многолетней публичной истории, требуют свежей сверки.",
  },
  {
    slug: "monesy",
    player: "m0NESY",
    team: "Falcons",
    game: "cs2",
    role: "AWPer",
    dpi: 400,
    sens: 3.0,
    gear: {
      mouse: "Logitech G Pro X Superlight 2",
      mouseSlug: "logitech-gpro-x2",
    },
    updatedAt: "2026-09",
    specSource: "estimated",
    sources: [
      { label: "prosettings.net — m0NESY", url: "https://prosettings.net/players/monesy/" },
      {
        label: "prosettings.net — статистика девайсов",
        url: "https://prosettings.net/gear/stats/",
      },
    ],
    note: "Мышь подтверждена статистикой девайсов prosettings (Superlight 2 — топ среди про). Настройки требуют свежей сверки.",
  },
  {
    slug: "niko",
    player: "NiKo",
    team: "Falcons",
    game: "cs2",
    role: "Rifler",
    dpi: 400,
    sens: 1.55,
    updatedAt: "2026-09",
    specSource: "estimated",
    sources: [
      { label: "prosettings.net — NiKo", url: "https://prosettings.net/players/niko/" },
    ],
    note: "Девайсы и настройки требуют свежей сверки.",
  },
  {
    slug: "donk",
    player: "donk",
    team: "Team Spirit",
    game: "cs2",
    role: "Rifler",
    dpi: 800,
    sens: 1.25,
    gear: {
      mouse: "ZOWIE x donk (сигнатурная, ещё не в продаже)",
    },
    updatedAt: "2026-09",
    specSource: "verified",
    sources: [
      { label: "prosettings.net — donk", url: "https://prosettings.net/players/donk/" },
      { label: "specs.gg — donk", url: "https://specs.gg/donk" },
    ],
    note: "Обновлено 31.08.2026: ZOWIE готовит сигнатурную мышь под donk. До выхода модели в базе она не появится.",
  },
  {
    slug: "scream",
    player: "ScreaM",
    team: null,
    game: "cs2",
    role: "Rifler",
    dpi: 500,
    sens: 2.4,
    updatedAt: "2026-09",
    specSource: "estimated",
    sources: [
      { label: "prosettings.net — ScreaM", url: "https://prosettings.net/players/scream/" },
    ],
    note: "Легенда CS, сейчас вне активных составов. Классический пример высокой сенсы. Девайсы требуют сверки.",
  },
  {
    slug: "tenz",
    player: "TenZ",
    team: "Sentinels",
    game: "valorant",
    role: "Duelist",
    dpi: 800,
    sens: 0.4,
    updatedAt: "2026-09",
    specSource: "estimated",
    sources: [
      { label: "prosettings.net — TenZ", url: "https://prosettings.net/players/tenz/" },
    ],
    note: "Девайсы и настройки требуют свежей сверки.",
  },
  {
    slug: "asuna",
    player: "Asuna",
    team: "100 Thieves",
    game: "valorant",
    role: "Duelist",
    dpi: 800,
    sens: 0.35,
    updatedAt: "2026-09",
    specSource: "estimated",
    sources: [
      { label: "prosettings.net — Asuna", url: "https://prosettings.net/players/asuna/" },
    ],
    note: "Девайсы и настройки требуют свежей сверки.",
  },
  {
    slug: "cned",
    player: "cNed",
    team: "Natus Vincere",
    game: "valorant",
    role: "Controller",
    dpi: 800,
    sens: 0.348,
    updatedAt: "2026-09",
    specSource: "estimated",
    sources: [
      { label: "prosettings.net — cNed", url: "https://prosettings.net/players/cned/" },
    ],
    note: "Известен одной из самых низких сенс в Valorant. Девайсы требуют сверки.",
  },
];

// Yaw (градусов на инч*0.022-подобный коэффициент) для расчёта cm/360.
// CS2 (Source): 0.022. Valorant: 0.07 (его sens ≈ CS/3.18 при том же DPI).
export const gameYaw: Record<ProGame, number> = {
  cs2: 0.022,
  valorant: 0.07,
};

export function edpiOf(p: ProSettings): number {
  return Math.round(p.dpi * p.sens * 100) / 100;
}

export function cmPer360Of(p: ProSettings): number {
  const inches = 360 / (gameYaw[p.game] * p.dpi * p.sens);
  return Math.round(inches * 2.54 * 10) / 10;
}
