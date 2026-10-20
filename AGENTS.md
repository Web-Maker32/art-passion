<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI effects

- Tokens and utilities live in `app/globals.css` and must be reused instead of duplicated in components.
- Motion tokens: `--motion-duration: 200ms`, `--motion-easing: cubic-bezier(0.22, 1, 0.36, 1)`, and the card shadow tokens are defined in the theme variables.
- Reusable utilities: `lift`, `lift-sm`, `press`, `image-zoom`, `cart-count-pop`, `skeleton-shimmer`, `scroll-reveal-pending`, and `scroll-reveal-enter`.
- Hover and press effects apply only on hover-capable devices using the `hover-fine` variant; touch devices keep pressed feedback only.
- Reduced-motion rules disable lifts, zooms, and animations while preserving color and border changes only.
- Focus states use a 2px gold ring with a 2px offset on links, buttons, inputs, and custom controls.
- Dark mode is part of the design system. New pages and components must use the existing CSS variables and theme tokens instead of hard-coded colors.
