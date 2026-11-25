/**
 * Targeted pre-launch visual spot check against an own production build on
 * port 3100. Reuses the audit library (overflow, contrast, tap targets,
 * heading order, WhatsApp overlap). Run:
 *   pnpm exec tsx --env-file=.env.local e2e/visual-spot.ts
 */
import { createHmac } from "node:crypto";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { collectPageAudit, issueSummary, type PageAudit } from "./audit-lib";

const baseURL = "http://localhost:3100";
const audits: PageAudit[] = [];
const notes: string[] = [];

async function contextFor(
  browser: Browser,
  width: number,
  theme: "light" | "dark",
  storageState?: Awaited<ReturnType<BrowserContext["storageState"]>>,
): Promise<BrowserContext> {
  const coarse = width <= 412;
  const context = await browser.newContext({
    baseURL,
    viewport: { width, height: coarse ? 800 : 900 },
    colorScheme: theme,
    hasTouch: coarse,
    isMobile: coarse,
    storageState,
  });
  await context.addInitScript({
    content:
      "globalThis.__name = (target, value) => Object.defineProperty(target, 'name', { value, configurable: true });",
  });
  await context.addInitScript(
    (value) => localStorage.setItem("theme", value),
    theme,
  );
  return context;
}

async function auditRoutes(
  browser: Browser,
  width: number,
  theme: "light" | "dark",
  routes: ReadonlyArray<readonly [string, string]>,
  storageState?: Awaited<ReturnType<BrowserContext["storageState"]>>,
): Promise<void> {
  const context = await contextFor(browser, width, theme, storageState);
  const page = await context.newPage();
  for (const [name, route] of routes) {
    try {
      const audit = await collectPageAudit(page, route, width, theme);
      audits.push(audit);
      console.info(
        `${width}/${theme} ${name}: ${audit.issues.length} issues, ${audit.consoleErrors.length} console errors`,
      );
      for (const issue of audit.issues)
        console.info(`   - ${issue.area}: ${issue.detail}`);
      for (const error of audit.consoleErrors)
        console.info(`   - console: ${error}`);
    } catch (error) {
      console.info(
        `${width}/${theme} ${name}: RUNNER ERROR ${error instanceof Error ? error.message.slice(0, 200) : "unknown"}`,
      );
    }
  }
  await context.close();
}

/**
 * Admin credentials live in the database (bcrypt), not in env, and the pass
 * must not write to the DB. Mint a short-lived session cookie for the existing
 * ADMIN user with the app's own signing scheme (read-only query) so the admin
 * pages can be audited visually.
 */
async function mintAdminSession(context: BrowserContext): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const connectionString = process.env.DATABASE_URL;
  if (!secret || !connectionString) {
    notes.push(
      "admin checks skipped: ADMIN_SESSION_SECRET/DATABASE_URL not in environment",
    );
    return false;
  }
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, sessionVersion: true },
    });
    if (!admin) {
      notes.push("admin checks skipped: no ADMIN user in database");
      return false;
    }
    const payload = Buffer.from(
      JSON.stringify({
        userId: admin.id,
        sessionVersion: admin.sessionVersion,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24,
      }),
      "utf8",
    ).toString("base64url");
    const signature = createHmac("sha256", secret)
      .update(`admin-session:${payload}`)
      .digest("hex");
    await context.addCookies([
      {
        name: "ap_admin_session",
        value: `${payload}.${signature}`,
        domain: "localhost",
        path: "/admin",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkFloat(browser: Browser): Promise<void> {
  const context = await contextFor(browser, 390, "light");
  const page = await context.newPage();
  const float = page.locator("a[aria-label='Message us on WhatsApp']");
  for (const [route, expected] of [
    ["/", true],
    ["/about", true],
    ["/products", true],
    ["/cart", false],
    ["/checkout", false],
    ["/contact", false],
    ["/track-order", false],
  ] as const) {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const visible = await float.isVisible().catch(() => false);
    const ok = visible === expected;
    notes.push(
      `float ${route}: ${visible ? "visible" : "hidden"} ${ok ? "OK" : "UNEXPECTED"}`,
    );
    if (visible) {
      const label = await float.innerText();
      notes.push(`float label on ${route}: ${JSON.stringify(label.trim())}`);
    }
  }
  await context.close();
}

async function checkAdminToggles(page: Page): Promise<void> {
  await page.goto("/admin", { waitUntil: "networkidle" });
  const emptyChart = await page
    .getByText("No orders in the last 14 days")
    .first()
    .isVisible()
    .catch(() => false);
  notes.push(`dashboard chart empty state visible: ${emptyChart}`);
  const chip = page.getByRole("button", { name: "Show cancelled" });
  const before = await chip.getAttribute("aria-pressed");
  await chip.click();
  await page
    .waitForURL(/showCancelled=1/, { timeout: 10_000 })
    .catch(() => undefined);
  const after = await page
    .getByRole("button", { name: "Show cancelled" })
    .getAttribute("aria-pressed");
  notes.push(
    `show cancelled chip aria-pressed: ${before} -> ${after} (url ${page.url()})`,
  );
  await page.goto("/admin/orders", { waitUntil: "networkidle" });
  const reset = page.getByRole("link", { name: "Reset", exact: true });
  const resetBorder = await reset
    .evaluate((element) => getComputedStyle(element).borderTopWidth)
    .catch(() => "n/a");
  notes.push(
    `orders Reset border-top-width: ${resetBorder} (outline expected > 0px)`,
  );
  const tabs = page.locator("nav[aria-label='Filter orders by status']");
  notes.push(
    `orders status tabs present: ${await tabs.isVisible().catch(() => false)}`,
  );
  await page.goto("/admin/categories", { waitUntil: "networkidle" });
  const rename = page.getByRole("button", { name: "Rename" }).first();
  const renameBorder = await rename
    .evaluate((element) => getComputedStyle(element).borderTopWidth)
    .catch(() => "n/a");
  notes.push(
    `categories Rename border-top-width: ${renameBorder} (outline expected > 0px)`,
  );
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  try {
    const publicRoutes = [
      ["home", "/"],
      ["shop", "/products"],
      ["cart", "/cart"],
      ["search", "/search?q=felt"],
      ["about", "/about"],
      ["contact", "/contact"],
      ["faq", "/faq"],
      ["shipping-returns", "/shipping-and-returns"],
      ["track-order", "/track-order"],
    ] as const;
    await auditRoutes(browser, 360, "light", publicRoutes);
    await auditRoutes(browser, 390, "dark", publicRoutes);
    await auditRoutes(browser, 412, "light", publicRoutes);
    await auditRoutes(browser, 1280, "light", [
      ["shop", "/products"],
      ["cart", "/cart"],
      ["about", "/about"],
    ]);
    await auditRoutes(browser, 1280, "dark", [
      ["home", "/"],
      ["shop", "/products"],
      ["contact", "/contact"],
    ]);
    await checkFloat(browser);

    const adminContext = await contextFor(browser, 1280, "light");
    if (await mintAdminSession(adminContext)) {
      const adminPage = await adminContext.newPage();
      await checkAdminToggles(adminPage);
      const storageState = await adminContext.storageState();
      await auditRoutes(
        browser,
        1280,
        "light",
        [
          ["admin-dashboard", "/admin"],
          ["admin-products", "/admin/products"],
          ["admin-orders", "/admin/orders"],
          ["admin-categories", "/admin/categories"],
          ["admin-product-new", "/admin/products/new"],
        ],
        storageState,
      );
      await auditRoutes(
        browser,
        1280,
        "dark",
        [
          ["admin-dashboard", "/admin"],
          ["admin-orders", "/admin/orders"],
        ],
        storageState,
      );
      await auditRoutes(
        browser,
        768,
        "light",
        [
          ["admin-dashboard", "/admin"],
          ["admin-products", "/admin/products"],
        ],
        storageState,
      );
    }
    await adminContext.close();

    console.info("\nSUMMARY", JSON.stringify(issueSummary(audits)));
    console.info("NOTES\n" + notes.join("\n"));
    const bad = audits.reduce(
      (total, audit) =>
        total + audit.issues.length + audit.consoleErrors.length,
      0,
    );
    console.info(`TOTAL issue count: ${bad}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
