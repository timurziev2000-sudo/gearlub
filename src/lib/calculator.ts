import { glides, mice, pads } from "@/data/gear";
import { keyboards } from "@/data/keyboards";
import {
  gripLabel,
  kbConnLabel,
  materialLabel,
  profileLabel,
  sensLabel,
  surfaceLabel,
  weightLabel,
} from "@/lib/labels";
import {
  avgDynamic,
  fmtFriction,
  glideSpeedIndex,
  speedClass,
  speedClassLabel,
} from "@/lib/friction";
import type {
  Bundle,
  BundleItem,
  GameProfile,
  Glide,
  Keyboard,
  Mouse,
  Mousepad,
  QuizInput,
} from "@/lib/types";

const profileWeightPref: Record<GameProfile, QuizInput["weightPref"]> = {
  "tactical-fps": "light",
  "hero-shooter": "light",
  "battle-royale": "balanced",
  moba: "any",
  mmo: "any",
};

function scoreMouse(mouse: Mouse, input: QuizInput, mouseBudget: number): number {
  let score = 40;

  if (mouse.profiles.includes(input.profile)) score += 25;

  const pref = input.weightPref === "any" ? profileWeightPref[input.profile] : input.weightPref;
  if (pref === "ultralight" && mouse.weightG <= 45) score += 15;
  else if (pref === "ultralight" && mouse.weightG <= 55) score += 8;
  if (pref === "light" && mouse.weightG <= 60) score += 12;
  if (pref === "balanced" && mouse.weightG > 55 && mouse.weightG <= 80) score += 12;

  if (mouse.grips.includes(input.grip)) score += 12;
  if (mouse.pollingHz >= 2000) score += 5;
  if (mouse.clickLatencyMs <= 1.0) score += 4;

  const budgetFactor = mouse.priceUsd / Math.max(mouseBudget, 1);
  if (budgetFactor > 1) score -= Math.min(35, (budgetFactor - 1) * 45);

  return Math.max(5, Math.min(99, score));
}

function scoreKeyboard(kb: Keyboard, input: QuizInput): number {
  let score = 35;
  if (kb.profiles.includes(input.profile)) score += 25;
  if (input.kbPref === "he") {
    if (kb.hallEffect && kb.rapidTrigger) score += 25;
    else if (kb.hallEffect) score += 10;
    else score -= 10;
  }
  if (input.kbPref === "mech" && !kb.hallEffect) score += 20;
  if (input.kbPref === "mech" && kb.hotSwap) score += 8;
  if (kb.pollRateHz >= 8000) score += 4;
  return Math.max(5, Math.min(99, score));
}

function pickPads(input: QuizInput): Mousepad[] {
  return [...pads].sort((a, b) => {
    const rank = (p: Mousepad) => {
      let r = 0;
      if (input.sens === "low") {
        if (p.surface === "control") r += 3;
        if (p.surface === "hybrid") r += 2;
        if (p.thicknessMm >= 4) r += 1;
      }
      if (input.sens === "medium") {
        if (p.surface === "hybrid") r += 3;
        if (p.surface === "speed" || p.surface === "control") r += 1;
      }
      if (input.sens === "high") {
        if (p.surface === "speed") r += 3;
        if (p.surface === "hybrid") r += 2;
      }
      if ((input.profile === "moba" || input.profile === "mmo") && p.priceUsd < 30) r += 2;
      if (p.priceUsd <= input.budgetUsd * 0.35) r += 1;
      return r;
    };
    return rank(b) - rank(a);
  });
}

function pickGlides(pad: Mousepad, glideSpeedTarget: number): Glide[] {
  return [...glides]
    .map((g) => ({ g, d: Math.abs(g.speedIndex - glideSpeedTarget) }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.g);
}

function padNoteForGlides(pad: Mousepad): string | null {
  if (pad.surface === "glass")
    return "Стеклянный коврик: обычный чистый PTFE стирается за 2–4 недели — берите стеклянные или керамические глайды.";
  if (pad.surface === "silicone")
    return "Силиконовая поверхность агрессивна к PTFE — рекомендованы glass/ceramic слайдеры.";
  return null;
}

export function buildBundles(input: QuizInput, limit = 3): Bundle[] {
  const includeKb = input.kbPref !== "none";
  const mouseBudget = includeKb
    ? Math.max(40, Math.round(input.budgetUsd * 0.55))
    : input.budgetUsd;

  const rankedMice = [...mice]
    .map((m) => ({ m, s: scoreMouse(m, input, mouseBudget) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit * 2);

  const rankedPads = pickPads(input).slice(0, 6);
  const bundles: Bundle[] = [];

  for (let i = 0; i < limit; i++) {
    const mouseEntry = rankedMice[i];
    if (!mouseEntry) continue;
    const mouse = mouseEntry.m;

    const pad =
      rankedPads.find((p) => !bundles.some((b) => b.pad.slug === p.slug)) ?? rankedPads[0];

    const padGlideIndex = glideSpeedIndex(pad);

    const targetSpeed =
      input.sens === "low"
        ? Math.max(30, 100 - padGlideIndex - 10)
        : input.sens === "high"
          ? Math.min(98, padGlideIndex + 20)
          : padGlideIndex + 8;

    const glideList = pickGlides(pad, targetSpeed);
    const compatibleGlides =
      pad.surface === "glass" || pad.surface === "silicone"
        ? glideList.filter(
            (g) => g.material === "glass" || g.material === "ceramic",
          )
        : glideList.filter((g) => g.material !== "glass" || pad.surface !== "control");
    const glide = compatibleGlides[0] ?? glideList[0];

    const warnings: string[] = [];
    const note = padNoteForGlides(pad);
    if (note) warnings.push(note);
    if (input.sens === "low" && mouse.pollingHz === 8000)
      warnings.push("8000 Hz почти не дают выгоды на low sens, но нагружают CPU — можно оставить 1000 Hz.");
    if (glide.material === "ptfe" && pad.surface === "glass" && glide.durabilityIndex < 70)
      warnings.push("Чистый PTFE на стекле изнашивается быстро.");

    const reasons: string[] = [
      `${mouse.sensor} с motion sync ${mouse.motionSync ? "есть" : "отсутствует"} — стабильный tracking для профиля «${profileLabel(input.profile)}».`,
      `Вес ${mouse.weightG} г соответствует предпочтению «${weightLabel(prefOf(input))}»; ${gripLabel(input.grip)} хват поддержан формой (${mouse.shape === "symmetric" ? "симметричная" : "эргономичная"}).`,
      `Коврик ${pad.name}: поверхность «${surfaceLabel(pad.surface)}» подобрана под ${sensLabel(input.sens)} sens (динамика ${fmtFriction(avgDynamic(pad))}, ${speedClassLabel(speedClass(pad))}).`,
      `Глайды ${glide.brand} ${glide.name}: материал ${materialLabel(glide.material)}, толщина ${glide.thicknessMm} мм — баланс скорости и контроля под выбранную связку.`,
    ];

    let keyboard: Keyboard | undefined;
    if (includeKb) {
      const pool = keyboards.filter((k) =>
        input.kbPref === "he" ? k.hallEffect : !k.hallEffect,
      );
      const spent = mouse.priceUsd + pad.priceUsd + glide.priceUsd;
      const kbCap = Math.max(25, input.budgetUsd - spent);
      const scored = pool
        .map((k) => ({ k, s: scoreKeyboard(k, input) }))
        .sort((a, b) => b.s - a.s);
      const found = scored.find((x) => x.k.priceUsd <= kbCap);
      keyboard = (found ?? scored[0])?.k;
      if (keyboard) {
        if (keyboard.priceUsd > kbCap)
          warnings.push(
            `Клавиатура выходит за бюджет: не хватает $${keyboard.priceUsd - kbCap} — поднимите ползунок или возьмите вариант дешевле.`,
          );
        if (input.kbPref === "he")
          reasons.push(
            `${keyboard.brand} ${keyboard.name}: магнитные свичи${keyboard.rapidTrigger ? " с Rapid Trigger" : ""} — приоритет для ${profileLabel(input.profile)} (мгновенная регистрация отпускания).`,
          );
        else
          reasons.push(
            `${keyboard.brand} ${keyboard.name}: механика${keyboard.hotSwap ? " с hot-swap" : ""}, ${kbConnLabel(keyboard.connectivity)} — универсальный вариант под профиль «${profileLabel(input.profile)}».`,
          );
      }
    }

    if (includeKb && !keyboard)
      warnings.push("Подходящей клавиатуры в базе не найдено.");

    const bundle: Bundle = {
      score: mouseEntry.s,
      mouse: toItem(`/database/mice/${mouse.slug}`, `${mouse.brand} ${mouse.name}`, mouse, `${mouse.sensor} · ${mouse.weightG} г · ${mouse.pollingHz} Hz`),
      pad: toItem(`/database/pads/${pad.slug}`, `${pad.brand} ${pad.name}`, pad, `${surfaceLabel(pad.surface)} · ${pad.thicknessMm} мм`),
      glides: toItem(`/database/glides/${glide.slug}`, `${glide.brand} ${glide.name}`, glide, `${materialLabel(glide.material)} · ${glide.thicknessMm} мм`),
      reasons,
      warnings,
    };
    if (keyboard)
      bundle.keyboard = toItem(
        `/database/keyboards/${keyboard.slug}`,
        `${keyboard.brand} ${keyboard.name}`,
        keyboard,
        `${keyboard.hallEffect ? "Hall Effect" : "механика"} · ${kbConnLabel(keyboard.connectivity)}`,
      );
    bundles.push(bundle);
  }

  return bundles.sort((a, b) => b.score - a.score);
}

function toItem<T extends { slug: string; priceUsd: number }>(
  href: string,
  label: string,
  item: T,
  meta: string,
): BundleItem {
  return { slug: item.slug, label, href, meta, priceUsd: item.priceUsd };
}

function prefOf(input: QuizInput): QuizInput["weightPref"] {
  return input.weightPref === "any" ? profileWeightPref[input.profile] : input.weightPref;
}
