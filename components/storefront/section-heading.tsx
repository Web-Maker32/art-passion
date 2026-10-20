import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/storefront/scroll-reveal";

export function SectionHeading({
  title,
  description,
  headingId,
  href,
  linkLabel = "Explore all",
}: {
  title: string;
  description?: string;
  headingId?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <ScrollReveal>
      <div className="mb-6 flex flex-col justify-between gap-2 min-[640px]:flex-row min-[640px]:items-end">
        <div className="min-w-0">
          <h2
            className="font-heading text-foreground text-2xl font-bold tracking-tight sm:text-3xl"
            id={headingId}
          >
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
          )}
        </div>
        {href && (
          <Link
            className="group text-foreground focus-visible:outline-ring inline-flex min-h-11 shrink-0 items-center gap-1 self-start rounded-sm px-2 font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 min-[640px]:self-auto"
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
