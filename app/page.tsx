import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brush,
  Gift,
  HandHeart,
  MessageCircle,
  Palette,
  Shapes,
  Sparkles,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/storefront/container";
import { Section } from "@/components/storefront/section";
import { Logo } from "@/components/logo";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ScrollReveal } from "@/components/storefront/scroll-reveal";
import { SectionHeading } from "@/components/storefront/section-heading";
import { getPublishedCategories } from "@/lib/queries/categories";
import { getPublishedProducts } from "@/lib/queries/products";
import { storeCategories } from "@/lib/catalog";
import { buildStoreJsonLd } from "@/lib/seo/json-ld";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { deliveryInfoLine, siteConfig } from "@/lib/site-config";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";

// Title and description come from the root layout defaults, which describe the
// home page. Only the canonical has to be stated here.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const categoryIcons = {
  "felt-sets": Shapes,
  "coloring-kits": Palette,
  "painting-kits": Brush,
  "gift-sets": Gift,
} as const;

// Each collection gets its own brand treatment: solid teal, solid gold, a clean
// card and a soft teal tint. Pink/orchid stay tiny accents elsewhere.
const categoryTones = [
  {
    card: "bg-brand text-brand-foreground border-transparent",
    icon: "bg-white/15 text-gold-light",
    desc: "text-brand-foreground/85",
    meta: "text-gold-light",
  },
  {
    card: "bg-gold-light text-brand-deep border-transparent",
    icon: "bg-brand/10 text-brand",
    desc: "text-brand-deep/80",
    meta: "text-brand",
  },
  {
    card: "bg-card text-card-foreground border-silver",
    icon: "bg-gold/20 text-gold-text dark:text-gold-light",
    desc: "text-muted-foreground",
    meta: "text-brand dark:text-gold-light",
  },
  {
    card: "bg-teal-50 text-teal-950 border-teal-200 dark:bg-teal-900/40 dark:text-teal-50 dark:border-teal-700",
    icon: "bg-teal-600/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-200",
    desc: "text-teal-800/80 dark:text-teal-100/80",
    meta: "text-teal-700 dark:text-teal-200",
  },
] as const;

const trustPoints = [
  {
    icon: HandHeart,
    title: "Handmade with care",
    body: "Every piece is made by hand in small batches, with attention to the little details.",
  },
  {
    icon: Truck,
    title: "Flat, honest delivery",
    body: deliveryInfoLine,
  },
  {
    icon: Wallet,
    title: "Pay with Easypaisa",
    body: "Send payment from your phone with Easypaisa, then share your transaction ID.",
  },
  {
    icon: MessageCircle,
    title: "Friendly WhatsApp support",
    body: "Questions or a custom idea? Message us and we will help you choose.",
  },
] as const;

const primaryButton =
  "group bg-gold text-header-teal hover:bg-gold-light focus-visible:outline-brand-foreground inline-flex min-h-12 items-center gap-2 rounded-xl px-6 py-3 font-bold lift-sm press focus-visible:outline-2 focus-visible:outline-offset-2";

const creamButton =
  "inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/40 px-6 py-3 font-semibold text-brand-foreground transition-colors duration-interaction hover:border-gold-light hover:bg-white/10 focus-visible:outline-gold-light focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function Home() {
  const [categories, allProducts] = await Promise.all([
    getPublishedCategories(),
    getPublishedProducts(),
  ]);
  const countBySlug = new Map(
    categories.map((category) => [category.slug, category._count.products]),
  );
  const featuredProducts = allProducts.slice(0, 4);
  const newArrivals = allProducts.slice(4, 8);
  const whatsapp = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
    message:
      "Hello Art Passion! I would love to know more about your handmade collection.",
  });

  return (
    <StorefrontChrome>
      <div>
        <JsonLd data={buildStoreJsonLd()} />

        {/* Hero */}
        <section className="bg-brand-hero relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="bg-gold-light/20 float-slow absolute -top-12 right-[6%] size-44 rounded-full blur-3xl" />
            <span className="bg-blush/15 float-slower absolute bottom-[8%] left-[3%] size-36 rounded-full blur-3xl" />
            <Star className="text-gold-light/70 twinkle absolute top-[18%] left-[12%] size-5" />
            <Sparkles className="text-gold-light/60 twinkle absolute right-[16%] bottom-[22%] size-6 [animation-delay:1.2s]" />
          </div>
          <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div className="max-w-2xl">
              <p className="text-brand-foreground inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                <Sparkles aria-hidden="true" className="text-gold-light size-4" />
                Handmade in Pakistan · Made to be treasured
              </p>
              <h1 className="font-heading text-brand-foreground text-display mt-6 font-bold text-balance">
                Little things
                <br />
                made with <span className="text-gold-light italic">love.</span>
              </h1>
              <p className="text-brand-foreground/90 mt-6 max-w-xl text-lg leading-8">
                Discover soft felt play sets, joyful art kits, and thoughtful
                handmade gifts for life&apos;s creative moments.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link className={primaryButton} href="/products">
                  Shop now
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
                  />
                </Link>
                <Link className={creamButton} href="/categories/gift-sets">
                  <Gift aria-hidden="true" className="size-4" />
                  Explore gift sets
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="bg-brand/35 stitch-border glow-gold relative z-10 mx-auto flex aspect-square items-center justify-center overflow-hidden rounded-[2.5rem] p-8 lg:aspect-[4/3] lg:p-12">
                <Logo
                  className="h-auto w-full max-w-[260px]"
                  priority
                  size={260}
                  variant="gold"
                />
              </div>
              <span
                aria-hidden="true"
                className="bg-gold-light float-slow absolute -top-5 -right-2 size-10 rotate-12 rounded-2xl opacity-80 sm:-right-4"
              />
              <span
                aria-hidden="true"
                className="bg-blush float-slower absolute -bottom-4 -left-3 size-8 rounded-full opacity-70"
              />
              <Star
                aria-hidden="true"
                className="text-gold-light twinkle absolute top-8 -left-4 size-6 sm:-left-7"
              />
            </div>
          </Container>
        </section>

        {/* Categories */}
        <Section aria-labelledby="categories-heading" id="categories">
          <Container>
            <SectionHeading
              description="A little something for every kind of maker and dreamer."
              eyebrow="Browse by collection"
              headingId="categories-heading"
              href="/products"
              linkLabel="Shop all"
              title="Find your kind of handmade"
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {storeCategories.map((category, index) => {
                const Icon =
                  categoryIcons[category.slug as keyof typeof categoryIcons] ??
                  Shapes;
                const tone = categoryTones[index % categoryTones.length];
                const count = countBySlug.get(category.slug);
                return (
                  <li key={category.slug}>
                    <ScrollReveal className="h-full">
                      <Link
                        className={`group relative z-30 flex h-full min-h-52 flex-col rounded-3xl border p-6 shadow-card motion-safe:lift hover-fine:hover:border-brand-gold focus-visible:border-brand-gold ${tone.card}`}
                        href={`/categories/${category.slug}`}
                      >
                        <span
                          className={`inline-flex size-12 items-center justify-center rounded-2xl ${tone.icon}`}
                        >
                          <Icon aria-hidden="true" className="size-6" />
                        </span>
                        <h3 className="font-heading mt-5 text-2xl font-bold">
                          {category.name}
                        </h3>
                        <span className={`mt-2 block text-sm leading-relaxed ${tone.desc}`}>
                          {category.description}
                        </span>
                        <span
                          className={`mt-auto flex items-center justify-between gap-2 pt-5 text-sm font-semibold ${tone.meta}`}
                        >
                          {count && count > 0
                            ? `${count} lovely ${count === 1 ? "find" : "finds"}`
                            : "Explore the collection"}
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 shrink-0 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
                          />
                        </span>
                      </Link>
                    </ScrollReveal>
                  </li>
                );
              })}
            </ul>
          </Container>
        </Section>

        {/* Featured products */}
        <Section className="bg-muted/60">
          <Container>
            <SectionHeading
              description="Thoughtfully made in small batches, ready to bring a little joy."
              eyebrow="Customer favourites"
              href="/products"
              linkLabel="Shop all"
              title="Made with love"
            />
            <ProductGrid
              emptyMessage="Our handmade collection is being prepared. Please come back soon."
              emptyTitle="New treasures are on the way"
              products={featuredProducts}
            />
          </Container>
        </Section>

        {/* New arrivals */}
        {newArrivals.length > 0 && (
          <Section>
            <Container>
              <SectionHeading
                description="Recently added pieces, still warm from our craft table."
                eyebrow="Just landed"
                href="/products?sort=newest"
                linkLabel="See what's new"
                title="New arrivals"
              />
              <ProductGrid products={newArrivals} />
            </Container>
          </Section>
        )}

        {/* Why Art Passion */}
        <Section aria-labelledby="why-heading" className="bg-muted/60">
          <Container>
            <SectionHeading
              align="center"
              description="The things we promise on every single order."
              eyebrow="Why Art Passion"
              headingId="why-heading"
              title="Small shop, big care"
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustPoints.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <ScrollReveal className="h-full">
                    <div className="h-full rounded-3xl border border-silver bg-card p-6 shadow-card motion-safe:lift-sm">
                      <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-12 items-center justify-center rounded-2xl">
                        <Icon aria-hidden="true" className="size-6" />
                      </span>
                      <h3 className="font-heading text-card-foreground mt-4 text-lg font-semibold">
                        {title}
                      </h3>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </ScrollReveal>
                </li>
              ))}
            </ul>
          </Container>
        </Section>

        {/* Closing call to action */}
        <section className="bg-cta-band relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <Sparkles className="text-gold-light/60 twinkle absolute top-8 right-[10%] size-6" />
            <Star className="text-gold-light/50 twinkle absolute bottom-8 left-[8%] size-5 [animation-delay:0.8s]" />
          </div>
          <Container className="relative flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center lg:py-20">
            <div className="max-w-2xl">
              <p className="text-gold-light text-sm font-semibold tracking-[0.14em] uppercase">
                From our hands to your home
              </p>
              <h2 className="font-heading text-brand-foreground text-h2 mt-3 font-bold text-balance">
                Let&apos;s make something joyful together.
              </h2>
              <p className="text-brand-foreground/85 mt-3 text-lg leading-8">
                Browse the collection or tell us what you have in mind — we love
                a custom idea.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link className={primaryButton} href="/products">
                Shop all
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
                />
              </Link>
              {whatsapp ? (
                <a
                  className={creamButton}
                  href={whatsapp}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
                  Chat on WhatsApp
                </a>
              ) : (
                <Link className={creamButton} href="/contact">
                  Contact us
                </Link>
              )}
            </div>
          </Container>
        </section>
      </div>
    </StorefrontChrome>
  );
}