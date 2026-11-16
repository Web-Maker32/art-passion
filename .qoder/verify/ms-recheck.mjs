// Re-check redirect-target pages for overflow with retry (context settle).
const PORT = 9333;
const BASE = "http://localhost:3000";
const pages = ["/cart", "/privacy-policy", "/track-order", "/shipping-and-returns", "/categories/felt-sets"];
const widths = [360, 390, 412];

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 1; const pending = new Map(); const events = [];
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); if (m.error) rej(new Error(JSON.stringify(m.error))); else res(m.result); } else if (m.method) events.push(m); };
function send(method, params = {}) { const id = nextId++; return new Promise((res, rej) => { pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); }); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForEvent(method, t = 25000) { const s = Date.now(); while (Date.now() - s < t) { const i = events.findIndex((e) => e.method === method); if (i >= 0) return events.splice(i, 1)[0]; await sleep(50); } throw new Error("timeout " + method); }
async function ev(expr) { const { result } = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); return result.value; }

await send("Page.enable"); await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try { localStorage.setItem("theme","light"); } catch {}` });

const out = [];
for (const w of widths) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 812, deviceScaleFactor: 1, mobile: true });
  for (const p of pages) {
    events.length = 0;
    await send("Page.navigate", { url: BASE + p });
    await waitForEvent("Page.loadEventFired");
    await sleep(1300);
    let m = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const v = await ev(`JSON.stringify({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, url: location.pathname })`);
      if (v) { m = JSON.parse(v); break; }
      await sleep(600);
    }
    out.push({ page: p, width: w, ...(m ?? { error: "no-eval" }), overflow: m ? m.sw > m.cw : null });
  }
}
console.log(JSON.stringify(out.filter((r) => r.overflow !== false), null, 2));
console.log("checked", out.length, "page/width combos; overflows:", out.filter((r) => r.overflow).length, "no-eval:", out.filter((r) => r.error).length);
ws.close();