// End-to-end filter interaction: switch, Apply, chips, Clear all, toolbar sort,
// and desktop layout screenshots. Query-string behavior must remain unchanged.
import fs from "node:fs";
import path from "node:path";

const PORT = 9333;
const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const BASE = "http://localhost:3000";
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 1; const pending = new Map(); const events = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); if (m.error) rej(new Error(JSON.stringify(m.error))); else res(m.result); } else if (m.method) events.push(m); };
function send(method, params = {}) { const id = nextId++; return new Promise((res, rej) => { pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); }); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForEvent(method, t = 25000) { const s = Date.now(); while (Date.now() - s < t) { const i = events.findIndex((e) => e.method === method); if (i >= 0) return events.splice(i, 1)[0]; await sleep(50); } throw new Error("timeout " + method); }
async function ev(expr) {
  const response = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  return response.result.value;
}
async function waitForSearch(expected, timeout = 20000) {
  const start = Date.now();
  let actual = "";
  while (Date.now() - start < timeout) {
    actual = await ev("location.search");
    if (actual === expected) return actual;
    await sleep(200);
  }
  return `TIMEOUT: expected ${expected}, actual ${actual}`;
}

await send("Page.enable"); await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try { localStorage.setItem("theme","dark"); } catch {}` });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 812, deviceScaleFactor: 1, mobile: true });
events.length = 0;
await send("Page.navigate", { url: BASE + "/products?sort=price-asc" });
await waitForEvent("Page.loadEventFired");
await sleep(1200);

// open drawer
await ev(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith("Filters")); b.click(); })()`);
await sleep(900);

// Toggle the In stock switch via its label text and inspect its final position.
const before = await ev(`(() => { const c = document.querySelector('[data-slot="sheet-content"]'); const label = [...c.querySelectorAll("label")].find((l) => l.textContent.includes("In stock only")); const box = label.querySelector('input[name="inStock"]'); const thumb = label.querySelectorAll("span")[1]; label.click(); return JSON.stringify({ checked: !box.checked, left: thumb.getBoundingClientRect().left }); })()`);
await sleep(350);
const after = await ev(`(() => { const c = document.querySelector('[data-slot="sheet-content"]'); const label = [...c.querySelectorAll("label")].find((l) => l.textContent.includes("In stock only")); const box = label.querySelector('input[name="inStock"]'); const thumb = label.querySelectorAll("span")[1]; const style = getComputedStyle(thumb); return JSON.stringify({ checked: box.checked, left: thumb.getBoundingClientRect().left, translate: style.translate, transform: style.transform }); })()`);

// Set min price, Apply, and inspect active chips.
await ev(`(() => { const c = document.querySelector('[data-slot="sheet-content"]'); c.querySelector('input[name="minPrice"]').value = "1000"; })()`);
await ev(`(() => { const c = document.querySelector('[data-slot="sheet-content"]'); [...c.querySelectorAll("button")].find((x) => x.textContent.trim() === "Apply filters").click(); })()`);
const searchAfterApply = await waitForSearch("?sort=price-asc&minPrice=1000&inStock=true");
await sleep(350);
const drawerClosedAfterApply = await ev(`!document.querySelector('[data-slot="sheet-content"]')`);
const chipsAfterApply = await ev(`JSON.stringify([...document.querySelectorAll("button")].filter((b) => b.querySelector(".sr-only")?.textContent.startsWith("Remove ")).map((b) => b.querySelector(".sr-only").textContent))`);

// Remove one chip and confirm only its own parameter disappears.
await ev(`(() => { [...document.querySelectorAll("button")].find((b) => b.querySelector(".sr-only")?.textContent === "Remove In stock filter").click(); })()`);
const searchAfterChipRemove = await waitForSearch("?sort=price-asc&minPrice=1000");
await sleep(350);

// Clear all from the drawer; toolbar sort must survive.
await ev(`(() => { [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith("Filters")).click(); })()`);
await sleep(500);
await ev(`(() => { const c = document.querySelector('[data-slot="sheet-content"]'); [...c.querySelectorAll("button")].find((x) => x.textContent.trim() === "Clear all").click(); })()`);
const searchAfterClear = await waitForSearch("?sort=price-asc");
await sleep(350);
const chipsAfterClear = await ev(`[...document.querySelectorAll("button")].filter((b) => b.querySelector(".sr-only")?.textContent.startsWith("Remove ")).length`);

// Compact sort applies directly from the toolbar.
await ev(`(() => { const s = document.querySelector('select[aria-label="Sort by"]'); s.value = "price-desc"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
const searchAfterToolbarSort = await waitForSearch("?sort=price-desc");

// Desktop reference captures at the two grid breakpoints.
for (const width of [768, 1280]) {
  events.length = 0;
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: BASE + "/products" });
  await waitForEvent("Page.loadEventFired");
  await sleep(1000);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, `ms-products-${width}-dark.png`), Buffer.from(shot.data, "base64"));
}

console.log(JSON.stringify({
  toggle: { before: JSON.parse(before), after: JSON.parse(after) },
  searchAfterApply,
  drawerClosedAfterApply,
  chipsAfterApply: JSON.parse(chipsAfterApply),
  searchAfterChipRemove,
  searchAfterClear,
  chipsAfterClear,
  searchAfterToolbarSort,
}, null, 2));
ws.close();