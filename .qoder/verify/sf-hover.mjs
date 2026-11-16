// Focused Stage-4a hover verification: hover the categories "Shop all" link in
// light + dark, read computed styles, and capture a tight clip of the heading row.
import fs from "node:fs";
import path from "node:path";

const PORT = 9333;
const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const BASE = "http://localhost:3000";

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

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const out = [];
for (const theme of ["light", "dark"]) {
  const { identifier } = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { localStorage.setItem("theme", ${JSON.stringify(theme)}); } catch {}`,
  });
  events.length = 0;
  await send("Page.navigate", { url: BASE + "/" });
  await waitForEvent("Page.loadEventFired");
  await sleep(1400);
  // bring the categories heading row into view instantly (no smooth scroll)
  await evaluate(`(() => { const el = document.querySelector('#categories a[href="/products"]'); el.scrollIntoView({ block: "center", behavior: "instant" }); })()`);
  await sleep(900); // allow scroll-reveal to finish before measuring/hovering
  const r2 = await evaluate(`(() => { const r = document.querySelector('#categories a[href="/products"]').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
  // hover the centre of the link
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r2.x + r2.w / 2, y: r2.y + r2.h / 2 });
  await sleep(450); // let transition-colors settle
  const styles = await evaluate(`(() => { const el = document.querySelector('#categories a[href="/products"]'); const cs = getComputedStyle(el); const sec = getComputedStyle(document.querySelector("#categories")); return JSON.stringify({ bg: cs.backgroundColor, color: cs.color, border: cs.borderColor, sectionBg: sec.backgroundColor, hovered: el.matches(":hover") }); })()`);
  const s = JSON.parse(styles);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, `sf-hover-${theme}.png`), Buffer.from(shot.data, "base64"));
  out.push({ theme, ...s, scrollY: await evaluate("Math.round(window.scrollY)"), linkY: Math.round(r2.y) });
  // move mouse away so next theme starts clean
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
}
console.log(JSON.stringify(out, null, 2));
ws.close();