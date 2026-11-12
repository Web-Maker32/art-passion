"use client";

/**
 * Last-resort error boundary: replaces the root layout, so it must be fully
 * self-contained — its own html/body, inline styles, no shared CSS, fonts or
 * component imports. Brand colours are inlined (teal #0f4a47, gold #c9a24b).
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" style={{ colorScheme: "light dark" }}>
      <head>
        <title>Something went wrong | Art Passion</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          :root {
            --ap-bg: #f8f5ee;
            --ap-fg: #1f2e2c;
            --ap-muted: #52605e;
            --ap-brand: #0f4a47;
            --ap-brand-fg: #ffffff;
            --ap-gold: #c9a24b;
            --ap-border: #cfc9ba;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ap-bg: #0a2523;
              --ap-fg: #ece7db;
              --ap-muted: #a8b5b2;
              --ap-brand: #1d5c58;
              --ap-brand-fg: #ffffff;
              --ap-gold: #e6c875;
              --ap-border: #33514e;
            }
          }
          .ap-btn { transition: filter 200ms ease-out, box-shadow 200ms ease-out; }
          .ap-btn:hover { filter: brightness(1.08); }
          .ap-btn:active { filter: brightness(0.96); }
          .ap-btn:focus-visible, .ap-link:focus-visible {
            outline: 2px solid var(--ap-gold);
            outline-offset: 2px;
          }
          @media (prefers-reduced-motion: reduce) {
            .ap-btn { transition: none; }
          }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
          fontFamily: "system-ui, sans-serif",
          background: "var(--ap-bg)",
          color: "var(--ap-fg)",
        }}
      >
        <main role="alert" style={{ maxWidth: "32rem", width: "100%", textAlign: "center" }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "color-mix(in srgb, var(--ap-gold) 20%, transparent)",
              color: "var(--ap-gold)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <h1 style={{ margin: "20px 0 0", fontSize: "1.875rem", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            We couldn&rsquo;t load this page
          </h1>
          <p style={{ margin: "16px auto 0", maxWidth: "28rem", lineHeight: 1.7, color: "var(--ap-muted)" }}>
            Please try again. If the problem continues, come back in a few minutes.
          </p>
          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button
              className="ap-btn"
              onClick={retry}
              type="button"
              style={{
                minHeight: 48,
                padding: "0 20px",
                border: "none",
                borderRadius: 10,
                background: "var(--ap-brand)",
                color: "var(--ap-brand-fg)",
                fontSize: "1rem",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces the root layout, so the router may be unavailable and a plain anchor is required */}
            <a
              className="ap-btn ap-link"
              href="/"
              style={{
                minHeight: 48,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 20px",
                border: "1px solid var(--ap-border)",
                borderRadius: 10,
                color: "var(--ap-fg)",
                fontSize: "1rem",
                fontWeight: 600,
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Back to the shop
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}