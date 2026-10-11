#!/usr/bin/env node
/**
 * Release / upgrade tool.
 *
 *   npm run release -- patch        # 0.1.0 -> 0.1.1
 *   npm run release -- minor        # 0.1.0 -> 0.2.0
 *   npm run release -- major        # 0.1.0 -> 1.0.0
 *   npm run release -- 0.2.3        # set an explicit version
 *
 * It keeps everything in sync:
 *   - package.json         (version)
 *   - package-lock.json    (root version fields)
 *   - src/lib/version.ts   (APP_VERSION + RELEASED_ON)
 *   - CHANGELOG.md         (new versioned section right under [Unreleased])
 *
 * Options:
 *   --date YYYY-MM-DD   override the release date (default: today)
 *   --notes "..."       changelog bullet(s) for this release
 *   --tag               create the local git tag vX.Y.Z
 *
 * It never commits or pushes for you: it prints the exact git commands.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}
function write(rel, text) {
  writeFileSync(join(ROOT, rel), text, "utf8");
}

function nextVersion(current, kind) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) throw new Error(`current version is not x.y.z: ${current}`);
  const [major, minor, patch] = match.slice(1).map(Number);
  if (kind === "patch") return `${major}.${minor}.${patch + 1}`;
  if (kind === "minor") return `${major}.${minor + 1}.0`;
  if (kind === "major") return `${major + 1}.0.0`;
  if (/^\d+\.\d+\.\d+$/.test(kind)) return kind;
  throw new Error(`unknown release kind "${kind}" (use patch|minor|major|x.y.z)`);
}

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positionals = args.filter((a) => !a.startsWith("--"));
const readFlag = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const kind = positionals[0];
if (!kind) {
  console.error("Usage: npm run release -- <patch|minor|major|x.y.z> [--date YYYY-MM-DD] [--notes \"...\"] [--tag]");
  process.exit(1);
}

const pkg = JSON.parse(read("package.json"));
const current = pkg.version;
const version = nextVersion(current, kind);
const date = readFlag("--date") || new Date().toISOString().slice(0, 10);
const notes = readFlag("--notes");
const tag = flags.has("--tag");

// 1. package.json
pkg.version = version;
write("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

// 2. package-lock.json (root package version fields only)
try {
  const lock = JSON.parse(read("package-lock.json"));
  lock.version = version;
  if (lock.packages?.[""]) lock.packages[""].version = version;
  write("package-lock.json", `${JSON.stringify(lock, null, 2)}\n`);
} catch {
  console.warn("! package-lock.json not updated (missing or unparsable)");
}

// 3. src/lib/version.ts
const versionTs = read("src/lib/version.ts")
  .replace(/export const APP_VERSION = "[^"]+";/, `export const APP_VERSION = "${version}";`)
  .replace(/export const RELEASED_ON = "[^"]+";/, `export const RELEASED_ON = "${date}";`);
write("src/lib/version.ts", versionTs);

// 4. CHANGELOG.md — insert a new section right after the [Unreleased] heading
const changelog = read("CHANGELOG.md");
const body = notes
  ? notes.split(";").map((line) => `- ${line.trim()}`).join("\n")
  : "- (describe the changes in this release)";
const section = `## [${version}] - ${date}\n\n### Changed\n${body}\n`;
const anchor = "## [Unreleased]\n";
const updated = changelog.includes(anchor)
  ? changelog.replace(anchor, `${anchor}\n${section}`)
  : `${changelog.trimEnd()}\n\n${section}`;
write("CHANGELOG.md", updated);

// 5. optional local tag
if (tag) {
  execFileSync("git", ["tag", `v${version}`], { cwd: ROOT, stdio: "inherit" });
}

console.log(`\nReleased ${current} -> ${version} (${date})`);
console.log("Updated: package.json, package-lock.json, src/lib/version.ts, CHANGELOG.md");
if (tag) console.log(`Tagged v${version}`);
console.log("\nNext steps:");
console.log("  npm run typecheck && npm test && npm run build");
console.log("  git add -A && git commit -m \"chore(release): v" + version + "\"");
console.log(`  git push origin main${tag ? " --follow-tags" : ""}`);
if (!tag) console.log(`  (or re-run with --tag to create v${version})`);
