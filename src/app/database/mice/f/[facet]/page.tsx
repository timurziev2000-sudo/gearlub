import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { facetPages, getFacet } from "@/data/facets";
import { mice } from "@/data/gear";
import { MouseCard } from "@/components/MouseCard";
import {
  SITE_URL,
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLd,
  mouseItemListJsonLd,
} from "@/lib/schema";

export function generateStaticParams() {
  return facetPages.map((f) => ({ facet: f.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/database/mice/f/[facet]">): Promise<Metadata> {
  const { facet } = await params;
  const page = getFacet(facet);
  if (!page) return {};
  return { title: page.title, description: page.description };
}

export default async function FacetPage(props: PageProps<"/database/mice/f/[facet]">) {
  const { facet } = await props.params;
  const page = getFacet(facet);
  if (!page) notFound();

  const list = mice.filter(page.predicate);
  const crumbs = [
    { name: "Главная", url: "/" },
    { name: "База данных", url: "/database" },
    { name: "Мыши", url: "/database/mice" },
    { name: page.h1, url: `/database/mice/f/${page.slug}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd(crumbs))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(mouseItemListJsonLd(list, "/database/mice"))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(page.faqs))} />

      <nav className="mono mb-6 text-xs text-dim">
        <Link href="/database" className="hover:text-white">База данных</Link>
        {" / "}
        <Link href="/database/mice" className="hover:text-white">Мыши</Link>
      </nav>

      <h1 className="text-3xl font-bold">{page.h1}</h1>
      <div className="mt-4 max-w-3xl space-y-3 text-dim">
        {page.intro.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <p className="mono mt-8 mb-4 text-sm text-dim">
        Моделей в подборке: <span className="text-volt">{list.length}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => (
          <MouseCard key={m.slug} mouse={m} />
        ))}
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="mb-4 text-xl font-semibold">FAQ</h2>
        <div className="space-y-2">
          {page.faqs.map((f) => (
            <details key={f.q} className="card p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-dim">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {page.related.length > 0 && (
        <section className="mt-12">
          <h2 className="mono mb-3 text-xs uppercase tracking-widest text-dim">Смежные подборки</h2>
          <div className="flex flex-wrap gap-1.5">
            {page.related.map((slug) => {
              const rel = getFacet(slug);
              if (!rel) return null;
              return (
                <Link
                  key={slug}
                  href={`/database/mice/f/${rel.slug}`}
                  className="chip hover:border-volt/50"
                >
                  {rel.h1}
                </Link>
              );
            })}
          </div>
          <p className="mono mt-6 text-xs text-dim">
            Источник данных: {SITE_URL}
          </p>
        </section>
      )}
    </div>
  );
}
