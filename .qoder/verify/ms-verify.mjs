// Mobile shop verification (CDP over Node built-in WebSocket, headless Chrome).
// 1) Horizontal-overflow audit for every storefront page at 360/390/412px.
// 2) Dark-mode price + "From" contrast on /products and home.
// 3) Mobile filter drawer: open, verify fields, screenshot, light + dark.
import fs from "node:fs";
import path from "node:path";

const PORT = 9333;
const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const BASE = "http://localhost:3000";

const auditPages = [
  "/", "/products", "/categories/felt-sets", "/search?q=felt",
  "/products/sample-woodland-friends-felt-play-set", "/cart", "/checkout",
  "/track-order", "/about", "/contact", "/faq", "/shipping-and-returns",
  "/payment-info", "/privacy", "/terms", "/this-route-does-not-exist",
];
const widths = [360, 390, 412];

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
if (!page) throw new Error("No page target");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let nextId = 1;
const pending = new Map();
const events = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) rej(new Error(JSON.stringify(msg.error)));
    else res(msg.result);
  } else if (msg.method) events.push(msg);
};
function send(method, params = {}) {
  const id = nextId++;
  return new Promise((res, rej) => { pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForEvent(method, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const i = events.findIndex((e) => e.method === method);
    if (i >= 0) return events.splice(i, 1)[0];
    await sleep(50);
  }
  throw new Error(`timeout waiting for ${method}`);
}
async function evaluate(expression) {
  const { result } = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return result.value;
}
async function setViewport(w, h = 812) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: true });
}
async function goto(url) {
  events.length = 0;
  await send("Page.navigate", { url: BASE + url });
  await waitForEvent("Page.loadEventFired");
  await sleep(750);
}
async function shot(name) {
  const s = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(s.data, "base64"));
}
async function themeScript(theme) {
  const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { localStorage.setItem("theme", ${JSON.stringify(theme)}); } catch {}`,
  });
  return identifier;
}
async function overflow() {
  const v = await evaluate(`JSON.stringify({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`);
  return v ? JSON.parse(v) : { sw: -1, cw: -1 };
}

// sRGB relative luminance + WCAG contrast ratio from "rgb(r, g, b)".
function lum([r, g, b]) {
  const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg, bg) {
  const a = lum(fg), b = lum(bg);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
function parseRgb(str) {
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  return parts.slice(0, 3);
}

await send("Page.enable");
await send("Runtime.enable");

// ---- 1) Overflow audit (light theme; layout is theme-independent) ----
const overflowFailures = [];
let themeId = await themeScript("light");
for (const w of widths) {
  await setViewport(w);
  for (const p of auditPages) {
    await goto(p);
    const m = await overflow();
    if (m.sw === -1) { overflowFailures.push({ page: p, width: w, error: "no-eval (redirect/context)" }); continue; }
    if (m.sw > m.cw) {
      const culprit = await evaluate(`(() => { const cw = document.documentElement.clientWidth; const bad = []; document.querySelectorAll("body *").forEach((el) => { const r = el.getBoundingClientRect(); if (r.width && r.right > cw + 1) bad.push(el.tagName.toLowerCase() + " right=" + Math.round(r.right) + " cls=" + String(el.className && el.className.baseVal !== undefined ? "svg" : el.className).slice(0, 60)); }); return bad.slice(0, 4); })()`);
      overflowFailures.push({ page: p, width: w, ...m, culprit });
    }
  }
}
await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: themeId });

// ---- 2) Price contrast (dark) on /products and home ----
const contrast = [];
themeId = await themeScript("dark");
await setViewport(390);
for (const p of ["/products", "/"]) {
  await goto(p);
  const data = await evaluate(`(() => { const article = document.querySelector("main article"); if (!article) return null; const price = article.querySelector("p.tabular-nums"); const from = price ? price.querySelector("span") : null; const cardBg = getComputedStyle(article).backgroundColor; return JSON.stringify({ priceColor: price ? getComputedStyle(price).color : null, fromColor: from ? getComputedStyle(from).color : null, cardBg }); })()`);
  if (data) {
    const d = JSON.parse(data);
    const pc = parseRgb(d.priceColor), fc = parseRgb(d.fromColor), bg = parseRgb(d.cardBg);
    contrast.push({
      page: p, ...d,
      priceRatio: pc && bg ? Number(ratio(pc, bg).toFixed(2)) : null,
      fromRatio: fc && bg ? Number(ratio(fc, bg).toFixed(2)) : null,
    });
  }
}
await shot("ms-products-390-dark");
await goto("/products");
await shot("ms-products-390-dark-full");
await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: themeId });

// ---- 3) Filter drawer (light + dark at 390) ----
const sheet = [];
for (const theme of ["light", "dark"]) {
  themeId = await themeScript(theme);
  await setViewport(390);
  await goto("/products");
  await evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith("Filters")); if (b) b.click(); return !!b; })()`);
  await sleep(900);
  const fields = await evaluate(`(() => { const c = document.querySelector('[data-slot="sheet-content"]'); if (!c) return JSON.stringify({ open: false }); const names = [...c.querySelectorAll("[name]")].map((el) => el.getAttribute("name")); const btns = [...c.querySelectorAll("button")].map((b) => b.textContent.trim()); return JSON.stringify({ open: true, names, btns }); })()`);
  sheet.push({ theme, ...JSON.parse(fields) });
  await shot(`ms-sheet-390-${theme}`);
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: themeId });
}

// ---- Reference screenshots for by-eye ----
for (const theme of ["light", "dark"]) {
  themeId = await themeScript(theme);
  await setViewport(412);
  await goto("/products");
  await shot(`ms-products-412-${theme}`);
  await setViewport(390);
  await goto("/");
  await shot(`ms-home-390-${theme}`);
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: themeId });
}

console.log(JSON.stringify({ overflowFailures, contrast, sheet }, null, 2));
ws.close();