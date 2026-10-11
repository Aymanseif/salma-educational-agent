import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { APP_VERSION, RELEASED_ON, VERSION_LABEL } from "@/lib/version";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8")) as {
  version: string;
  packages: Record<string, { version?: string }>;
};
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");

describe("versioning", () => {
  it("keeps a single source of truth in sync", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.version).toBe(APP_VERSION);
    expect(lock.version).toBe(APP_VERSION);
    expect(lock.packages[""]?.version).toBe(APP_VERSION);
  });

  it("exposes a short label and a release date", () => {
    expect(VERSION_LABEL.startsWith("v")).toBe(true);
    expect(APP_VERSION.startsWith(VERSION_LABEL.slice(1))).toBe(true);
    expect(RELEASED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("documents the current version in the changelog", () => {
    expect(changelog).toContain(`## [${APP_VERSION}]`);
  });
});
