import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/storefront/scroll-reveal";

export function SectionHeading({
  title,
  description,
  eyebrow,
  headingId,
  href,
  linkLabel = "Explore all",
  level = 2,
  align = "left",
}: {
  title: string;
  description?: string;
  /** Small gold label shown above the title. */
  eyebrow?: string;
  headingId?: string;
  href?: string;
  linkLabel?: string;
  /** 1 when the heading is the page title, 2 inside a section. */
  level?: 1 | 2;
  align?: "left" | "center";
}) {
  const Heading = level === 1 ? "h1" : "h2";
  const centered = align === "center";

  return (
    <ScrollReveal>
      <div
        className={`mb-8 flex flex-col justify-between gap-3 min-[640px]:flex-row min-[640px]:items-end ${
          centered ? "text-center min-[640px]:flex-col min-[640px]:items-center" : ""
        }`}
      >
        <div className={`min-w-0 ${centered ? "max-w-2xl" : ""}`}>
          {eyebrow && (
            <p className="text-gold-text mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
              <span
                aria-hidden="true"
                className="bg-gold inline-block size-1.5 rounded-full"
              />
              {eyebrow}
            </p>
          )}
          <Heading
            className={`font-heading text-foreground font-bold tracking-tight ${
              level === 1 ? "text-h1" : "text-h2"
            }`}
            id={headingId}
          >
            {title}
          </Heading>
          {description && (
            <p
              className={`text-muted-foreground mt-3 text-base leading-relaxed ${
                centered ? "mx-auto max-w-2xl" : "max-w-2xl"
              }`}
            >
              {description}
            </p>
          )}
        </div>
        {href && (
          <Link
            className="group text-foreground hover:text-brand focus-visible:outline-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-sm px-2 font-semibold underline-offset-4 transition-colors duration-interaction hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 min-[640px]:self-auto"
            href={href}
          >
            {linkLabel}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
            />
          </Link>
        )}
      </div>
    </ScrollReveal>
  );
}
