export type GripStyle = "palm" | "claw" | "fingertip";

export type Connectivity = "wired" | "wireless" | "hybrid";

export type Shape = "symmetric" | "ergonomic";

export type HandSize = "small" | "medium" | "large" | "universal";

export type GameProfile =
  "tactical-fps" | "hero-shooter" | "battle-royale" | "moba" | "mmo";

export type SurfaceType = "speed" | "control" | "hybrid" | "glass" | "silicone";

export type GlideMaterial =
  "ptfe" | "ptfe-mos2" | "uhmw-pe" | "glass" | "ceramic";

/** Ценовой сегмент устройства. */
export type PriceTier = "budget" | "mid" | "premium";

/** Форма глайдов: комплект под конкретную мышь или универсальные точки. */
export type GlideForm = "full-size" | "dots" | "anatomic";

export interface Mouse {
  slug: string;
  brand: string;
  name: string;
  sensor: string;
  dpiMax: number;
  weightG: number;
  shape: Shape;
  grips: GripStyle[];
  connectivity: Connectivity;
  pollingHz: number;
  motionSync: boolean;
  switches: string;
  clickLatencyMs: number;
  handSize: HandSize;
  priceUsd: number;
  profiles: GameProfile[];
  dimensionsMm?: string;
  batteryMah?: number;
  batteryLifeH?: number;
  coating?: string;
  mcu?: string;
  /** Год выхода модели на рынок. */
  releaseYear?: number;
  /** Происхождение характеристик. */
  specSource?: SpecSource;
  /** Ссылки на производителя или проверенные источники. */
  sources?: SourceLink[];
}

export type FrictionSource = "cisA" | "cisA-proxy" | "estimated";

/** Происхождение характеристик устройства. */
export type SpecSource = "official" | "user-provided" | "estimated";

export interface SourceLink {
  label: string;
  url: string;
}

export interface Mousepad {
  slug: string;
  brand: string;
  name: string;
  surface: SurfaceType;
  thicknessMm: number;
  dynamicFrictionX: number;
  dynamicFrictionY: number;
  staticFrictionX: number;
  staticFrictionY: number;
  surfaceTexture: "smooth" | "textured" | "abrasive" | "glass";
  thickness: number;
  /** Происхождение метрик трения. Определяет, можно ли считать цифры измеренными. */
  frictionSource: FrictionSource;
  /** Для frictionSource: "cisA-proxy" — какая модель из таблицы взята за основу. */
  frictionProxyOf?: string;
  stitchedEdges: boolean;
  base: string;
  priceUsd: number;
  releaseYear?: number;
  sources?: SourceLink[];
}

export interface Glide {
  slug: string;
  brand: string;
  name: string;
  material: GlideMaterial;
  thicknessMm: number;
  diameterMm: number;
  speedIndex: number;
  durabilityIndex: number;
  priceUsd: number;
  /** Ценовой сегмент по позиционированию на рынке. */
  tier?: PriceTier;
  /** Комплект под конкретную мышь или универсальные точки. */
  form?: GlideForm;
  /** Сколько наборов или точек в упаковке. */
  packContents?: string;
  /** Заметка о происхождении или особенностях материала. */
  note?: string;
  /** Происхождение характеристик. */
  specSource?: SpecSource;
  releaseYear?: number;
  sources?: SourceLink[];
}

export type KbLayout = "60%" | "65%" | "75%" | "tkl" | "full";

export type KbConnectivity = "wired" | "wireless" | "tri-mode";

export interface Keyboard {
  slug: string;
  brand: string;
  name: string;
  layout: KbLayout;
  switches: string;
  actuationG: number | null;
  hotSwap: boolean;
  connectivity: KbConnectivity;
  mount: string;
  pollRateHz: number;
  hallEffect: boolean;
  rapidTrigger: boolean;
  priceUsd: number;
  profiles: GameProfile[];
  /** Год выхода на рынок. */
  releaseYear?: number;
  /** Материал корпуса: алюминий, пластик, поликарбонат. */
  caseMaterial?: string;
  /** Поддержка аналогового ввода (SOCD, Snap Tap, rappy snappy и т.п.). */
  analogInput?: boolean;
  /** Происхождение характеристик. */
  specSource?: SpecSource;
  /** Внешние ссылки для проверки характеристик. */
  sources?: SourceLink[];
}

export interface QuizInput {
  profile: GameProfile;
  grip: GripStyle;
  sens: "low" | "medium" | "high";
  weightPref: "ultralight" | "light" | "balanced" | "any";
  budgetUsd: number;
  kbPref: "none" | "he" | "mech";
}

export interface BundleItem {
  slug: string;
  label: string;
  href: string;
  meta: string;
  priceUsd: number;
}

export interface Bundle {
  score: number;
  mouse: BundleItem;
  pad: BundleItem;
  glides: BundleItem;
  keyboard?: BundleItem;
  reasons: string[];
  warnings: string[];
}
