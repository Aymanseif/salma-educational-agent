#!/usr/bin/env node
/**
 * Self-audit — the app's "keep learning / update itself" loop.
 *
 * Runs two kinds of checks:
 *   1. INTEGRITY (offline): every subject/unit/lesson/quiz/source/teacher entry
 *      is structurally valid and internally consistent.
 *   2. LINKS (network): every URL in the registries is re-checked — YouTube
 *      videos via the official oEmbed API (to confirm the uploader still
 *      exists), everything else via an HTTP request.
 *
 * It writes `content/registry/audit-report.json`. CI runs it on a schedule so
 * link rot and content drift are caught automatically; a link that was OK and
 * is now broken is reported as a REGRESSION and fails the run.
 *
 * Usage: node scripts/self-audit.mjs [--offline] [--no-fail]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content");
const REPORT_PATH = join(CONTENT, "registry", "audit-report.json");
const TOOL = "scripts/self-audit.mjs";

const args = new Set(process.argv.slice(2));
const OFFLINE = args.has("--offline");
const NO_FAIL = args.has("--no-fail");

const VALID_STATUSES = ["VERIFIED", "PARTIALLY_VERIFIED", "SOURCE_MISSING", "NOT_YET_IMPORTED"];
const VALID_CONTENT_STATUSES = [...VALID_STATUSES, "AI_GENERATED", "OFFICIAL", "TEACHER", "MIXED"];

function readJson(rel) {
  return JSON.parse(readFileSync(join(CONTENT, rel), "utf8"));
}

const curriculum = readJson("registry/curriculum.json");
const sources = readJson("registry/sources.json");
const teachers = readJson("registry/teachers.json");
const guidance = readJson("registry/ai-guidance.json");

const subjectFiles = readdirSync(join(CONTENT, "subjects")).filter((f) => f.endsWith(".json"));
const subjects = subjectFiles.map((file) => ({
  id: file.replace(/\.json$/, ""),
  content: JSON.parse(readFileSync(join(CONTENT, "subjects", file), "utf8")),
}));

/* ------------------------------- integrity ------------------------------- */

function checkIntegrity() {
  const issues = [];
  const push = (level, area, message, ref) => issues.push({ level, area, message, ref });
  const counts = { subjects: subjects.length, units: 0, lessons: 0, quizzes: 0 };

  const sourceIds = new Set(sources.sources.map((s) => s.id));
  const unitIds = new Set();
  const lessonIds = new Set();

  for (const { id, content } of subjects) {
    if (!Array.isArray(content.units) || content.units.length === 0) {
      push("error", "subject", "subject has no units", id);
      continue;
    }
    for (const unit of content.units) {
      counts.units += 1;
      if (unitIds.has(unit.id)) push("error", "unit", "duplicate unit id", unit.id);
      unitIds.add(unit.id);
      if (!unit.title?.ar?.trim() || !unit.title?.en?.trim()) {
        push("error", "unit", "unit title must be bilingual", unit.id);
      }
      if (!Array.isArray(unit.lessons) || unit.lessons.length === 0) {
        push("error", "unit", "unit has no lessons", unit.id);
      }
      for (const lesson of unit.lessons ?? []) {
        counts.lessons += 1;
        if (lessonIds.has(lesson.id)) push("error", "lesson", "duplicate lesson id", lesson.id);
        lessonIds.add(lesson.id);
        if (!lesson.title?.ar?.trim() || !lesson.title?.en?.trim()) {
          push("error", "lesson", "lesson title must be bilingual", lesson.id);
        }
        if (lesson.contentStatus && !VALID_CONTENT_STATUSES.includes(lesson.contentStatus)) {
          push("error", "lesson", `invalid contentStatus "${lesson.contentStatus}"`, lesson.id);
        }
        if (!lesson.contentStatus) push("warning", "lesson", "lesson has no contentStatus", lesson.id);
        if (!Array.isArray(lesson.sections) || lesson.sections.length === 0) {
          push("error", "lesson", "lesson has no body sections", lesson.id);
        }
        for (const sourceId of lesson.sourceIds ?? []) {
          if (!sourceIds.has(sourceId)) push("error", "lesson", `unknown sourceId "${sourceId}"`, lesson.id);
        }
        const quizzes = lesson.quizzes ?? [];
        if (quizzes.length === 0) push("error", "lesson", "lesson has no practice quiz", lesson.id);
        for (const q of quizzes) {
          counts.quizzes += 1;
          if (!Array.isArray(q.options) || q.options.length < 2) {
            push("error", "quiz", "fewer than two options", q.id);
          }
          if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= (q.options?.length ?? 0)) {
            push("error", "quiz", "correctIndex out of range", q.id);
          }
          if (!q.explanation?.ar?.trim() || !q.explanation?.en?.trim()) {
            push("error", "quiz", "quiz explanation must be bilingual", q.id);
          }
        }
      }
    }
  }

  for (const source of sources.sources ?? []) {
    if (!VALID_STATUSES.includes(source.status)) {
      push("error", "source", `invalid status "${source.status}"`, source.id);
    }
    if (!/^https?:\/\//.test(source.url ?? "")) {
      push("error", "source", "source url is not http(s)", source.id);
    }
  }

  for (const teacher of teachers.teachers ?? []) {
    if (teacher.verification !== "UNVERIFIED_IDENTITY" && teacher.verification !== "VERIFIED") {
      push("error", "teacher", `invalid verification "${teacher.verification}"`, teacher.id);
    }
    if (!teacher.verificationNote?.ar?.trim() || !teacher.verificationNote?.en?.trim()) {
      push("error", "teacher", "verificationNote must be bilingual", teacher.id);
    }
    if ((teacher.candidateResources ?? []).length === 0) {
      push("warning", "teacher", "teacher has no candidate resources", teacher.id);
    }
    for (const resource of teacher.candidateResources ?? []) {
      if (!/^https?:\/\//.test(resource.url ?? "")) {
        push("error", "teacher", "resource url is not http(s)", `${teacher.id} ${resource.url}`);
      }
      if (!resource.label?.trim()) push("error", "teacher", "resource has empty label", teacher.id);
    }
    if (teacher.voiceUrl && !/^https?:\/\//.test(teacher.voiceUrl)) {
      push("error", "teacher", "voiceUrl is not http(s)", teacher.id);
    }
  }

  if (!(typeof guidance.version === "number" && guidance.version > 0)) {
    push("error", "guidance", "ai-guidance version must be a positive number");
  }
  for (const loc of ["ar", "en"]) {
    if (!Array.isArray(guidance.rules?.global?.[loc]) || guidance.rules.global[loc].length === 0) {
      push("error", "guidance", `global ${loc} rules are missing`);
    }
  }

  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;
  return { ok: errors === 0, errors, warnings, counts, issues };
}

/* --------------------------------- links --------------------------------- */

function collectLinks() {
  const links = [];
  for (const source of sources.sources ?? []) {
    links.push({ url: source.url, owner: `source:${source.id}`, kind: "official" });
  }
  for (const resource of curriculum.additionalOfficialResources ?? []) {
    links.push({ url: resource.url, owner: `official:${resource.id}`, kind: resource.pdf ? "official-pdf" : "official" });
  }
  for (const teacher of teachers.teachers ?? []) {
    if (teacher.voiceUrl) links.push({ url: teacher.voiceUrl, owner: `teacher:${teacher.id}:voice`, kind: "voice" });
    for (const resource of teacher.candidateResources ?? []) {
      links.push({ url: resource.url, owner: `teacher:${teacher.id}`, kind: `candidate:${resource.kind ?? "link"}` });
    }
  }
  // De-duplicate by URL, keeping the first owner.
  const seen = new Map();
  for (const link of links) if (!seen.has(link.url)) seen.set(link.url, link);
  return [...seen.values()];
}

function classify(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "invalid";
  }
  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "youtube.com" && parsed.pathname === "/watch") return "youtube-video";
  if (host === "youtu.be" && parsed.pathname.length > 1) return "youtube-video";
  if (host === "youtube.com" && parsed.pathname.startsWith("/shorts/")) return "youtube-video";
  if (host === "youtube.com" || host === "youtu.be") return "youtube-channel";
  return "generic";
}

async function timedFetch(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { redirect: "follow", ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkLink(link) {
  const kind = classify(link.url);
  if (kind === "invalid") return { status: "broken", note: "malformed url" };
  try {
    if (kind === "youtube-video") {
      const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(link.url)}&format=json`;
      const res = await timedFetch(oembed, { method: "GET" }, 20000);
      if (res.status === 200) {
        const data = await res.json().catch(() => null);
        if (data?.title) {
          return { status: "ok", http: 200, note: `by ${data.author_name ?? "?"}` };
        }
        return { status: "blocked", http: 200, note: "oembed without title" };
      }
      if (res.status === 404) return { status: "broken", http: 404, note: "video unavailable" };
      return { status: "blocked", http: res.status, note: "oembed not 200" };
    }

    const headers = {
      "user-agent":
        "Mozilla/5.0 (compatible; SalmaEducationalAgentAudit/1.0; +https://github.com/Aymanseif/salma-educational-agent)",
    };
    let res = await timedFetch(link.url, { method: "HEAD", headers }, 20000);
    if ([403, 405, 501].includes(res.status)) {
      res = await timedFetch(link.url, { method: "GET", headers }, 20000);
    }
    const status = res.status;
    if (status >= 200 && status < 400) return { status: "ok", http: status };
    if ([401, 403, 429].includes(status)) return { status: "blocked", http: status, note: "reachable but blocks automated checks" };
    return { status: "broken", http: status };
  } catch (error) {
    return { status: "broken", note: error?.name === "AbortError" ? "timeout" : "network error" };
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = new Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

/* ---------------------------------- main --------------------------------- */

async function main() {
  const integrity = checkIntegrity();
  const links = collectLinks();

  const previous = existsSync(REPORT_PATH)
    ? JSON.parse(readFileSync(REPORT_PATH, "utf8"))
    : null;
  const previousByUrl = new Map((previous?.links ?? []).map((l) => [l.url, l.status]));

  let checked;
  if (OFFLINE) {
    checked = links.map((link) => ({ ...link, status: "unchecked", note: "offline mode" }));
  } else {
    const results = await mapWithConcurrency(links, 6, checkLink);
    checked = links.map((link, i) => ({ ...link, ...results[i] }));
  }

  const summary = {
    total: checked.length,
    ok: checked.filter((l) => l.status === "ok").length,
    blocked: checked.filter((l) => l.status === "blocked").length,
    broken: checked.filter((l) => l.status === "broken").length,
    unchecked: checked.filter((l) => l.status === "unchecked").length,
    regressions: checked.filter((l) => l.status === "broken" && previousByUrl.get(l.url) === "ok").length,
  };

  const report = {
    generatedOn: new Date().toISOString(),
    tool: TOOL,
    offline: OFFLINE,
    integrity,
    links: checked.map((l) => ({
      url: l.url,
      owner: l.owner,
      kind: l.kind,
      status: l.status,
      ...(l.http ? { http: l.http } : {}),
      ...(l.note ? { note: l.note } : {}),
    })),
    summary,
  };

  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Self-audit ${integrity.ok ? "OK" : "FAILED"} — integrity: ${integrity.errors} error(s), ${integrity.warnings} warning(s)`);
  console.log(`  content: ${integrity.counts.subjects} subjects, ${integrity.counts.units} units, ${integrity.counts.lessons} lessons, ${integrity.counts.quizzes} quiz questions`);
  console.log(`  links: ${summary.ok} ok, ${summary.blocked} blocked, ${summary.broken} broken, ${summary.unchecked} unchecked (of ${summary.total}); regressions: ${summary.regressions}`);
  for (const issue of integrity.issues.filter((i) => i.level === "error").slice(0, 20)) {
    console.log(`  ✗ [${issue.area}] ${issue.message}${issue.ref ? ` (${issue.ref})` : ""}`);
  }
  for (const link of checked.filter((l) => l.status === "broken")) {
    console.log(`  ✗ broken link: ${link.url} (${link.note ?? link.http ?? "?"}) [${link.owner}]`);
  }
  console.log(`  report: ${REPORT_PATH.replace(ROOT, ".")}`);

  const failed = integrity.errors > 0 || summary.broken > 0 || summary.regressions > 0;
  if (failed && !NO_FAIL) process.exit(1);
}

main().catch((error) => {
  console.error("self-audit crashed:", error);
  process.exit(1);
});
