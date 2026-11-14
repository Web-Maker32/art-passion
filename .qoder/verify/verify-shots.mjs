// One-off visual verification harness: drives a dedicated headless Chrome over
// CDP (Node built-in WebSocket) to capture exact-viewport screenshots.
import fs from "node:fs";
import path from "node:path";

const PORT = 9333;
const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const BASE = "http://localhost:3000";

const scenarios = [
  { name: "login-desktop-light", url: "/admin/login", w: 1280, h: 800, mobile: false, theme: "light" },
  { name: "login-desktop-dark", url: "/admin/login", w: 1280, h: 800, mobile: false, theme: "dark" },
  { name: "login-mobile-light", url: "/admin/login", w: 375, h: 812, mobile: true, theme: "light" },
  { name: "login-mobile-dark", url: "/admin/login", w: 375, h: 812, mobile: true, theme: "dark" },
  { name: "store-desktop-light", url: "/", w: 1280, h: 800, mobile: false, theme: "light" },
  { name: "store-mobile-light", url: "/", w: 375, h: 812, mobile: true, theme: "light" },
  { name: "store-mobile-dark", url: "/", w: 375, h: 812, mobile: true, theme: "dark" },
];

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
async function waitForEvent(method, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const i = events.findIndex((e) => e.method === method);
    if (i >= 0) return events.splice(i, 1)[0];
    await sleep(50);
  }
  throw new Error(`timeout waiting for ${method}`);
}

await send("Page.enable");
await send("Runtime.enable");

const results = [];
let scriptId = null;
for (const s of scenarios) {
  if (scriptId) await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
  ({ identifier: scriptId } = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { localStorage.setItem("theme", ${JSON.stringify(s.theme)}); } catch {}`,
  }));
  await send("Emulation.setDeviceMetricsOverride", {
    width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.mobile,
  });
  events.length = 0;
  await send("Page.navigate", { url: BASE + s.url });
  await waitForEvent("Page.loadEventFired");
  await sleep(1200); // fonts + hydration settle
  const { result } = await send("Runtime.evaluate", {
    expression: `JSON.stringify({ iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, theme: document.documentElement.classList.contains("dark") ? "dark" : "light", url: location.pathname })`,
    returnByValue: true,
  });
  const metrics = JSON.parse(result.value);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, `${s.name}.png`), Buffer.from(shot.data, "base64"));
  results.push({ name: s.name, ...metrics, overflow: metrics.sw > metrics.cw });
}
console.log(JSON.stringify(results, null, 2));
ws.close();