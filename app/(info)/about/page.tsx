import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Gift,
  HandHeart,
  MapPin,
  MessageCircle,
  Scissors,
  Truck,
} from "lucide-react";
import { Callout } from "@/components/content/callout";
import { Container } from "@/components/storefront/container";
import { Section } from "@/components/storefront/section";
import { Button } from "@/components/ui/button";
import { contentMetadata } from "@/lib/content/metadata";
import { siteConfig } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = contentMetadata({
  title: "About us",
  description:
    "Meet Art Passion, a one-person handmade shop in Pakistan making handmade felt play sets, coloring kits, painting kits and gift sets in small batches by hand.",
  path: "/about",
});

// Only statements already used elsewhere in the shop copy.
const makingSteps = [
  { icon: Scissors, label: "Cut and stitched by hand" },
  { icon: ClipboardCheck, label: "Assembled and checked piece by piece" },
  { icon: Gift, label: "Packed with care" },
  { icon: Truck, label: "Sent from Pakistan" },
] as const;

// Felt-swatch collage standing in for a workspace photo until the owner adds
// one. Pure CSS shapes in brand colours, so it never looks broken.
const feltSwatches = [
  {
    shape: "rounded-full",
    tone: "bg-teal-300 dark:bg-teal-700",
    icon: "text-teal-900 dark:text-teal-100",
  },
  {
    shape: "rounded-3xl rotate-6",
    tone: "bg-gold-light",
    icon: "text-brand-deep",
  },
  { shape: "rounded-3xl -rotate-3", tone: "bg-blush/80", icon: "text-white" },
  { shape: "rounded-full", tone: "bg-orchid/70", icon: "text-white" },
] as const;

export default function AboutPage() {
  const whatsapp = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
    message:
      "Hello Art Passion! I would love to know more about your handmade collection.",
  });

  return (
    <>
      {/* Hero */}
      <section className="border-silver bg-muted/40 border-b">
        <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="text-gold-text text-sm font-semibold tracking-wide uppercase">
              Art Passion
            </p>
            <h1 className="font-heading text-foreground text-h1 mt-3 font-bold text-balance">
              A little about us
            </h1>
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              {siteConfig.storeName} is a small, one-person shop in{" "}
              {siteConfig.country}, making thoughtful pieces for play, making
              and gifting.
            </p>
            <div
              aria-hidden="true"
              className="bg-gold-teal-gradient mt-6 h-0.5 w-14 rounded-full"
            />
          </div>
          <div className="stitch-border border-gold/40 bg-brand-deep shadow-card relative overflow-hidden rounded-[2rem] border">
            <Image
              alt="Art Passion gold emblem: a scripted monogram over a heart-shaped palette on deep teal"
              className="h-full w-full object-cover"
              height={630}
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              src="/og-image.png"
              unoptimized
              width={1200}
            />
          </div>
        </Container>
      </section>

      {/* Story */}
      <Section aria-labelledby="story-heading">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 lg:order-1">
            <div
              aria-hidden="true"
              className="border-silver bg-card shadow-card grid aspect-[4/3] grid-cols-2 gap-5 rounded-[2rem] border p-8 sm:gap-7 sm:p-10"
            >
              {feltSwatches.map(({ shape, tone, icon }, index) => (
                <span
                  className={`stitch-border border-brand-foreground/40 flex items-center justify-center border-2 border-dashed ${shape} ${tone}`}
                  key={index}
                >
                  {index === 0 && <HandHeart className={`size-8 ${icon}`} />}
                  {index === 1 && <Scissors className={`size-8 ${icon}`} />}
                  {index === 2 && <Gift className={`size-8 ${icon}`} />}
                  {index === 3 && <MapPin className={`size-8 ${icon}`} />}
                </span>
              ))}
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              TODO(owner): add a photo of your workspace or products
            </p>
          </div>
          <div className="order-1 lg:order-2">
            <h2
              className="font-heading text-foreground text-h2 font-bold"
              id="story-heading"
            >
              How it started
            </h2>
            <p className="text-muted-foreground mt-4 leading-7">
              Art Passion began with a simple love of making things by hand:
              cutting felt, choosing colours, stitching small details, and
              putting together little kits that invite someone to sit down and
              create.
            </p>
            <blockquote className="border-gold text-foreground font-heading mt-6 border-l-2 pl-5 text-xl leading-8 italic">
              It is still run by one person, from choosing the materials to
              packing the final parcel.
            </blockquote>
            <p className="text-muted-foreground mt-6 leading-7">
              That means every order is handled with care, and every piece gets
              a proper look before it is sent on its way.
            </p>
          </div>
        </Container>
      </Section>

      {/* How the pieces are made */}
      <Section aria-labelledby="making-heading" className="bg-muted/60">
        <Container>
          <h2
            className="font-heading text-foreground text-h2 font-bold"
            id="making-heading"
          >
            How the pieces are made
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
            The felt play sets are cut and stitched by hand. The coloring and
            painting kits are assembled and checked piece by piece. Gift sets
            are packed with the same attention, so they arrive ready to give.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {makingSteps.map(({ icon: Icon, label }, index) => (
              <li
                className="border-silver bg-card shadow-card rounded-3xl border p-5"
                key={label}
              >
                <span className="bg-brand/10 text-brand dark:bg-gold/15 dark:text-gold-light inline-flex size-11 items-center justify-center rounded-2xl">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <p className="text-muted-foreground mt-3 text-xs font-semibold tracking-wide uppercase">
                  Step {index + 1}
                </p>
                <h3 className="text-foreground mt-1 text-base font-semibold">
                  {label}
                </h3>
              </li>
            ))}
          </ol>
          <p className="text-muted-foreground mt-6 leading-7">
            Because everything is handmade in small batches, no two pieces are
            exactly alike. Small differences in stitching, colour or finish are
            normal, and they are part of what makes a handmade item feel
            personal.
          </p>
        </Container>
      </Section>

      {/* Values */}
      <Section aria-labelledby="values-heading">
        <Container>
          <h2 className="sr-only" id="values-heading">
            What we care about
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <section
              aria-labelledby="small-heading"
              className="border-silver bg-card shadow-card h-full rounded-3xl border p-6 sm:p-7"
            >
              <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-12 items-center justify-center rounded-2xl">
                <HandHeart aria-hidden="true" className="size-6" />
              </span>
              <h3
                className="font-heading text-foreground mt-4 text-xl font-semibold"
                id="small-heading"
              >
                Why we keep it small
              </h3>
              <div className="text-muted-foreground mt-3 space-y-3 leading-7">
                <p>
                  Keeping the shop small means there is time to think about the
                  details: soft materials, safe finishes, clear instructions,
                  and packaging that protects the piece on its way to you.
                </p>
                <p>
                  It also means questions are answered by the person who made
                  the item. If you are unsure about an age range, a custom idea
                  or a gift, you can ask directly and get a real answer.
                </p>
              </div>
            </section>
            <section
              aria-labelledby="pakistan-heading"
              className="border-silver bg-card shadow-card h-full rounded-3xl border p-6 sm:p-7"
            >
              <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-12 items-center justify-center rounded-2xl">
                <MapPin aria-hidden="true" className="size-6" />
              </span>
              <h3
                className="font-heading text-foreground mt-4 text-xl font-semibold"
                id="pakistan-heading"
              >
                Made with care, in Pakistan
              </h3>
              <div className="text-muted-foreground mt-3 space-y-3 leading-7">
                <p>
                  Art Passion is proudly based in {siteConfig.country}. Thank
                  you for supporting a small handmade business and the time that
                  goes into each piece.
                </p>
                <p>
                  Every piece is made in small batches and checked by the same
                  person who made it, so each order is handled with care from
                  the first cut to the final parcel.
                </p>
                <p>
                  Orders are delivered across Pakistan, packed with the same
                  attention so the piece arrives ready to play with or to give.
                </p>
              </div>
            </section>
          </div>
          <div className="mt-6">
            <Callout>
              <p>
                Recommended age and safety notes are shown on each product page
                that has them.{" "}
                <Link
                  className="text-foreground font-semibold underline underline-offset-4"
                  href="/products"
                >
                  Browse the collection
                </Link>{" "}
                and check them when choosing a piece.
              </p>
            </Callout>
          </div>
        </Container>
      </Section>

      {/* Closing call to action */}
      <section className="bg-cta-band relative overflow-hidden">
        <Container className="relative flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center lg:py-20">
          <div className="max-w-2xl">
            <p className="text-gold-light text-sm font-semibold tracking-[0.14em] uppercase">
              From our hands to your home
            </p>
            <h2 className="font-heading text-brand-foreground text-h2 mt-3 font-bold text-balance">
              Let&apos;s make something joyful together.
            </h2>
            <p className="text-brand-foreground/85 mt-3 text-lg leading-8">
              Browse the collection or tell us what you have in mind — we love a
              custom idea.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              nativeButton={false}
              render={<Link href="/products" />}
              size="lg"
              variant="gold"
            >
              Shop all
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
            {whatsapp && (
              <Button
                className="border-brand-foreground/40 text-brand-foreground hover:border-gold-light hover:bg-brand-foreground/10 hover:text-brand-foreground dark:hover:bg-brand-foreground/10 bg-transparent dark:bg-transparent"
                nativeButton={false}
                render={
                  <a
                    href={whatsapp}
                    rel="noopener noreferrer"
                    target="_blank"
                  />
                }
                size="lg"
                variant="outline"
              >
                <MessageCircle aria-hidden="true" data-icon="inline-start" />
                Chat on WhatsApp
              </Button>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
