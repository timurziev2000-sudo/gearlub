export type ReviewSourceKind = "reddit" | "youtube" | "manufacturer";

export interface ReviewSource {
  slug: string;
  title: string;
  device: string;
  category: "mouse" | "mousepad" | "keyboard";
  kind: ReviewSourceKind;
  url: string;
  note: string;
  checkedOn: string;
}

// These are research links, not GearLab tests. Do not turn search results into factual claims.
export const reviewSources: ReviewSource[] = [
  {
    slug: "scyrox-v8-research",
    title: "Scyrox V8: внешний research-поиск",
    device: "Scyrox V8",
    category: "mouse",
    kind: "reddit",
    url: "https://www.reddit.com/r/MouseReview/search/?q=Scyrox%20V8&restrict_sr=1",
    note: "Обсуждения формы, веса, прошивки и стабильности беспроводного режима.",
    checkedOn: "2026-08-27",
  },
  {
    slug: "beast-x-max-research",
    title: "WLMouse Beast X Max: внешний research-поиск",
    device: "WLMouse Beast X Max",
    category: "mouse",
    kind: "reddit",
    url: "https://www.reddit.com/r/MouseReview/search/?q=WLmouse%20Beast%20X%20Max&restrict_sr=1",
    note: "Обсуждения корпуса, формы, веса и пользовательского опыта.",
    checkedOn: "2026-08-27",
  },
  {
    slug: "artisan-type99-research",
    title: "Artisan Type99: внешний research-поиск",
    device: "Artisan Type99 XSoft",
    category: "mousepad",
    kind: "reddit",
    url: "https://www.reddit.com/r/MousepadReview/search/?q=Artisan%20Type99&restrict_sr=1",
    note: "Обсуждения контроля, износа поверхности и совместимости с разными глайдами.",
    checkedOn: "2026-08-27",
  },
  {
    slug: "wooting-80he-research",
    title: "Wooting 80HE: внешний research-поиск",
    device: "Wooting 80HE",
    category: "keyboard",
    kind: "youtube",
    url: "https://www.youtube.com/results?search_query=Wooting+80HE+review",
    note: "Поиск независимых обзоров корпуса, Rapid Trigger и программного обеспечения.",
    checkedOn: "2026-08-27",
  },
  {
    slug: "lgg-saturn-research",
    title: "LGG Saturn: внешний research-поиск",
    device: "Lethal Gaming Gear Saturn",
    category: "mousepad",
    kind: "youtube",
    url: "https://www.youtube.com/results?search_query=LGG+Saturn+mousepad+review",
    note: "Поиск обзоров поверхности, базы и поведения после износа.",
    checkedOn: "2026-08-27",
  },
];
