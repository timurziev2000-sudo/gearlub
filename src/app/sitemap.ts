import type { MetadataRoute } from "next";
import { facetPages } from "@/data/facets";
import { keyboards } from "@/data/keyboards";
import { mice, pads } from "@/data/gear";
import { SITE_URL } from "@/lib/schema";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const raw: {
    url: string;
    changeFrequency: "daily" | "weekly" | "monthly";
    priority: number;
  }[] = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/my-setup`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/advisor`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/trending`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/new-releases`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/players`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/segments/budget`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/segments/mid`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/segments/mid-plus`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/segments/premium`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/segments/high-end`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/database`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/reviews`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/reviews/methodology`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guides`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/guides/warface-sens`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tools/calculator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/tools/synergy`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/tools/sens-calculator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/database/mice`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/database/keyboards`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/database/pads`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/database/glides`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const staticRoutes: MetadataRoute.Sitemap = raw.map((r) => ({
    ...r,
    lastModified: now,
  }));

  const miceRoutes: MetadataRoute.Sitemap = mice.map((m) => ({
    url: `${SITE_URL}/database/mice/${m.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const keyboardRoutes: MetadataRoute.Sitemap = keyboards.map((k) => ({
    url: `${SITE_URL}/database/keyboards/${k.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const padRoutes: MetadataRoute.Sitemap = pads.map((p) => ({
    url: `${SITE_URL}/database/pads/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const facetRoutes: MetadataRoute.Sitemap = facetPages.map((f) => ({
    url: `${SITE_URL}/database/mice/f/${f.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...miceRoutes, ...keyboardRoutes, ...padRoutes, ...facetRoutes];
}
