export function InfoPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-sm font-semibold tracking-wide text-gold-text uppercase">
        Art Passion
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{intro}</p>
      <div className="mt-10 space-y-8">
        {sections.map(({ heading, body }) => (
          <section key={heading}>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {heading}
            </h2>
            <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
