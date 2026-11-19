import type { Locator, Page } from "@playwright/test";

export type AuditIssue = {
  area: string;
  detail: string;
};

export type PageAudit = {
  url: string;
  status: number;
  viewport: number;
  theme: string;
  coarsePointer: boolean;
  scrollWidth: number;
  clientWidth: number;
  h1Count: number;
  headings: string[];
  issues: AuditIssue[];
  consoleErrors: string[];
  screenshot?: string;
};

export function describeElement(element: Element): string {
  const id = element.id ? `#${element.id}` : "";
  const label = element.textContent?.trim().replace(/\s+/g, " ").slice(0, 70) ?? "";
  return `${element.tagName.toLowerCase()}${id}${label ? ` "${label}"` : ""}`;
}

export async function collectPageAudit(
  page: Page,
  url: string,
  viewport: number,
  theme: string,
): Promise<PageAudit> {
  const consoleErrors: string[] = [];
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
  };
  page.on("console", onConsole);
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
  // Streamed pages can redirect after load (empty-cart /checkout -> /cart). Wait for the
  // URL to settle, otherwise the next navigation is interrupted and the context is destroyed.
  let last = page.url();
  let stable = 0;
  for (let attempt = 0; attempt < 20 && stable < 3; attempt += 1) {
    await page.waitForTimeout(200);
    const current = page.url();
    if (current === last) stable += 1;
    else { stable = 0; last = current; }
  }
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.addStyleTag({
    // Freeze motion and reveal every scroll-reveal block so measurements do not depend on
    // which part of the page happened to be scrolled into view (same end state as reduced motion).
    content: "*,*::before,*::after{transition:none!important;animation:none!important}.scroll-reveal-pending{opacity:1!important;transform:none!important}",
  });
  const result = await page.evaluate(() => {
    type Issue = { area: string; detail: string };
    const issues: Issue[] = [];
    const visible = (element: Element): element is HTMLElement => {
      if (!(element instanceof HTMLElement)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width <= 0 || rect.height <= 0) return false;
      // Collapsed/transparent decorations (for example the WhatsApp float label) are not rendered content.
      let current: HTMLElement | null = element;
      while (current && current !== document.body) {
        if (getComputedStyle(current).opacity === "0") return false;
        current = current.parentElement;
      }
      return true;
    };
    const describe = (element: Element): string => {
      const id = element.id ? `#${element.id}` : "";
      const label = element.textContent?.trim().replace(/\s+/g, " ").slice(0, 70) ?? "";
      return `${element.tagName.toLowerCase()}${id}${label ? ` "${label}"` : ""}`;
    };
    type Rgba = { r: number; g: number; b: number; a: number };
    const colourCanvas = document.createElement("canvas");
    colourCanvas.width = colourCanvas.height = 1;
    const colourContext = colourCanvas.getContext("2d")!;
    const parse = (value: string): Rgba => {
      colourContext.fillStyle = "rgba(0,0,0,0)";
      colourContext.fillStyle = value;
      colourContext.clearRect(0, 0, 1, 1);
      colourContext.fillRect(0, 0, 1, 1);
      const data = colourContext.getImageData(0, 0, 1, 1).data;
      return { r: data[0] ?? 0, g: data[1] ?? 0, b: data[2] ?? 0, a: (data[3] ?? 255) / 255 };
    };
    const over = (top: Rgba, bottom: Rgba): Rgba => ({
      r: top.r * top.a + bottom.r * (1 - top.a),
      g: top.g * top.a + bottom.g * (1 - top.a),
      b: top.b * top.a + bottom.b * (1 - top.a),
      a: 1,
    });
    const background = (element: HTMLElement): Rgba => {
      const layers: Rgba[] = [];
      let current: HTMLElement | null = element;
      while (current) {
        layers.push(parse(getComputedStyle(current).backgroundColor));
        current = current.parentElement;
      }
      return layers.reverse().reduce<Rgba>((base, layer) => over(layer, base), { r: 255, g: 255, b: 255, a: 1 });
    };
    const luminance = (colour: Rgba): number => {
      const channels = [colour.r, colour.g, colour.b].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
    };
    const contrast = (element: HTMLElement): number => {
      const bg = background(element);
      const fg = over(parse(getComputedStyle(element).color), bg);
      const light = Math.max(luminance(fg), luminance(bg));
      const dark = Math.min(luminance(fg), luminance(bg));
      return (light + 0.05) / (dark + 0.05);
    };
    // Text over a gradient/image backdrop cannot be scored from colours alone: the
    // computed backgroundColor is transparent and the real backdrop is not readable.
    const imageBackdrop = (element: HTMLElement): boolean => {
      let current: HTMLElement | null = element;
      while (current) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== "none") return true;
        if (parse(style.backgroundColor).a >= 0.99) return false;
        current = current.parentElement;
      }
      return false;
    };
    const textElements = Array.from(document.body.querySelectorAll<HTMLElement>("*")).filter((element) => {
      if (!visible(element) || ["SCRIPT", "STYLE", "SVG", "NOSCRIPT", "OPTION"].includes(element.tagName)) return false;
      // aria-hidden decorations (for example the footer bullet separator) carry no information.
      if (element.closest("[aria-hidden='true']")) return false;
      return Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()));
    });
    for (const element of textElements) {
      if (imageBackdrop(element)) continue;
      const ratio = contrast(element);
      if (ratio < 4.5) {
        issues.push({ area: "contrast", detail: `${describe(element)} ${ratio.toFixed(2)}:1 (${getComputedStyle(element).color})` });
      }
    }
    const root = document.documentElement;
    // Tables inside an intentional horizontal scroll region are not page-level overflow.
    const inScrollRegion = (element: HTMLElement): boolean => {
      let current = element.parentElement;
      while (current && current !== document.body) {
        const style = getComputedStyle(current);
        if ((style.overflowX === "auto" || style.overflowX === "scroll") && current.getBoundingClientRect().right <= window.innerWidth + 1) return true;
        current = current.parentElement;
      }
      return false;
    };
    const overflow = Array.from(document.body.querySelectorAll<HTMLElement>("*")).filter((element) => {
      if (!visible(element) || ["SVG", "PATH"].includes(element.tagName) || element.closest("[aria-hidden='true']") || element.closest("[inert]")) return false;
      const rect = element.getBoundingClientRect();
      const beyondViewport = (rect.right > window.innerWidth + 1 && rect.left < window.innerWidth) || (rect.left < -1 && rect.right > 0);
      return beyondViewport && !inScrollRegion(element);
    });
    for (const element of overflow.slice(0, 12)) {
      const rect = element.getBoundingClientRect();
      issues.push({ area: "wide-element", detail: `${describe(element)} x=${rect.x.toFixed(0)} width=${rect.width.toFixed(0)}px` });
    }
    if (matchMedia("(pointer: coarse)").matches) {
      const controls = Array.from(document.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,summary,[role='button'],[role='tab'],[role='switch']"));
      for (const control of controls.filter(visible)) {
        if (control.matches(":disabled") || control.getAttribute("aria-disabled") === "true") continue;
        const style = getComputedStyle(control);
        // sr-only controls (skip link, hidden inputs) are clipped away and are not tap targets.
        if (style.clipPath === "inset(50%)" || style.clip === "rect(0px, 0px, 0px, 0px)") continue;
        let rect = control.getBoundingClientRect();
        // Elements scrolled out of view above/left are not reachable; below the fold still is.
        if (rect.right <= 0 || rect.bottom <= 0) continue;
        // A native input inside a label is driven by the whole label row: measure that hit area.
        const label = control.closest("label");
        if (label && ["INPUT", "SELECT", "TEXTAREA"].includes(control.tagName)) {
          const labelRect = label.getBoundingClientRect();
          if (labelRect.width > rect.width && labelRect.height > rect.height) rect = labelRect;
        }
        // Visually hidden inputs (1x1 sr-only checkboxes) are driven by a visible proxy control.
        if (rect.width <= 1 || rect.height <= 1) continue;
        if (rect.width < 44 || rect.height < 44) {
          issues.push({ area: "target-size", detail: `${describe(control)} ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px` });
        }
      }
    }
    const headings = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6")).filter(visible);
    const h1Count = headings.filter((heading) => heading.tagName === "H1").length;
    if (h1Count !== 1) issues.push({ area: "h1", detail: `${h1Count} visible h1 elements` });
    let previousLevel = 0;
    for (const heading of headings) {
      const level = Number(heading.tagName[1]);
      if (previousLevel && level > previousLevel + 1) {
        issues.push({ area: "heading-order", detail: `${describe(heading)} follows h${previousLevel}` });
      }
      previousLevel = level;
    }
    for (const image of Array.from(document.images)) {
      const alt = image.alt.trim();
      const labelledParent = image.closest("[aria-label]");
      const decorative = image.getAttribute("aria-hidden") === "true" || image.getAttribute("role") === "presentation" || labelledParent;
      if (!decorative && (!image.hasAttribute("alt") || (!alt && image.width > 24 && image.height > 24) || /^(image|photo|placeholder)$/i.test(alt))) {
        issues.push({ area: "image-alt", detail: `${describe(image)} alt=${JSON.stringify(alt)}` });
      }
    }
    return {
      issues,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      h1Count,
      headings: headings.map((heading) => `${heading.tagName.toLowerCase()}:${heading.textContent?.trim().slice(0, 50)}`),
    };
  });
  if (result.scrollWidth > result.clientWidth) {
    result.issues.unshift({ area: "horizontal-overflow", detail: `${result.scrollWidth}px scrollWidth > ${result.clientWidth}px clientWidth` });
  }
  result.issues.push(...(await collectInteractiveStateContrast(page)));
  result.issues.push(...(await collectWhatsAppOverlaps(page)));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  page.off("console", onConsole);
  return {
    url,
    status: response?.status() ?? 0,
    viewport,
    theme,
    coarsePointer: await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
    ...result,
    consoleErrors: [...new Set(consoleErrors)],
  };
}

async function readContrast(locator: Locator): Promise<{ ratio: number; label: string } | null> {
  return locator.evaluate((element) => {
    type Rgba = { r: number; g: number; b: number; a: number };
    const colourCanvas = document.createElement("canvas");
    colourCanvas.width = colourCanvas.height = 1;
    const colourContext = colourCanvas.getContext("2d")!;
    const parse = (value: string): Rgba => {
      colourContext.fillStyle = "rgba(0,0,0,0)";
      colourContext.fillStyle = value;
      colourContext.clearRect(0, 0, 1, 1);
      colourContext.fillRect(0, 0, 1, 1);
      const data = colourContext.getImageData(0, 0, 1, 1).data;
      return { r: data[0] ?? 0, g: data[1] ?? 0, b: data[2] ?? 0, a: (data[3] ?? 255) / 255 };
    };
    const over = (top: Rgba, bottom: Rgba): Rgba => ({
      r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1,
    });
    const background = (target: HTMLElement): Rgba => {
      const layers: Rgba[] = [];
      let current: HTMLElement | null = target;
      while (current) { layers.push(parse(getComputedStyle(current).backgroundColor)); current = current.parentElement; }
      return layers.reverse().reduce<Rgba>((base, layer) => over(layer, base), { r: 255, g: 255, b: 255, a: 1 });
    };
    const luminance = (colour: Rgba): number => {
      const channels = [colour.r, colour.g, colour.b].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
    };
    const imageBackdrop = (target: HTMLElement): boolean => {
      let current: HTMLElement | null = target;
      while (current) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== "none") return true;
        if (parse(style.backgroundColor).a >= 0.99) return false;
        current = current.parentElement;
      }
      return false;
    };
    const candidates = [element, ...Array.from(element.querySelectorAll<HTMLElement>("*"))].filter((target) => {
      const style = getComputedStyle(target);
      return style.display !== "none" && style.visibility !== "hidden" && Array.from(target.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()));
    });
    let minimum = Number.POSITIVE_INFINITY;
    for (const target of candidates) {
      if (imageBackdrop(target)) continue;
      const bg = background(target);
      const fg = over(parse(getComputedStyle(target).color), bg);
      const ratio = (Math.max(luminance(fg), luminance(bg)) + 0.05) / (Math.min(luminance(fg), luminance(bg)) + 0.05);
      minimum = Math.min(minimum, ratio);
    }
    if (!Number.isFinite(minimum)) return null;
    const label = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""} "${element.textContent?.trim().replace(/\s+/g, " ").slice(0, 60)}"`;
    return { ratio: minimum, label };
  });
}

async function collectInteractiveStateContrast(page: Page): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const controls = page.locator("a[href],button:not([disabled]),summary,[role='button'],[role='tab']");
  const count = Math.min(await controls.count(), 30);
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (!(await control.isVisible())) continue;
    try {
      await control.hover({ force: true, timeout: 2_000 });
      const hover = await readContrast(control);
      if (hover && hover.ratio < 4.5) issues.push({ area: "hover-contrast", detail: `${hover.label} ${hover.ratio.toFixed(2)}:1` });
      await control.evaluate((element) => (element as HTMLElement).focus({ preventScroll: true }));
      const focus = await readContrast(control);
      if (focus && focus.ratio < 4.5) issues.push({ area: "focus-contrast", detail: `${focus.label} ${focus.ratio.toFixed(2)}:1` });
    } catch {
      // The main pass records genuinely broken controls; state checks skip detached nodes.
    }
  }
  await page.mouse.move(0, 0);
  return issues;
}

async function collectWhatsAppOverlaps(page: Page): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const worst = new Map<string, { area: string; detail: string; overlap: number }>();
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const positions = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round((height - 800) * fraction));
  for (const target of [...new Set(positions)]) {
    const scrollY = await page.evaluate((top) => {
      window.scrollTo({ top, behavior: "instant" });
      return window.scrollY;
    }, target);
    await page.waitForTimeout(120);
    const atPosition = await page.evaluate(() => {
      const whatsapp = Array.from(document.querySelectorAll<HTMLElement>("a[href*='whatsapp'],a[href*='wa.me']")).find((element) => getComputedStyle(element).position === "fixed" && element.getBoundingClientRect().width > 0);
      if (!whatsapp) return [];
      const first = whatsapp.getBoundingClientRect();
      const output: { area: string; detail: string; overlap: number }[] = [];
      const candidates = Array.from(document.querySelectorAll<HTMLElement>("a,button,[role='button'],p,span")).filter((element) => element !== whatsapp && !whatsapp.contains(element));
      for (const element of candidates) {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
        const text = element.textContent?.trim() ?? "";
        const interactive = element.matches("a,button,[role='button']");
        if (!interactive && !/Rs\s*[\d,]+/.test(text)) continue;
        // Only count text that the element itself renders, not a whole container of cards.
        if (!interactive && !Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && /Rs\s*[\d,]+/.test(node.textContent ?? ""))) continue;
        const second = element.getBoundingClientRect();
        if (second.width === 0 || second.height === 0) continue;
        if (second.bottom < 0 || second.top > window.innerHeight) continue;
        // For prices, intersect the rendered glyphs rather than the padded paragraph box.
        const boxes = interactive ? [second] : Array.from(element.childNodes).flatMap((node) => {
          if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return [];
          const range = document.createRange();
          range.selectNodeContents(node);
          return Array.from(range.getClientRects());
        });
        const overlap = boxes.reduce((total, box) => total + Math.max(0, Math.min(first.right, box.right) - Math.max(first.left, box.left)) * Math.max(0, Math.min(first.bottom, box.bottom) - Math.max(first.top, box.top)), 0);
        if (overlap > 16) output.push({ area: "whatsapp-overlap", detail: `${element.tagName.toLowerCase()} "${text.slice(0, 55)}" overlap=${overlap.toFixed(0)}px²`, overlap });
      }
      return output;
    });
    for (const issue of atPosition) {
      const key = issue.detail.replace(/overlap=\d+px²/, "");
      const previous = worst.get(key);
      if (!previous || issue.overlap > previous.overlap) worst.set(key, { ...issue, detail: `${issue.detail} at scrollY=${scrollY}` });
    }
  }
  issues.push(...[...worst.values()].sort((a, b) => b.overlap - a.overlap).map(({ area, detail }) => ({ area, detail })));
  return issues.slice(0, 15);
}

export function issueSummary(audits: PageAudit[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const audit of audits) {
    for (const issue of audit.issues) summary[issue.area] = (summary[issue.area] ?? 0) + 1;
    if (audit.consoleErrors.length) summary["console-error"] = (summary["console-error"] ?? 0) + audit.consoleErrors.length;
  }
  return summary;
}
