// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function rel(file: string) {
  return relative(root, file).replaceAll("\\", "/");
}

function missing(files: string[], needle: string) {
  return files
    .filter((file) => !readFileSync(file, "utf8").includes(needle))
    .map(rel);
}

describe("admin guard coverage", () => {
  it("every admin page checks the admin session itself", () => {
    const pages = walk(join(root, "app", "admin")).filter(
      (file) =>
        /[\\/]page\.tsx$/.test(file) &&
        !rel(file).startsWith("app/admin/login/"),
    );
    expect(pages.length).toBeGreaterThan(0);
    expect(missing(pages, "requireAdmin")).toEqual([]);
  });

  it("every admin API route checks the admin session", () => {
    const routes = walk(join(root, "app", "admin", "api")).filter((file) =>
      /[\\/]route\.ts$/.test(file),
    );
    expect(routes.length).toBeGreaterThan(0);
    expect(missing(routes, "assertAdmin")).toEqual([]);
  });

  it("every admin server action file checks the admin session", () => {
    const actions = readdirSync(join(root, "actions"))
      .filter(
        (name) =>
          /^admin-.+\.ts$/.test(name) &&
          !name.endsWith(".test.ts") &&
          name !== "admin-login.ts",
      )
      .map((name) => join(root, "actions", name));
    expect(actions.length).toBeGreaterThan(0);
    expect(missing(actions, "assertAdmin")).toEqual([]);
  });
});