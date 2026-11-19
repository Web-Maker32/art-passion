import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { chromium, request, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { collectPageAudit, issueSummary, type PageAudit } from "./audit-lib";

const baseURL = "http://localhost:3000";
const artifacts = path.resolve("e2e/artifacts");
mkdirSync(artifacts, { recursive: true });
const mode = process.argv.find((argument) => argument.startsWith("--mode="))?.split("=")[1] ?? "public";

type Evidence = Record<string, unknown>;
function save(name: string, evidence: Evidence): void {
  writeFileSync(path.join(artifacts, `${name}.json`), JSON.stringify(evidence, null, 2));
  console.info(`saved ${name}: ${JSON.stringify(Object.keys(evidence))}`);
}

async function contextFor(browser: Browser, width: number, theme: "light" | "dark", javaScriptEnabled = true, storageState?: Awaited<ReturnType<BrowserContext["storageState"]>>): Promise<BrowserContext> {
  const coarse = width <= 412;
  const context = await browser.newContext({
    baseURL,
    viewport: { width, height: width <= 412 ? 800 : 900 },
    colorScheme: theme,
    hasTouch: coarse,
    isMobile: coarse,
    javaScriptEnabled,
    storageState,
  });
  await context.addInitScript({ content: "globalThis.__name = (target, value) => Object.defineProperty(target, 'name', { value, configurable: true });" });
  await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
  return context;
}

async function discoverRoutes(page: Page): Promise<{ category: string; product: string; productLinks: string[] }> {
  await page.goto("/products", { waitUntil: "networkidle" });
  const productLinks = [...new Set(await page.locator("a[href^='/products/']").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? "").filter(Boolean)))];
  const product = productLinks[0] ?? "/products";
  await page.goto(product, { waitUntil: "networkidle" });
  const category = (await page.locator("a[href^='/categories/']").first().getAttribute("href")) ?? "/products";
  return { category, product, productLinks };
}

async function runPublic(browser: Browser): Promise<void> {
  const discovery = await contextFor(browser, 1280, "light");
  const discoveryPage = await discovery.newPage();
  const routes = await discoverRoutes(discoveryPage);
  await discovery.close();
  const pages = [
    ["home", "/"], ["shop", "/products"], ["category", routes.category], ["product", routes.product],
    ["cart", "/cart"], ["checkout", "/checkout"], ["track-order", "/track-order"], ["about", "/about"],
    ["contact", "/contact"], ["faq", "/faq"], ["shipping-returns", "/shipping-and-returns"],
    ["payment-info", "/payment-info"], ["privacy-policy", "/privacy-policy"], ["terms", "/terms"],
    ["not-found", "/audit-route-that-does-not-exist"],
  ] as const;
  const audits: PageAudit[] = [];
  for (const width of [360, 390, 412, 768, 1280, 1440]) {
    for (const theme of ["light", "dark"] as const) {
      const context = await contextFor(browser, width, theme);
      const page = await context.newPage();
      const batch: PageAudit[] = [];
      for (const [name, route] of pages) {
        try {
          const audit = await collectPageAudit(page, route, width, theme);
          if (audit.issues.length || audit.consoleErrors.length) {
            const file = path.join(artifacts, `store-${name}-${width}-${theme}.png`);
            await page.screenshot({ path: file, fullPage: true });
            audit.screenshot = path.relative(process.cwd(), file);
          }
          batch.push(audit);
          audits.push(audit);
          console.info(`${width}/${theme} ${name}: ${audit.issues.length} issues, ${audit.consoleErrors.length} console errors`);
        } catch (error) {
          const failure: PageAudit = { url: route, status: 0, viewport: width, theme, coarsePointer: width <= 412, scrollWidth: 0, clientWidth: width, h1Count: 0, headings: [], issues: [{ area: "runner-error", detail: error instanceof Error ? error.message.slice(0, 200) : "unknown" }], consoleErrors: [] };
          batch.push(failure); audits.push(failure);
          console.info(`${width}/${theme} ${name}: RUNNER ERROR ${failure.issues[0]?.detail}`);
        }
      }
      await context.close();
      save("public-progress", { completed: audits.length, summary: issueSummary(audits) });
    }
  }
  save("check1-viewports", { routes, summary: issueSummary(audits), audits });
  await runNoJavaScript(browser, routes);
}

async function runSmoke(browser: Browser): Promise<void> {
  const discovery = await contextFor(browser, 1280, "light");
  const discoveryPage = await discovery.newPage();
  const routes = await discoverRoutes(discoveryPage);
  await discovery.close();
  const audits: PageAudit[] = [];
  for (const [width, theme, route] of [[1280, "light", "/"], [390, "dark", routes.product], [1024, "light", "/faq"]] as const) {
    const context = await contextFor(browser, width, theme);
    const page = await context.newPage();
    const audit = await collectPageAudit(page, route, width, theme);
    audits.push(audit);
    console.info(`${width}/${theme} ${route}: ${JSON.stringify(issueSummary([audit]))}`);
    for (const issue of audit.issues.slice(0, 8)) console.info(`  ${issue.area}: ${issue.detail}`);
    await context.close();
  }
  save("check1-smoke", { summary: issueSummary(audits), audits });
}

async function runNoJavaScript(browser: Browser, routes: { category: string; product: string }): Promise<void> {
  const context = await contextFor(browser, 390, "light", false);
  const page = await context.newPage();
  const results: Evidence[] = [];
  for (const route of ["/", "/products", routes.category, routes.product]) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    const textLength = (await page.locator("body").innerText()).trim().length;
    const textContentLength = await page.evaluate(() => document.body.textContent?.trim().length ?? 0);
    const visibleH1 = await page.locator("h1:visible").count();
    const links = await page.locator("a[href^='/']").count();
    const target = route === "/" ? "/products" : route === "/products" ? routes.category : route === routes.category ? routes.product : routes.category;
    const visibleLink = page.locator(`a[href='${target}']:visible`).first();
    const navigated = (await visibleLink.count()) > 0;
    if (navigated) {
      await visibleLink.click();
      await page.waitForLoadState("domcontentloaded");
    }
    if (textLength < 200 || !navigated) await page.screenshot({ path: path.join(artifacts, `nojs-${route.replaceAll("/", "_")}.png`), fullPage: true });
    results.push({ route, status: response?.status(), textLength, textContentLength, visibleH1, internalLinks: links, linkTarget: target, navigatedTo: navigated ? new URL(page.url()).pathname : null });
  }
  save("check3-no-javascript", { results });
  await context.close();
}

async function runExternalLinks(browser: Browser): Promise<void> {
  const context = await contextFor(browser, 1280, "light");
  const page = await context.newPage();
  const urls = new Set<string>();
  for (const route of ["/", "/contact"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    for (const href of await page.locator("a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""))) {
      if (/instagram|facebook|tiktok|youtube|pinterest|whatsapp|wa\.me/i.test(href)) urls.add(href);
    }
  }
  await context.close();
  const api = await request.newContext();
  const results: Evidence[] = [];
  for (const original of urls) {
    let current = original;
    const chain: Evidence[] = [];
    try {
      for (let hop = 0; hop < 6; hop += 1) {
        const response = await api.get(current, { maxRedirects: 0, timeout: 20_000 });
        const location = response.headers()["location"];
        chain.push({ url: current, status: response.status(), location: location ?? null });
        if (![301, 302, 303, 307, 308].includes(response.status()) || !location) break;
        current = new URL(location, current).toString();
      }
      results.push({ original, chain });
    } catch (error) {
      results.push({ original, chain, error: error instanceof Error ? error.message.slice(0, 160) : "request failed" });
    }
  }
  await api.dispose();
  save("check9-external-links", { results });
}

async function runLoginLimit(browser: Browser): Promise<void> {
  const pages: Page[] = [];
  const contexts: BrowserContext[] = [];
  const attempts: Evidence[] = [];
  for (let index = 0; index < 8; index += 1) {
    const context = await contextFor(browser, 1280, "light");
    const page = await context.newPage();
    const headers: Evidence[] = [];
    page.on("response", (response) => {
      if (response.request().method() === "POST") headers.push({ status: response.status(), retryAfter: response.headers()["retry-after"] ?? null });
    });
    await page.goto("/admin/login", { waitUntil: "networkidle" });
    await page.locator("#admin-email").fill("audit-nonexistent@example.com");
    await page.locator("#admin-password").fill("AuditWrongPassword123");
    contexts.push(context); pages.push(page);
    attempts.push({ index, headers });
  }
  const started = Date.now();
  await Promise.all(pages.map(async (page, index) => {
    const attemptStarted = Date.now();
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.locator("[role='alert'],[role='status']").first().waitFor({ timeout: 15_000 });
    const message = (await page.locator("[role='alert']").first().innerText().catch(() => "")).trim();
    const countdown = (await page.locator("[role='status']").first().innerText().catch(() => "")).trim();
    attempts[index] = { ...attempts[index], message, countdown, durationMs: Date.now() - attemptStarted };
  }));
  const credentialChecks = attempts.filter((attempt) => attempt.message === "Invalid email or password.").length;
  const retryAfterHeaders = attempts.flatMap((attempt) => (attempt.headers as Evidence[]).map((header) => header.retryAfter)).filter(Boolean);
  // The shared IP budget is now spent: a correct sign-in must wait for the window to reset.
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  let immediate: Evidence = { blocked: "ADMIN_EMAIL/ADMIN_PASSWORD are not present in the process environment" };
  let recovery: Evidence = { notAttempted: true };
  if (email && password) {
    const context = await contextFor(browser, 1280, "light");
    const page = await context.newPage();
    immediate = await attemptLogin(page, email, password);
    if (!immediate.ok) {
      for (let minute = 1; minute <= 16; minute += 1) {
        await page.waitForTimeout(60_000);
        const retry = await attemptLogin(page, email, password);
        if (retry.ok) { recovery = { afterMinutes: minute, ...retry }; break; }
        recovery = { afterMinutes: minute, ...retry };
      }
    } else recovery = { afterMinutes: 0, ...immediate };
    await context.close();
  }
  save("check6-login-limit", { parallelAttempts: 8, credentialChecks, retryAfterHeaders, totalDurationMs: Date.now() - started, attempts, correctLoginImmediatelyAfter: immediate, correctLoginRecovery: recovery });
  for (const context of contexts) await context.close();
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  try {
    if (mode === "smoke") await runSmoke(browser);
    if (mode === "public" || mode === "all") await runPublic(browser);
    if (mode === "links" || mode === "all") await runExternalLinks(browser);
    if (mode === "nojs") {
      const context = await contextFor(browser, 1280, "light");
      const page = await context.newPage();
      const routes = await discoverRoutes(page);
      await context.close();
      await runNoJavaScript(browser, routes);
    }
    if (mode === "auth" || mode === "all") await runAuthenticated(browser);
    if (mode === "adminlayout") await runAdminLayout(browser);
    if (mode === "catalogscan") await runCatalogScan(browser);
    if (mode === "retry") await runRetryFailed(browser);
    if (mode === "flows" || mode === "all") {
      await runLiveFlows(browser).catch(async (error: unknown) => {
        flowEvidence.error = error instanceof Error ? error.message.slice(0, 400) : "unknown";
        flowEvidence.orders = flowOrders;
        await restoreProductBaseline().catch(() => undefined);
        save("check7-live-flows", flowEvidence);
        console.error(`flows failed: ${flowEvidence.error}`);
      });
    }
    if (mode === "login" || mode === "all") await runLoginLimit(browser);
    if (mode === "lighthouse") await runLighthouse();
  } finally {
    await browser.close();
  }
}

async function attemptLogin(page: Page, email: string, password: string): Promise<{ ok: boolean; message: string; countdown: string }> {
  await page.goto("/admin/login", { waitUntil: "networkidle" });
  await page.locator("#admin-email").fill(email);
  await page.locator("#admin-password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  const landed = await page.waitForURL("**/admin", { timeout: 10_000 }).then(() => true).catch(() => false);
  const alert = page.locator("[role='alert']").first();
  const status = page.locator("[role='status']").first();
  return {
    ok: landed,
    message: landed ? "signed in" : (await alert.count()) ? (await alert.innerText()).trim() : "no feedback shown",
    countdown: (await status.count()) ? (await status.innerText()).trim() : "",
  };
}

async function loginAdmin(page: Page): Promise<boolean> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return false;
  const result = await attemptLogin(page, email, password);
  if (!result.ok) throw new Error(`admin login failed: ${result.message} ${result.countdown}`.trim());
  return true;
}

async function runAuthenticated(browser: Browser): Promise<void> {
  const context = await contextFor(browser, 1440, "light");
  const page = await context.newPage();
  if (!(await loginAdmin(page))) {
    save("check2-admin", { blocked: "ADMIN_EMAIL/ADMIN_PASSWORD are not present in the process environment" });
    await context.close();
    return;
  }
  const cookie = (await context.cookies()).find((item) => item.name === "ap_admin_session");
  const cookieFlags = cookie ? { name: cookie.name, httpOnly: cookie.httpOnly, secure: cookie.secure, sameSite: cookie.sameSite, path: cookie.path, expires: cookie.expires } : null;
  const copied = cookie ? { ...cookie } : null;
  const storageState = await context.storageState();
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("**/admin/login");
  let replayLoadsAdmin = false;
  if (copied) {
    const replay = await browser.newContext({ baseURL });
    await replay.addCookies([copied]);
    const replayPage = await replay.newPage();
    await replayPage.goto("/admin", { waitUntil: "networkidle" });
    replayLoadsAdmin = !replayPage.url().includes("/admin/login");
    await replay.close();
  }
  save("check5-session", { cookieFlags, copiedCookieWorksAfterLogout: replayLoadsAdmin, passwordChangeCode: "set-admin-password updates passwordHash only; resolveAdminUserId checks user id/role, not a session or password version" });
  await context.close();
  const discoveryContext = await contextFor(browser, 1440, "light", true, storageState);
  const discoveryPage = await discoveryContext.newPage();
  await discoveryPage.goto("/admin/orders", { waitUntil: "networkidle" });
  const orderDetail = (await discoveryPage.locator("a[href^='/admin/orders/AP-']").first().getAttribute("href")) ?? "/admin/orders";
  await discoveryPage.goto("/admin/products", { waitUntil: "networkidle" });
  const productForm = (await discoveryPage.locator("a[href^='/admin/products/']:not([href$='/new'])").first().getAttribute("href")) ?? "/admin/products/new";
  await discoveryContext.close();
  const orderNumber = orderDetail.split("/").pop() ?? "";
  const routes = [
    ["dashboard", "/admin"], ["orders", "/admin/orders"],
    ...["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "ALL"].map((status) => [`orders-${status}`, `/admin/orders?status=${status}`] as const),
    ["order-detail", orderDetail], ["print", `/admin/orders/${orderNumber}/print`],
    ["products", "/admin/products"], ["product-form", productForm], ["categories", "/admin/categories"],
  ] as const;
  const audits: PageAudit[] = [];
  const internalLinks = new Set<string>();
  for (const width of [1440, 1024, 375]) {
    for (const theme of ["light", "dark"] as const) {
      const auditContext = await contextFor(browser, width, theme, true, storageState);
      const auditPage = await auditContext.newPage();
      for (const [name, route] of routes) {
        const audit = await collectPageAudit(auditPage, route, width, theme);
        const clipped = await auditPage.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("*")).filter((element) => {
          const style = getComputedStyle(element);
          if (style.overflowX !== "hidden" && style.overflowX !== "clip") return false;
          // Screen-reader-only boxes and deliberate ellipsis truncation are not clipped content.
          if (element.clientWidth < 8 || element.clientHeight < 8 || style.textOverflow === "ellipsis") return false;
          if (element.getAttribute("aria-hidden") === "true" || element.closest("[inert]")) return false;
          return element.scrollWidth > element.clientWidth + 1 && Boolean(element.textContent?.trim());
        }).slice(0, 8).map((element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""} ${element.scrollWidth}>${element.clientWidth}`));
        audit.issues.push(...clipped.map((detail) => ({ area: "clipped-content", detail })));
        for (const href of await auditPage.locator("a[href^='/']").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""))) internalLinks.add(href);
        if (audit.issues.length || audit.consoleErrors.length) {
          const file = path.join(artifacts, `admin-${name}-${width}-${theme}.png`);
          await auditPage.screenshot({ path: file, fullPage: true });
          audit.screenshot = path.relative(process.cwd(), file);
        }
        audits.push(audit);
      }
      await auditContext.close();
    }
  }
  const linkContext = await contextFor(browser, 1440, "light", true, storageState);
  const brokenLinks: Evidence[] = [];
  for (const href of [...internalLinks].slice(0, 80)) {
    const response = await linkContext.request.get(href, { maxRedirects: 0 });
    if (response.status() >= 400) brokenLinks.push({ href, status: response.status() });
  }
  const printPage = await linkContext.newPage();
  await printPage.goto(`/admin/orders/${orderNumber}/print`, { waitUntil: "networkidle" });
  const printChrome = { asides: await printPage.locator("aside").count(), adminNav: await printPage.getByRole("navigation", { name: "Admin navigation" }).count(), packingSlip: await printPage.getByRole("heading", { name: "Packing slip" }).count() };
  await linkContext.close();
  save("check2-admin", { summary: issueSummary(audits), brokenLinks, printChrome, audits });
}

type Candidate = { route: string; title: string; price: number; madeToOrder: boolean; stockLabel: string; addDisabled: boolean };

// Kept at module scope so a mid-flow failure still reports the orders already created.
const flowOrders: string[] = [];
const flowEvidence: Evidence = { orders: flowOrders };

async function readCandidate(page: Page, route: string): Promise<Candidate> {
  await page.goto(route, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  // The announcement bar also contains "Rs 350", so the price comes from the product JSON-LD.
  const price = await page.evaluate(() => {
    for (const script of Array.from(document.querySelectorAll("script[type='application/ld+json']"))) {
      try {
        const data = JSON.parse(script.textContent ?? "") as { "@type"?: string; offers?: { price?: number; lowPrice?: number } };
        if (data["@type"] === "Product" && data.offers) return data.offers.price ?? data.offers.lowPrice ?? 0;
      } catch {
        // Skip malformed structured data blocks.
      }
    }
    return 0;
  });
  const addButton = page.getByRole("button", { name: "Add to cart" }).first();
  const hasAddButton = (await addButton.count()) > 0;
  return {
    route,
    title: (await page.locator("h1").first().innerText()).trim(),
    price,
    madeToOrder: body.includes("Made to order:"),
    stockLabel: body.includes("Out of stock") ? "Out of stock" : body.includes("Low stock") ? "Low stock" : "In stock",
    addDisabled: hasAddButton ? await addButton.isDisabled() : true,
  };
}

async function adminProductRoute(page: Page, title: string): Promise<string> {
  await page.goto(`/admin/products?search=${encodeURIComponent(title)}`, { waitUntil: "networkidle" });
  return (await page.locator(`a[title='${title.replaceAll("'", "\\'")}']`).first().getAttribute("href")) ?? "";
}

async function saveProduct(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

async function totalOrders(page: Page): Promise<number> {
  await page.goto("/admin/orders?status=ALL", { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText();
  return Number(text.match(/of\s+(\d+)\s+orders?/)?.[1] ?? text.match(/^(\d+) orders?$/m)?.[1] ?? -1);
}

async function addToCartAndWait(page: Page): Promise<void> {
  const response = page.waitForResponse((item) => item.request().method() === "POST", { timeout: 20_000 });
  await page.getByRole("button", { name: "Add to cart" }).click();
  await response;
  await page.waitForLoadState("networkidle");
}

async function checkout(page: Page, doubleClick: boolean): Promise<{ orderNumber: string; deliveryText: string }> {
  await page.goto("/cart", { waitUntil: "networkidle" });
  const checkoutLink = page.locator("a[href='/checkout']").first();
  if (!(await checkoutLink.count())) {
    await page.screenshot({ path: path.join(artifacts, "flow-cart-missing-checkout.png"), fullPage: true });
    throw new Error(`Checkout link missing; cart text: ${(await page.locator("body").innerText()).slice(0, 300)}`);
  }
  await checkoutLink.click();
  await page.waitForURL("**/checkout");
  await page.locator("#fullName").fill("Audit Test");
  await page.locator("#mobileNumber").fill("03001234567");
  await page.locator("#deliveryAddress").fill("Audit Test Address");
  await page.locator("#city").fill("Lahore");
  await page.locator("#province").fill("Punjab");
  await page.locator("#orderNotes").fill("TEST ORDER - delete");
  // The terms label wraps links to /terms and /returns, so click the checkbox control itself.
  await page.getByRole("checkbox").click();
  if (!page.url().includes("/checkout")) throw new Error(`Terms checkbox click navigated to ${page.url()}`);
  const deliveryText = await page.locator("dl").locator("visible=true").first().innerText();
  const button = page.getByRole("button", { name: "Place order" });
  await button.scrollIntoViewIfNeeded();
  await button.waitFor({ state: "visible", timeout: 10_000 });
  if (doubleClick) await button.evaluate((element) => { element.click(); element.click(); });
  else await button.click();
  await page.waitForURL(/\/order\/AP-/, { timeout: 30_000 });
  const orderNumber = decodeURIComponent(new URL(page.url()).pathname.split("/").pop() ?? "");
  return { orderNumber, deliveryText };
}

async function track(page: Page, orderNumber: string, phone: string): Promise<{ message: string; body: string }> {
  await page.goto("/track-order", { waitUntil: "networkidle" });
  await page.locator("#track-order-number").fill(orderNumber);
  await page.locator("#track-order-phone").fill(phone);
  await page.getByRole("button", { name: "Track my order" }).click();
  await page.waitForFunction(() => {
    const text = document.querySelector("#track-order-message")?.textContent ?? "";
    return text.length > 0 && !text.includes("Checking");
  }, undefined, { timeout: 15_000 });
  return { message: (await page.locator("#track-order-message").innerText()).trim(), body: await page.locator("body").innerText() };
}

async function changeStatus(page: Page, orderNumber: string, action: string): Promise<void> {
  await page.goto(`/admin/orders/${orderNumber}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: action, exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  if (action === "Mark as shipped") {
    await dialog.locator("#courier-name").fill("TestCourier");
    await dialog.locator("#tracking-number").fill("TEST-001");
  }
  const cta = action === "Mark as paid" ? "Mark paid" : action === "Mark as shipped" ? "Mark shipped" : action === "Mark as delivered" ? "Mark delivered" : action;
  await dialog.getByRole("button", { name: cta, exact: true }).click();
  await dialog.waitFor({ state: "hidden", timeout: 20_000 });
  await page.waitForLoadState("networkidle");
}

async function runLiveFlows(browser: Browser): Promise<void> {
  const adminContext = await contextFor(browser, 1440, "light");
  const admin = await adminContext.newPage();
  if (!(await loginAdmin(admin))) {
    save("check7-live-flows", { blocked: "ADMIN_EMAIL/ADMIN_PASSWORD are not present in the process environment", orders: [] });
    await adminContext.close();
    return;
  }
  const guestContext = await contextFor(browser, 1280, "light");
  const guest = await guestContext.newPage();
  const { productLinks } = await discoverRoutes(guest);
  const candidates: Candidate[] = [];
  for (const route of productLinks.slice(0, 18)) candidates.push(await readCandidate(guest, route));
  const stocked = candidates.find((item) => !item.madeToOrder && !item.addDisabled && item.price > 0 && item.price < 4650);
  const made = candidates.find((item) => item.madeToOrder && !item.addDisabled);
  const zeroMade = candidates.find((item) => item.madeToOrder && item.addDisabled);
  const orders = flowOrders;
  const evidence = flowEvidence;
  evidence.candidates = candidates.length;
  evidence.zeroStockMadeToOrderBlocked = zeroMade ? { title: zeroMade.title, stockLabel: zeroMade.stockLabel, addDisabled: zeroMade.addDisabled } : null;
  save("check7-progress", { orders, stage: "candidates", zeroStockMadeToOrderBlocked: evidence.zeroStockMadeToOrderBlocked });
  if (!stocked) {
    save("check7-live-flows", { ...evidence, blocked: "No stocked product below Rs 4,650 found", orders });
    await guestContext.close(); await adminContext.close(); return;
  }
  const productRoute = await adminProductRoute(admin, stocked.title);
  if (!productRoute) {
    evidence.blocked = `No admin product link found for "${stocked.title}"`;
    save("check7-live-flows", evidence);
    await guestContext.close(); await adminContext.close(); return;
  }
  // The editor stays open from before the order so a content save can overwrite stock (known issue 1).
  const editor = await adminContext.newPage();
  await editor.goto(productRoute, { waitUntil: "networkidle" });
  const originalTitle = await editor.locator("#product-title").inputValue();
  const originalStock = Number(await editor.locator("#variant-stock-0").inputValue());
  const originalPrice = Number(await editor.locator("#variant-price-0").inputValue());
  evidence.product = { title: originalTitle, route: stocked.route, adminRoute: productRoute, originalStock, originalPrice };
  save("check7-progress", { orders, stage: "baseline", product: evidence.product });
  const beforeTotal = await totalOrders(admin);
  await guest.goto(stocked.route, { waitUntil: "networkidle" });
  await addToCartAndWait(guest);
  const first = await checkout(guest, true);
  orders.push(first.orderNumber);
  save("check7-progress", { orders });
  const afterTotal = await totalOrders(admin);
  await admin.goto(productRoute, { waitUntil: "networkidle" });
  const stockAfterOrder = Number(await admin.locator("#variant-stock-0").inputValue());
  evidence.a = { orderNumber: first.orderNumber, deliveryText: first.deliveryText, delivery350: first.deliveryText.includes("Rs 350") };
  evidence.b = { beforeTotal, afterTotal, createdCount: afterTotal - beforeTotal, orderNumber: first.orderNumber };
  evidence.f = { originalStock, stockAfterOrder, decreasedByOne: stockAfterOrder === originalStock - 1 };
  await guest.goto(`/order/${first.orderNumber}${new URL(guest.url()).search}`, { waitUntil: "networkidle" });
  await guest.locator("#transaction-id").fill("BAD-ID");
  await guest.getByRole("button", { name: "Submit payment details" }).click();
  await guest.locator("#transaction-id-error").waitFor();
  const invalidRejected = await guest.locator("#transaction-id-error").innerText();
  await guest.locator("#transaction-id").fill("TEST123456");
  await guest.getByRole("button", { name: "Submit payment details" }).click();
  await guest.getByRole("button", { name: "Update payment details" }).waitFor();
  await guest.getByRole("button", { name: "Update payment details" }).click();
  await guest.locator("#payment-note").fill("TEST ORDER - delete");
  await guest.getByRole("button", { name: "Submit payment details" }).click();
  await guest.getByRole("button", { name: "Update payment details" }).waitFor();
  evidence.c = { invalidRejected, validSaved: true, updatedOnce: true, transactionId: "TEST123456" };
  const right = await track(guest, first.orderNumber, "03001234567");
  const wrong = await track(guest, first.orderNumber, "03009999999");
  const unknown = await track(guest, "AP-2026-999999", "03009999999");
  evidence.d = { rightMessage: right.message, wrongMessage: wrong.message, unknownMessage: unknown.message, identicalGenericError: wrong.message === unknown.message, privateFieldsHidden: !["Audit Test", "03001234567", "Audit Test Address"].some((value) => right.body.includes(value)) };
  await editor.locator("#product-title").fill(`${originalTitle} AUDIT`);
  await saveProduct(editor);
  await admin.goto(productRoute, { waitUntil: "networkidle" });
  const stockAfterTitleSave = Number(await admin.locator("#variant-stock-0").inputValue());
  const titleAfterSave = await admin.locator("#product-title").inputValue();
  evidence.f = { ...(evidence.f as Evidence), stockAfterTitleSave, titleAfterSave, stockJumpedBack: stockAfterTitleSave !== stockAfterOrder };
  save("check7-progress", { orders, stage: "stale-title-save", f: evidence.f });
  await admin.locator("#product-title").fill(originalTitle);
  await admin.locator("#variant-stock-0").fill(String(originalStock));
  await saveProduct(admin);
  await editor.close();
  const statusChecks: Evidence[] = [];
  for (const action of ["Mark as paid", "Start processing", "Mark as shipped", "Mark as delivered"]) {
    await changeStatus(admin, first.orderNumber, action);
    const tracked = await track(guest, first.orderNumber, "03001234567");
    statusChecks.push({ action, message: tracked.message, courierShown: tracked.body.includes("TestCourier"), trackingShown: tracked.body.includes("TEST-001") });
  }
  evidence.g = statusChecks;
  if (made && orders.length < 3) {
    await guest.goto(made.route, { waitUntil: "networkidle" });
    await addToCartAndWait(guest);
    const second = await checkout(guest, false);
    orders.push(second.orderNumber);
    save("check7-progress", { orders });
    evidence.e = { orderNumber: second.orderNumber, title: made.title, madeToOrder: true, ordered: true };
  } else evidence.e = { blocked: made ? "Order cap reached" : "No made-to-order product with enabled Add to cart found" };
  if (orders.length < 3) {
    await guest.goto(stocked.route, { waitUntil: "networkidle" });
    await addToCartAndWait(guest);
    const third = await checkout(guest, false);
    orders.push(third.orderNumber);
    save("check7-progress", { orders });
    await admin.goto(productRoute, { waitUntil: "networkidle" });
    const stockBeforeCancel = Number(await admin.locator("#variant-stock-0").inputValue());
    await changeStatus(admin, third.orderNumber, "Cancel order");
    await admin.goto(productRoute, { waitUntil: "networkidle" });
    const stockAfterCancel = Number(await admin.locator("#variant-stock-0").inputValue());
    const cancelAgainAvailable = await admin.getByRole("button", { name: "Cancel order", exact: true }).count();
    if (stockAfterCancel !== originalStock) {
      await admin.locator("#variant-stock-0").fill(String(originalStock));
      await saveProduct(admin);
    }
    evidence.h = { orderNumber: third.orderNumber, stockBeforeCancel, stockAfterCancel, restoredOnce: stockAfterCancel === stockBeforeCancel + 1, cancelAgainAvailable, finalStock: originalStock };
  }
  await admin.goto(productRoute, { waitUntil: "networkidle" });
  await admin.locator("#variant-price-0").fill(String(originalPrice + 1));
  await saveProduct(admin);
  await guest.goto(stocked.route, { waitUntil: "networkidle", timeout: 45_000 });
  const changedBody = await guest.locator("body").innerText();
  const immediate = changedBody.includes(`Rs ${(originalPrice + 1).toLocaleString("en-PK")}`) || changedBody.includes(`Rs ${originalPrice + 1}`);
  await admin.goto(productRoute, { waitUntil: "networkidle" });
  await admin.locator("#variant-price-0").fill(String(originalPrice));
  await admin.locator("#variant-stock-0").fill(String(originalStock));
  await saveProduct(admin);
  evidence.cache = { originalPrice, changedPrice: originalPrice + 1, storefrontImmediate: immediate, restoredPrice: originalPrice, restoredStock: originalStock };
  await admin.goto(`/admin/orders/${first.orderNumber}/print`, { waitUntil: "networkidle" });
  evidence.i = { asides: await admin.locator("aside").count(), adminNav: await admin.getByRole("navigation", { name: "Admin navigation" }).count(), packingSlip: await admin.getByRole("heading", { name: "Packing slip" }).count() };
  await admin.goto(productRoute, { waitUntil: "networkidle" });
  evidence.restored = { title: await admin.locator("#product-title").inputValue(), stock: Number(await admin.locator("#variant-stock-0").inputValue()), price: Number(await admin.locator("#variant-price-0").inputValue()) };
  evidence.orders = orders;
  save("check7-live-flows", evidence);
  save("check8-cache", evidence.cache as Evidence);
  await guestContext.close();
  await adminContext.close();
}

/** Safety net: put the audited product back to its recorded title, stock and price after a failure. */
async function restoreProductBaseline(): Promise<void> {
  const product = flowEvidence.product as { adminRoute?: string; title?: string; originalStock?: number; originalPrice?: number } | undefined;
  if (!product?.adminRoute || product.title === undefined || product.originalStock === undefined || product.originalPrice === undefined) return;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await contextFor(browser, 1440, "light");
    const page = await context.newPage();
    if (!(await loginAdmin(page))) { await context.close(); return; }
    await page.goto(product.adminRoute, { waitUntil: "networkidle" });
    await page.locator("#product-title").fill(product.title);
    await page.locator("#variant-stock-0").fill(String(product.originalStock));
    await page.locator("#variant-price-0").fill(String(product.originalPrice));
    await saveProduct(page);
    flowEvidence.restoredAfterFailure = {
      title: await page.locator("#product-title").inputValue(),
      stock: Number(await page.locator("#variant-stock-0").inputValue()),
      price: Number(await page.locator("#variant-price-0").inputValue()),
    };
    await context.close();
  } finally {
    await browser.close();
  }
}

/** Re-collects only the storefront audits that failed with a runner error (for example under CPU load). */
async function runRetryFailed(browser: Browser): Promise<void> {
  const target = path.join(artifacts, "check1-viewports.json");
  const data = JSON.parse(readFileSync(target, "utf8")) as { routes: { category: string; product: string }; summary: Record<string, number>; audits: PageAudit[] };
  const failed = data.audits.filter((audit) => audit.issues.some((issue) => issue.area === "runner-error"));
  console.info(`retrying ${failed.length} failed storefront audits`);
  for (const [index, failure] of failed.entries()) {
    const context = await contextFor(browser, failure.viewport, failure.theme as "light" | "dark");
    const page = await context.newPage();
    // A streamed redirect can still land mid-measurement, so allow a few attempts.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const audit = await collectPageAudit(page, failure.url, failure.viewport, failure.theme);
        if (audit.issues.length || audit.consoleErrors.length) {
          const file = path.join(artifacts, `store-retry-${failure.viewport}-${failure.theme}-${index}.png`);
          await page.screenshot({ path: file, fullPage: true });
          audit.screenshot = path.relative(process.cwd(), file);
        }
        Object.assign(failure, audit);
        console.info(`retry ${failure.viewport}/${failure.theme} ${failure.url}: ${audit.issues.length} issues (attempt ${attempt})`);
        break;
      } catch (error) {
        failure.issues = [{ area: "runner-error", detail: error instanceof Error ? error.message.slice(0, 200) : "unknown" }];
        console.info(`retry attempt ${attempt} failed ${failure.viewport}/${failure.theme} ${failure.url}: ${failure.issues[0]?.detail}`);
        await page.waitForLoadState("domcontentloaded").catch(() => undefined);
      }
    }
    await context.close();
  }
  data.summary = issueSummary(data.audits);
  save("check1-viewports", data as unknown as Evidence);
}

/** Read-only catalogue scan: confirms made-to-order and zero-stock behaviour without editing data. */
async function runCatalogScan(browser: Browser): Promise<void> {
  const context = await contextFor(browser, 1280, "light");
  const page = await context.newPage();
  await page.goto("/products", { waitUntil: "networkidle" });
  const links = [...new Set(await page.locator("a[href^='/products/']").evaluateAll((items) => items.map((item) => item.getAttribute("href") ?? "").filter(Boolean)))];
  const items: Candidate[] = [];
  for (const route of links) items.push(await readCandidate(page, route));
  save("check7-catalog-scan", {
    total: items.length,
    madeToOrder: items.filter((item) => item.madeToOrder).map((item) => ({ title: item.title, stockLabel: item.stockLabel, addDisabled: item.addDisabled })),
    zeroStockMadeToOrderBlocked: items.filter((item) => item.madeToOrder && item.addDisabled).map((item) => item.title),
    outOfStock: items.filter((item) => item.stockLabel === "Out of stock").map((item) => ({ title: item.title, madeToOrder: item.madeToOrder, addDisabled: item.addDisabled })),
    items,
  });
  await context.close();
}

/**
 * Re-measures only admin overflow/clipping with the corrected detectors and merges
 * the result into the existing check2 evidence, so colour and target-size findings
 * from the full matrix are kept without repeating the slow hover/focus pass.
 */
async function runAdminLayout(browser: Browser): Promise<void> {
  const context = await contextFor(browser, 1440, "light");
  const page = await context.newPage();
  if (!(await loginAdmin(page))) {
    save("check2-admin-layout", { blocked: "ADMIN_EMAIL/ADMIN_PASSWORD are not present in the process environment" });
    await context.close();
    return;
  }
  await page.goto("/admin/orders", { waitUntil: "networkidle" });
  const orderDetail = (await page.locator("a[href^='/admin/orders/AP-']").first().getAttribute("href")) ?? "/admin/orders";
  await page.goto("/admin/products", { waitUntil: "networkidle" });
  const productForm = (await page.locator("a[href^='/admin/products/']:not([href$='/new'])").first().getAttribute("href")) ?? "/admin/products/new";
  await context.close();
  const orderNumber = orderDetail.split("/").pop() ?? "";
  const routes = [
    ["dashboard", "/admin"], ["orders", "/admin/orders"],
    ...["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "ALL"].map((status) => [`orders-${status}`, `/admin/orders?status=${status}`] as const),
    ["order-detail", orderDetail], ["print", `/admin/orders/${orderNumber}/print`],
    ["products", "/admin/products"], ["product-form", productForm], ["categories", "/admin/categories"],
  ] as const;
  const results: Evidence[] = [];
  for (const width of [1440, 1024, 375]) {
    for (const theme of ["light", "dark"] as const) {
      const layoutContext = await contextFor(browser, width, theme);
      const layoutPage = await layoutContext.newPage();
      for (const [name, route] of routes) {
        await layoutPage.goto(route, { waitUntil: "networkidle", timeout: 60_000 });
        const measured = await layoutPage.evaluate(() => {
          const issues: { area: string; detail: string }[] = [];
          const root = document.documentElement;
          const visible = (element: Element): element is HTMLElement => {
            if (!(element instanceof HTMLElement)) return false;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
          };
          const describe = (element: Element): string => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""} "${element.textContent?.trim().replace(/\s+/g, " ").slice(0, 60)}"`;
          const inScrollRegion = (element: HTMLElement): boolean => {
            let current = element.parentElement;
            while (current && current !== document.body) {
              const style = getComputedStyle(current);
              if ((style.overflowX === "auto" || style.overflowX === "scroll") && current.getBoundingClientRect().right <= window.innerWidth + 1) return true;
              current = current.parentElement;
            }
            return false;
          };
          if (root.scrollWidth > root.clientWidth) issues.push({ area: "horizontal-overflow", detail: `${root.scrollWidth}px scrollWidth > ${root.clientWidth}px clientWidth` });
          const wide = Array.from(document.body.querySelectorAll<HTMLElement>("*")).filter((element) => {
            if (!visible(element) || ["SVG", "PATH"].includes(element.tagName) || element.getAttribute("aria-hidden") === "true" || element.closest("[inert]")) return false;
            const rect = element.getBoundingClientRect();
            const beyond = (rect.right > window.innerWidth + 1 && rect.left < window.innerWidth) || (rect.left < -1 && rect.right > 0);
            return beyond && !inScrollRegion(element);
          });
          for (const element of wide.slice(0, 12)) {
            const rect = element.getBoundingClientRect();
            issues.push({ area: "wide-element", detail: `${describe(element)} x=${rect.x.toFixed(0)} width=${rect.width.toFixed(0)}px` });
          }
          const clipped = Array.from(document.body.querySelectorAll<HTMLElement>("*")).filter((element) => {
            const style = getComputedStyle(element);
            if (style.overflowX !== "hidden" && style.overflowX !== "clip") return false;
            if (element.clientWidth < 8 || element.clientHeight < 8 || style.textOverflow === "ellipsis") return false;
            if (element.getAttribute("aria-hidden") === "true" || element.closest("[inert]")) return false;
            return element.scrollWidth > element.clientWidth + 1 && Boolean(element.textContent?.trim());
          });
          for (const element of clipped.slice(0, 8)) issues.push({ area: "clipped-content", detail: `${describe(element)} ${element.scrollWidth}>${element.clientWidth}` });
          if (matchMedia("(pointer: coarse)").matches) {
            const controls = Array.from(document.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,summary,[role='button'],[role='tab'],[role='switch']"));
            for (const control of controls.filter(visible)) {
              if (control.matches(":disabled") || control.getAttribute("aria-disabled") === "true") continue;
              const style = getComputedStyle(control);
              if (style.clipPath === "inset(50%)" || style.clip === "rect(0px, 0px, 0px, 0px)") continue;
              let rect = control.getBoundingClientRect();
              if (rect.right <= 0 || rect.bottom <= 0) continue;
              const label = control.closest("label");
              if (label && ["INPUT", "SELECT", "TEXTAREA"].includes(control.tagName)) {
                const labelRect = label.getBoundingClientRect();
                if (labelRect.width > rect.width && labelRect.height > rect.height) rect = labelRect;
              }
              if (rect.width <= 1 || rect.height <= 1) continue;
              if (rect.width < 44 || rect.height < 44) issues.push({ area: "target-size", detail: `${describe(control)} ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px` });
            }
          }
          return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, issues };
        });
        results.push({ name, url: route, viewport: width, theme, ...measured });
        console.info(`layout ${width}/${theme} ${name}: ${measured.issues.length} issues`);
      }
      await layoutContext.close();
    }
  }
  save("check2-admin-layout", { results });
  const target = path.join(artifacts, "check2-admin.json");
  const existing = JSON.parse(readFileSync(target, "utf8")) as { summary: Record<string, number>; brokenLinks: Evidence[]; printChrome: Evidence; audits: PageAudit[] };
  for (const audit of existing.audits) {
    const match = results.find((item) => item.url === audit.url && item.viewport === audit.viewport && item.theme === audit.theme) as { scrollWidth: number; clientWidth: number; issues: { area: string; detail: string }[] } | undefined;
    if (!match) continue;
    audit.scrollWidth = match.scrollWidth;
    audit.clientWidth = match.clientWidth;
    audit.issues = audit.issues.filter((issue) => !["wide-element", "clipped-content", "horizontal-overflow", "target-size"].includes(issue.area));
    audit.issues.push(...match.issues);
  }
  existing.summary = issueSummary(existing.audits);
  save("check2-admin", existing as unknown as Evidence);
}

async function runLighthouse(): Promise<void> {
  const routes = JSON.parse(readFileSync(path.join(artifacts, "check1-viewports.json"), "utf8")).routes as { category: string; product: string };
  const pages = [["home", "/"], ["shop", "/products"], ["category", routes.category], ["product", routes.product], ["cart", "/cart"]] as const;
  const results: Evidence[] = [];
  for (const [name, route] of pages) {
    const output = path.join(artifacts, `lighthouse-${name}.json`);
    const run = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["dlx", "lighthouse", `${baseURL}${route}`, "--output=json", `--output-path=${output}`, "--chrome-flags=--headless --no-sandbox", "--form-factor=mobile", "--throttling-method=simulate", "--max-wait-for-load=45000", "--only-categories=performance,accessibility,best-practices,seo"], { env: { ...process.env, CHROME_PATH: chromium.executablePath() }, stdio: "inherit", shell: false });
    if (run.status !== 0) { results.push({ name, route, error: `lighthouse exit ${run.status}` }); continue; }
    const report = JSON.parse(readFileSync(output, "utf8")) as { categories: Record<string, { score: number }>; audits: Record<string, { title: string; score: number | null; numericValue?: number; displayValue?: string }> };
    const issues = Object.values(report.audits).filter((audit) => audit.score !== null && audit.score < 0.9).sort((a, b) => (a.score ?? 1) - (b.score ?? 1)).slice(0, 3).map((audit) => ({ title: audit.title, score: audit.score, displayValue: audit.displayValue }));
    results.push({ name, route, scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), lcpMs: report.audits["largest-contentful-paint"]?.numericValue, cls: report.audits["cumulative-layout-shift"]?.numericValue, tbtMs: report.audits["total-blocking-time"]?.numericValue, topIssues: issues });
  }
  save("check4-lighthouse", { results });
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Audit runner failed");
  process.exitCode = 1;
});
