// @vitest-environment node

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function toPosixRelative(filePath: string): string {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

describe("admin guard coverage", () => {
  it("every admin page except app/admin/login/page.tsx calls requireAdmin()", () => {
    const adminDir = path.join(ROOT, "app", "admin");
    const pages = walkFiles(adminDir).filter(
      (file) =>
        path.basename(file) === "page.tsx" &&
        toPosixRelative(file) !== "app/admin/login/page.tsx",
    );

    expect(pages.length).toBeGreaterThan(0);

    const missing = pages
      .filter((file) => {
        const content = fs.readFileSync(file, "utf8");
        return !/\brequireAdmin\s*\(/.test(content);
      })
      .map(toPosixRelative);

    expect(missing).toEqual([]);
  });

  it("every admin API route under app/admin/api calls assertAdmin()", () => {
    const adminApiDir = path.join(ROOT, "app", "admin", "api");
    const routes = walkFiles(adminApiDir).filter(
      (file) => path.basename(file) === "route.ts",
    );

    expect(routes.length).toBeGreaterThan(0);

    const missing = routes
      .filter((file) => {
        const content = fs.readFileSync(file, "utf8");
        return !/\bassertAdmin\s*\(/.test(content);
      })
      .map(toPosixRelative);

    expect(missing).toEqual([]);
  });

  it("every actions/admin-*.ts file except admin-login.ts calls assertAdmin()", () => {
    const actionsDir = path.join(ROOT, "actions");
    const actionFiles = fs
      .readdirSync(actionsDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith("admin-") &&
          entry.name.endsWith(".ts") &&
          !entry.name.endsWith(".test.ts") &&
          entry.name !== "admin-login.ts",
      )
      .map((entry) => path.join(actionsDir, entry.name));

    expect(actionFiles.length).toBeGreaterThan(0);

    const missing = actionFiles
      .filter((file) => {
        const content = fs.readFileSync(file, "utf8");
        return !/\bassertAdmin\s*\(/.test(content);
      })
      .map(toPosixRelative);

    expect(missing).toEqual([]);
  });
});
