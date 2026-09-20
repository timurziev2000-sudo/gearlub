import type {
  GameProfile,
  GlideForm,
  GripStyle,
  PriceTier,
  QuizInput,
  SpecSource,
} from "@/lib/types";

export function gripLabel(g: GripStyle): string {
  const map: Record<GripStyle, string> = {
    palm: "ладонный",
    claw: "когтевой",
    fingertip: "пальцевый",
  };
  return map[g];
}

export function gripList(grips: GripStyle[]): string {
  return grips.map(gripLabel).join(", ");
}

export function kbConnLabel(c: string): string {
  const map: Record<string, string> = {
    wired: "проводная",
    wireless: "беспроводная",
    "tri-mode": "три режима (BT + 2.4 GHz + провод)",
  };
  return map[c] ?? c;
}

export function kbLayoutLabel(l: string): string {
  const map: Record<string, string> = {
    "60%": "60%",
    "65%": "65%",
    "75%": "75%",
    tkl: "TKL",
    full: "полноразмерная",
  };
  return map[l] ?? l;
}

export function surfaceLabel(s: string): string {
  const map: Record<string, string> = {
    speed: "скорость",
    control: "контроль",
    hybrid: "гибрид",
    glass: "стекло",
    silicone: "силикон",
  };
  return map[s] ?? s;
}

export function materialLabel(m: string): string {
  const map: Record<string, string> = {
    ptfe: "чистый PTFE",
    "ptfe-mos2": "PTFE + MoS₂",
    "uhmw-pe": "UHMW-PE",
    glass: "закалённое стекло",
    ceramic: "керамика",
  };
  return map[m] ?? m;
}

export function tierLabel(t: PriceTier): string {
  const map: Record<PriceTier, string> = {
    budget: "бюджетный",
    mid: "средний",
    premium: "премиум",
  };
  return map[t];
}

export function glideFormLabel(f: GlideForm): string {
  const map: Record<GlideForm, string> = {
    "full-size": "полноразмерные под модель",
    dots: "универсальные точки",
    anatomic: "анатомические под модель",
  };
  return map[f];
}

export function profileLabel(p: GameProfile): string {
  const map: Record<GameProfile, string> = {
    "tactical-fps": "тактический шутер",
    "hero-shooter": "hero shooter",
    "battle-royale": "battle royale",
    moba: "MOBA",
    mmo: "MMO",
  };
  return map[p];
}

export function weightLabel(w: QuizInput["weightPref"]): string {
  const map = { ultralight: "ультралёгкий", light: "лёгкий", balanced: "средний", any: "любой" } as const;
  return map[w];
}

export function sensLabel(s: QuizInput["sens"]): string {
  const map = { low: "низкого", medium: "среднего", high: "высокого" } as const;
  return map[s];
}

export function specSourceLabel(s: SpecSource): string {
  const map: Record<SpecSource, string> = {
    official: "официальные данные",
    "user-provided": "данные от пользователя",
    estimated: "требует проверки",
  };
  return map[s];
}
