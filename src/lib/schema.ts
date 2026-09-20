import type { Keyboard, Mouse, Mousepad } from "@/lib/types";

export const SITE_URL = "https://gearlab.example";

export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data) };
}

interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.url}`,
    })),
  };
}

function prop(name: string, value: string) {
  return { "@type": "PropertyValuePair", name, value };
}

export function mouseProductJsonLd(mouse: Mouse) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${mouse.brand} ${mouse.name}`,
    brand: { "@type": "Brand", name: mouse.brand },
    category: "Gaming Mouse",
    sku: mouse.slug,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: mouse.priceUsd,
      availability: "https://schema.org/InStock",
    },
    additionalProperty: [
      prop("Sensor", mouse.sensor),
      prop("Max DPI", String(mouse.dpiMax)),
      prop("Weight", `${mouse.weightG} g`),
      prop("Polling rate", `${mouse.pollingHz} Hz`),
      prop("Click latency", `${mouse.clickLatencyMs} ms`),
      prop("Switches", mouse.switches),
      prop("Motion Sync", mouse.motionSync ? "yes" : "no"),
    ],
  };
}

export function mouseItemListJsonLd(list: Mouse[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: list.length,
    itemListElement: list.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${m.brand} ${m.name}`,
      url: `${SITE_URL}${baseUrl}/${m.slug}`,
    })),
  };
}

export function keyboardProductJsonLd(kb: Keyboard) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${kb.brand} ${kb.name}`,
    brand: { "@type": "Brand", name: kb.brand },
    category: "Gaming Keyboard",
    sku: kb.slug,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: kb.priceUsd,
      availability: "https://schema.org/InStock",
    },
    additionalProperty: [
      prop("Layout", kb.layout),
      prop("Switches", kb.switches),
      prop("Actuation force", kb.actuationG ? `${kb.actuationG} g` : "adjustable (magnetic)"),
      prop("Polling rate", `${kb.pollRateHz} Hz`),
      prop("Hall Effect", kb.hallEffect ? "yes" : "no"),
      prop("Rapid Trigger", kb.rapidTrigger ? "yes" : "no"),
      prop("Hot-swap", kb.hotSwap ? "yes" : "no"),
      prop("Mount", kb.mount),
    ],
  };
}

export function padProductJsonLd(pad: Mousepad) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${pad.brand} ${pad.name}`,
    brand: { "@type": "Brand", name: pad.brand },
    category: "Gaming Mousepad",
    sku: pad.slug,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: pad.priceUsd,
      availability: "https://schema.org/InStock",
    },
    additionalProperty: [
      prop("Dynamic friction X", String(pad.dynamicFrictionX)),
      prop("Dynamic friction Y", String(pad.dynamicFrictionY)),
      prop("Static friction X", String(pad.staticFrictionX)),
      prop("Static friction Y", String(pad.staticFrictionY)),
      prop("Surface texture", pad.surfaceTexture),
      prop("Thickness", `${pad.thickness} mm`),
      prop("Stitched edges", pad.stitchedEdges ? "yes" : "no"),
      prop("Base", pad.base),
    ],
  };
}

export function padItemListJsonLd(list: Mousepad[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: list.length,
    itemListElement: list.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${p.brand} ${p.name}`,
      url: `${SITE_URL}${baseUrl}/${p.slug}`,
    })),
  };
}

export interface FaqItem {
  q: string;
  a: string;
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
