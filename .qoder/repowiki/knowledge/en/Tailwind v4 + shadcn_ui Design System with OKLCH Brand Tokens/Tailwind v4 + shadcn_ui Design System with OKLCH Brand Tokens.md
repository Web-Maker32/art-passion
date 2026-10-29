---
kind: frontend_style
name: Tailwind v4 + shadcn/ui Design System with OKLCH Brand Tokens
category: frontend_style
scope:
    - '**'
source_files:
    - app/globals.css
    - components.json
    - app/layout.tsx
    - components/ui/button.tsx
    - package.json
---

## Approach

The storefront uses **Tailwind CSS v4** (via `@tailwindcss/turbopack`) as the styling engine, layered on top of the **shadcn/ui** component system (`shadcn` CLI, style `base-nova`, RSC enabled). The visual identity is driven by **CSS custom properties in OKLCH color space**, with a dedicated brand palette (deep teal `--brand-deep`, gold `--brand-gold`, blush, orchid, silver) and semantic tokens for surfaces, borders, focus rings, shadows, radii, and motion. Animations come from the `tw-animate-css` package plus a set of hand-rolled `@utility` blocks.

## Key Files

- `app/globals.css` — single source of truth for Tailwind imports, theme token declarations, dark-mode overrides, custom utilities (`lift`, `lift-sm`, `press`, `image-zoom`, `cart-count-pop`, `skeleton-shimmer`, `scroll-reveal-*`), focus-visible styles, and `@layer base` resets.
- `components.json` — shadcn configuration: `style: "base-nova"`, `rsc: true`, `tsx: true`, `baseColor: "neutral"`, `cssVariables: true`, aliases mapping `@/components/ui` → `components/ui`.
- `app/layout.tsx` — root layout that injects Google Fonts (`Geist Sans/Mono`, `Cormorant Garamond`) as CSS variables and wraps the app in `next-themes` `ThemeProvider` with `attribute="class"` and `defaultTheme="system"`.
- `components/ui/*.tsx` — shadcn-generated primitive components (button, card, dialog, input, select, table, tabs, sheet, badge, checkbox, dropdown-menu, field, label, separator, skeleton, sonner, textarea).
- `components/storefront/*.tsx` — higher-level storefront composition components (site-header, site-footer, product-card, product-grid, mini-cart, checkout-form, etc.) built on top of `@/components/ui`.
- `package.json` — declares dependencies `tailwindcss ^4.3.3`, `shadcn ^4.22.1`, `@base-ui/react ^1.9.0`, `class-variance-authority ^0.7.1`, `cn ^0.4.0`, `lucide-react ^1.61.0`, `next-themes ^0.4.6`, `sonner ^2.0.8`, `tw-animate-css ^1.4.0`.

## Architecture & Conventions

### Token layering
`globals.css` defines two layers:
1. A `@theme inline { ... }` block that maps design tokens (`--color-brand`, `--color-gold`, `--radius-*`, `--motion-duration`, `--shadow-card`, etc.) to CSS variables so they are available as Tailwind v4 theme values.
2. A `:root` block defining the light-theme variable values, and a `.dark` block overriding them for dark mode. Both use OKLCH colors for perceptual uniformity.

### Theme switching
`next-themes` is used at the root layout level with `attribute="class"`, so toggling themes adds/removes the `.dark` class on `<html>`. The `.dark` selector in `globals.css` provides full token overrides; there is no JS-driven theme logic beyond this.

### Component primitives vs. domain components
- `components/ui/*` are shadcn-generated, framework-agnostic primitives built on `@base-ui/react` primitives and styled via `class-variance-authority` (`cva`) variants for `variant` and `size`. They expose both the component and its `*Variants` type (e.g. `Button`, `buttonVariants`).
- `components/storefront/*` are application-specific compositions that combine UI primitives into pages (product cards, cart controls, checkout form, navigation, footer, WhatsApp float).

### Styling methodology
- Utility-first via Tailwind classes throughout components.
- `class-variance-authority` for variant-based component styling (see `button.tsx` with variants `default|outline|secondary|ghost|destructive|link` and sizes `default|xs|sm|lg|icon|icon-xs|icon-sm|icon-lg`).
- `cn` (from `clsx`/`tailwind-merge` wrapper) merges variant classes with user-supplied className.
- Custom Tailwind utilities defined with `@utility` in `globals.css` and registered via `@source inline(...)` so Tailwind can scan them.
- Global focus-visible behavior centralized in `globals.css` using a broad selector targeting all interactive elements, with gold ring accents for inputs/selectors.

### Typography
Three fonts loaded via `next/font/google` and exposed as CSS variables:
- `--font-geist-sans` / `--font-geist-mono` (sans/mono)
- `--font-cormorant-garamond` (display/headings, weight 500/600/700)
Mapped into the Tailwind theme as `--font-sans`, `--font-mono`, `--font-heading`, `--font-brand-display`.

### Motion & accessibility
- All animations respect `prefers-reduced-motion: reduce` — transforms/animations are disabled in that media query.
- Hover/pointer fine interactions are gated behind `@media (hover: hover) and (pointer: fine)`; coarse pointers get active-state fallbacks.
- Focus-visible outlines use `--focus-ring` (gold-derived) with a 2px solid outline and 2px offset.

### Responsive strategy
No explicit breakpoints are defined in the codebase; responsive behavior relies on Tailwind's default breakpoint scale. Layouts are composed with flexbox (`flex min-h-full flex-col` on body, `flex-1` main content) rather than grid systems.

## Conventions & Constraints

- **All global styles live in `app/globals.css`**; no other CSS files are imported by the app shell.
- **Brand colors are expressed as OKLCH variables** (`--brand`, `--brand-hover`, `--brand-foreground`, `--gold`, `--gold-light`, `--gold-text`, `--blush`, `--orchid`, `--silver`, `--silver-strong`) and referenced through semantic tokens (`--primary`, `--accent`, `--ring`, `--border`, `--input`, `--card`, `--muted`, `--destructive`). Hardcoded color literals appear only in the initial `:root`/`.dark` definitions.
- **Dark mode is implemented purely via CSS selectors** (`.dark` class) driven by `next-themes`; components do not branch on theme state.
- **Component variants follow the shadcn pattern**: each `ui` component exposes a `cva`-based variants object and a typed `VariantProps` union exported alongside the component.
- **Icons are sourced from `lucide-react`** (declared dependency, configured in `components.json` as `iconLibrary: "lucide"`).
- **Motion tokens are centralized**: `--motion-duration` (200ms) and `--motion-easing` (`cubic-bezier(0.22, 1, 0.36, 1)`) are reused across every animation/utility.
- **Accessibility baseline**: `globals.css` applies a universal `border-border outline-ring/50` via `@layer base`, and a focused-link underline style under `#main-content p a[href]`.
- **Prettier + Tailwind plugin**: `prettier-plugin-tailwindcss` is installed (devDependency), so class sorting is enforced by the formatter.