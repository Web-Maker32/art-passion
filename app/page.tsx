import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, Sparkles } from "lucide-react";
import { Container } from "@/components/storefront/container";
import { Logo } from "@/components/logo";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { getPublishedCategories } from "@/lib/queries/categories";
import { categoryDescriptions } from "@/lib/queries/categories";
import { getPublishedProducts } from "@/lib/queries/products";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Art Passion",
  logo: new URL(
    "/logo-badge.png",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).toString(),
};

export default async function Home() {
  const [categories, allProducts] = await Promise.all([
    getPublishedCategories(),
    getPublishedProducts(),
  ]);
  const featuredProducts = allProducts.slice(0, 4);
  const newArrivals = allProducts.slice(4, 8);
  const whatsapp = buildWhatsAppLink({
    number: process.env.WHATSAPP_NUMBER,
    message:
      "Hello Art Passion! I would love to know more about your handmade collection.",
  });

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <section className="bg-brand-hero">
        <Container className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div className="max-w-2xl">
            <p className="bg-brand/30 text-brand-foreground inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold">
              <Sparkles aria-hidden="true" className="text-gold-light size-4" />
              Handmade in Pakistan, made to be treasured
            </p>
            <h1 className="font-heading text-brand-foreground mt-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Little things,
              <br />
              made with love.
            </h1>
            <p className="text-brand-foreground/90 mt-5 max-w-xl text-lg leading-8">
              Discover soft felt play sets, joyful art kits, and thoughtful
              handmade gifts for life&apos;s creative moments.
            </p>
            <Link
              className="group bg-gold text-header-teal hover:bg-gold-light focus-visible:outline-brand-foreground mt-8 inline-flex min-h-12 items-center gap-2 rounded-md px-6 py-3 font-bold lift-sm press focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/products"
            >
              Shop now
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
              />
            </Link>
          </div>
          <div className="bg-brand/35 relative z-30 mx-auto flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-[2rem] border border-white/25 p-8 shadow-2xl lg:mx-0 lg:aspect-[4/3] lg:max-w-none">
            <Logo priority size={260} variant="gold" />
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="categories-heading"
        className="py-14 lg:py-20"
        id="categories"
      >
        <Container>
          <SectionHeading
            description="A little something for every kind of maker and dreamer."
            href="/products"
            headingId="categories-heading"
            title="Find your kind of handmade"
          />
          <ul className="grid gap-4 p-2 sm:grid-cols-3">
            {categories.map((category, index) => (
              <li key={category.id}>
                <Link
                  className={`group relative z-30 flex h-full min-h-48 flex-col justify-between rounded-2xl border border-silver p-6 shadow-card lift hover:border-brand-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:border-brand-gold ${
                    index === 0
                      ? "bg-brand text-brand-foreground"
                      : index === 1
                        ? "bg-gold-light text-brand"
                        : "bg-muted text-foreground"
                  }`}
                  href={`/categories/${category.slug}`}
                >
                  <span className="text-sm font-semibold tracking-wide uppercase">
                    {category._count.products} lovely finds
                  </span>
                  <span>
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-heading block text-2xl font-bold">
                        {category.name}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-5 shrink-0 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
                      />
                    </span>
                    <span className="mt-2 block text-sm opacity-90">
                      {categoryDescriptions[category.slug] ??
                        "Thoughtfully handmade for you."}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-muted/70 py-14 lg:py-20">
        <Container>
          <SectionHeading
            description="Customer favourites, thoughtfully made in small batches."
            href="/products"
            title="Made with love"
          />
          <ProductGrid
            emptyMessage="Our handmade collection is being prepared. Please come back soon."
            emptyTitle="New treasures are on the way"
            products={featuredProducts}
          />
        </Container>
      </section>

      {newArrivals.length > 0 && (
        <section className="py-14 lg:py-20">
          <Container>
            <SectionHeading
              description="Freshly added pieces from our little craft table."
              href="/products?sort=newest"
              title="New arrivals"
            />
            <ProductGrid products={newArrivals} />
          </Container>
        </section>
      )}

      <section className="bg-brand text-brand-foreground">
        <Container className="grid gap-6 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-gold-light text-sm font-semibold tracking-wide uppercase">
              From our hands to your home
            </p>
            <h2 className="font-heading mt-2 text-2xl font-bold sm:text-3xl">
              Handmade with care, made to bring joy.
            </h2>
            <p className="text-brand-foreground/85 mt-2 max-w-2xl">
              Every piece is made thoughtfully, with care in the details and
              plenty of room for imagination.
            </p>
          </div>
          <Heart
            aria-hidden="true"
            className="text-gold-light hidden size-12 md:block"
          />
        </Container>
      </section>

      <section className="py-14 lg:py-20">
        <Container>
          <div className="border-silver bg-gold-light/50 relative z-30 flex flex-col items-start justify-between gap-6 rounded-2xl border p-6 sm:p-8 md:flex-row md:items-center">
            <div>
              <h2 className="font-heading text-foreground text-2xl font-bold">
                Need a hand choosing?
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Tell us what you have in mind. We are happy to help you find a
                lovely gift or talk about a custom piece.
              </p>
            </div>
            {whatsapp ? (
              <a
                className="bg-brand text-brand-foreground hover:bg-brand-hover focus-visible:outline-ring inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md px-5 py-3 font-semibold lift-sm press focus-visible:outline-2 focus-visible:outline-offset-2"
                href={whatsapp}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle aria-hidden="true" className="size-5" />
                Chat with us
              </a>
            ) : (
              <Link
                className="bg-brand text-brand-foreground hover:bg-brand-hover focus-visible:outline-ring inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md px-5 py-3 font-semibold lift-sm press focus-visible:outline-2 focus-visible:outline-offset-2"
                href="/contact"
              >
                Contact us
              </Link>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
