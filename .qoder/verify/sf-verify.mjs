// Storefront polish verification: drives a dedicated headless Chrome over CDP
// (Node built-in WebSocket) for exact-viewport layout checks, hash-navigation
// landing position, and screenshots. No MCP auto-scroll interference.
import fs from "node:fs";
import path from "node:path";

const PORT = 9333;
const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const BASE = "http://localhost:3000";

const pages = [
  { key: "about", url: "/about" },
  { key: "contact", url: "/contact" },
  { key: "track", url: "/track-order" },
  { key: "home", url: "/" },
];
const viewports = [
  { key: "m", w: 375, h: 812, mobile: true },
  { key: "d", w: 1440, h: 900, mobile: false },
];
const themes = ["light", "dark"];

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
  } else if (msg.method) {
    events.push(msg);
  }
};
function send(method, params = {}) {
  const id = nextId++;
  return new Promise((res, rej) => {
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
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
async function setViewport(v) {
  await send("Emulation.setDeviceMetricsOverride", { width: v.w, height: v.h, deviceScaleFactor: 1, mobile: v.mobile });
}
async function goto(url) {
  events.length = 0;
  await send("Page.navigate", { url: BASE + url });
  await waitForEvent("Page.loadEventFired");
  await sleep(1400);
}
async function shot(name) {
  const s = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(s.data, "base64"));
}

await send("Page.enable");
await send("Runtime.enable");

const layout = [];
for (const theme of themes) {
  for (const v of viewports) {
    for (const p of pages) {
      // fresh script id each navigation so only the current theme is applied
      const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", {
        source: `try { localStorage.setItem("theme", ${JSON.stringify(theme)}); } catch {}`,
      });
      await setViewport(v);
      await goto(p.url);
      const m = await evaluate(`JSON.stringify({ iw: innerWidth, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, theme: document.documentElement.classList.contains("dark") ? "dark" : "light", h1: document.querySelectorAll("main h1").length, url: location.pathname })`);
      const metrics = JSON.parse(m);
      await shot(`sf-${p.key}-${v.key}-${theme}`);
      layout.push({ page: p.key, vp: v.key, theme, ...metrics, overflow: metrics.sw > metrics.cw });
      await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
    }
  }
}

// Hash navigation: from /about and from a product page, click header Categories
// link and measure where the section title lands relative to the sticky header.
const hash = [];
for (const theme of themes) {
  const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { localStorage.setItem("theme", ${JSON.stringify(theme)}); } catch {}`,
  });
  await setViewport(viewports[1]); // desktop 1440
  for (const from of ["/about", "/products/sample-woodland-friends-felt-play-set"]) {
    await goto(from);
    await evaluate(`(() => { const l = [...document.querySelectorAll("header a")].find(a => a.getAttribute("href") === "/#categories"); if (l) l.click(); return !!l; })()`);
    await sleep(2600); // allow client nav + smooth scroll to settle
    const m = await evaluate(`JSON.stringify({ url: location.pathname + location.hash, headerBottom: Math.round(document.querySelector("header").getBoundingClientRect().bottom), headingTop: Math.round(document.querySelector("#categories-heading").getBoundingClientRect().top), scrollY: Math.round(window.scrollY), scrollMt: getComputedStyle(document.querySelector("#categories")).scrollMarginTop })`);
    const r = JSON.parse(m);
    hash.push({ theme, from, ...r, clearsHeader: r.headingTop >= r.headerBottom });
    await shot(`sf-hash-${theme}-${from.includes("about") ? "about" : "product"}`);
  }
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
}

console.log(JSON.stringify({ layout, hash }, null, 2));
ws.close();