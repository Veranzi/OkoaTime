import Link from "next/link";
import { CheckCircle2, ArrowRight, Phone } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { SEO_PAGES, SITE_URL, type SeoPage } from "@/lib/seo-pages";

// Shared layout for the public, search-targeted service pages
// (/seafood-delivery-lamu, /boat-transport-lamu, ...). Content lives in
// src/lib/seo-pages.ts so copy changes never touch markup.
export default function ServiceLandingPage({ page }: { page: SeoPage }) {
  const url = `${SITE_URL}/${page.slug}`;
  const related = page.related.map((slug) => SEO_PAGES[slug]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ...(page.serviceType
        ? [{
            "@type": "Service",
            "@id": `${url}#service`,
            name: page.h1,
            serviceType: page.serviceType,
            description: page.description,
            url,
            provider: { "@id": `${SITE_URL}/#business` },
            areaServed: ["Lamu Town", "Shela", "Manda Island"].map((name) => ({ "@type": "Place", name })),
          }]
        : []),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: page.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: page.breadcrumb, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-navy to-teal-800 pt-28 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <nav aria-label="Breadcrumb" className="font-josefin text-sm text-navy-200 mb-6">
              <Link href="/" className="hover:text-orange transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{page.breadcrumb}</span>
            </nav>
            <p className="text-orange font-josefin font-semibold uppercase tracking-wider text-sm mb-3">
              {page.eyebrow}
            </p>
            <h1 className="font-outfit font-black text-white text-3xl sm:text-5xl leading-tight mb-5">
              {page.h1}
            </h1>
            <p className="font-josefin text-navy-100 text-lg leading-relaxed max-w-2xl mb-8">
              {page.intro}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={page.cta.href}>
                <Button size="lg" variant="primary">
                  {page.cta.label}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="https://wa.me/254707132823" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary">
                  <Phone className="w-5 h-5" />
                  WhatsApp us
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {page.highlights.map((h) => (
              <div key={h.title} className="bg-gray-50 rounded-2xl p-5 flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-teal flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-outfit font-bold text-navy text-base mb-1">{h.title}</h2>
                  <p className="font-josefin text-gray-600 text-sm leading-relaxed">{h.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Body sections */}
        <section className="bg-white pb-12 px-4">
          <div className="max-w-3xl mx-auto space-y-10">
            {page.sections.map((s) => (
              <div key={s.heading}>
                <h2 className="font-outfit font-bold text-navy text-2xl mb-4">{s.heading}</h2>
                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="font-josefin text-gray-600 leading-relaxed mb-3">{p}</p>
                ))}
                {s.bullets && (
                  <ul className="space-y-2 mt-2">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2 font-josefin text-gray-600">
                        <span className="text-orange font-bold mt-0.5 flex-shrink-0">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-gray-50 py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-outfit font-bold text-navy text-2xl mb-6">Frequently asked questions</h2>
            <div className="space-y-3">
              {page.faqs.map((f) => (
                <details key={f.q} className="bg-white rounded-2xl p-5 group">
                  <summary className="font-outfit font-semibold text-navy cursor-pointer list-none flex justify-between gap-4">
                    {f.q}
                    <span className="text-orange group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="font-josefin text-gray-600 leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related + CTA */}
        <section className="bg-white py-14 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-outfit font-bold text-navy text-xl mb-4">More from OkoaTime</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.slug}`}
                  className="border border-gray-200 rounded-2xl p-4 hover:border-teal hover:shadow-card transition-all"
                >
                  <p className="font-outfit font-semibold text-navy text-sm">{r.breadcrumb}</p>
                  <p className="font-josefin text-gray-500 text-xs mt-1">{r.eyebrow}</p>
                </Link>
              ))}
            </div>
            <div className="bg-navy rounded-3xl p-8 text-center">
              <h2 className="font-outfit font-bold text-white text-2xl mb-3">{page.closing}</h2>
              <Link href={page.cta.href}>
                <Button size="lg" variant="primary">
                  {page.cta.label}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
