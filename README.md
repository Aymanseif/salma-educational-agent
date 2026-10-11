# Salma Educational Agent — وكيل سلمى التعليمي

A **mobile-first, fully bilingual (Arabic ⇄ English)** educational web app for the
**Egyptian Baccalaureate 2026–2027**, **Arts and Humanities track** (`مسار الآداب والفنون`),
Grade 2 (`الصف الثاني`).

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**, deployable to **Vercel**.

> **Version:** `v0.1` (`0.1.0`) — see [CHANGELOG.md](./CHANGELOG.md). The app follows
> [Semantic Versioning](https://semver.org/) and ships a release tool
> ([`npm run release`](./scripts/release.mjs)) so it can be upgraded cleanly.

> ⚠️ **Honesty first.** This project deliberately separates **verified curriculum
> data**, **AI-generated explanations**, and **missing content**. Nothing is
> fabricated. Missing syllabus content is shown as missing, never invented.

---

## Table of contents
1. [Features](#features)
2. [Quick start](#quick-start)
3. [Curriculum coverage & source status](#curriculum-coverage--source-status)
4. [Content architecture (auditable)](#content-architecture-auditable)
5. [Multi-LLM AI layer (free-first)](#multi-llm-ai-layer-free-first)
6. [Internationalization (AR/EN, RTL/LTR)](#internationalization-aren-rtlltr)
7. [Audio, visuals, quizzes, progress](#audio-visuals-quizzes-progress)
8. [Testing & quality](#testing--quality)
9. [Deployment (Vercel)](#deployment-vercel)
10. [Security & secrets](#security--secrets)
11. [External services](#external-services)
12. [Legal & attribution](#legal--attribution)
13. [Teacher names & verification policy](#teacher-names--verification-policy)
14. [Self-improvement loop (smarter AI + automated audit)](#self-improvement-loop-smarter-ai--automated-audit)
15. [Versioning & upgrades](#versioning--upgrades)

---

## Features

- **Student home** with overall + per-subject progress.
- **Four subject pages** (Arabic, English, National History, Psychology) with the
  teacher names supplied for the student file.
- **Searchable curriculum** by subject / unit / lesson (Arabic-normalized search).
- **Lesson viewer** with citations, source status badges, and original explanations.
- **Interactive quizzes** with immediate feedback and explanations.
- **Browser audio** via the Web Speech API (no OS-specific commands).
- **Visual materials**: inline SVG diagrams (history timeline, psychology concept map,
  Arabic grammar tree).
- **English pronunciation / listening** support with IPA + per-word playback.
- **Progress tracking** (lessons reviewed, quiz scores) persisted in `localStorage`.
- **Clear provenance badges**: `VERIFIED`, `PARTIALLY_VERIFIED`, `SOURCE_MISSING`,
  `NOT_YET_IMPORTED`, `AI_GENERATED`.
- **Multi-LLM "Ask AI"** endpoint: free-first provider chain with graceful absence.
- **Mobile loading / empty / error states.**

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # run the production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest (unit + component + api)
```

Copy `.env.example` → `.env.local` if you want to enable the optional AI layer.

---

## Curriculum coverage & source status

**Target confirmed from the official source** on **2026-10-10**:

- Academic year: **2026-2027**
- Grade: **Grade 2 (الصف الثاني الثانوي)**
- Track: **Arts and Humanities (مسار الآداب والفنون)**
- Official index: <https://ellibrary.moe.gov.eg/EgyptianBaccalaureate/>

| Subject | Units/lessons imported | Content status | Official textbook |
|---|---|---|---|
| **Arabic** (اللغة العربية) | 6 units · 18 lessons (titles verified) | **All 18** lessons have an AI-generated explanation + practice quiz (each `AI_GENERATED`, with a per-lesson `contentNote`) | Parts 1–2, Story, Assessments (HTTP 200) |
| **National History** (التاريخ الوطني) | 6 units · 24 lessons (titles verified) | **All 24** lessons have an AI-generated explanation + practice quiz (`AI_GENERATED`) | Parts 1–2, Assessments (HTTP 200) |
| **Psychology** (علم النفس) | 6 units · 24 lessons (titles verified) | **All 24** lessons have an AI-generated explanation + practice quiz (`AI_GENERATED`) | Parts 1–2, Assessments (HTTP 200) |
| **English** (اللغة الإنجليزية) | 10 units · 40 lessons (titles **OCR-extracted** from the scanned PDF → `PARTIALLY_VERIFIED`, manual review pending) | **All 40** lessons have an AI-generated explanation + practice quiz (`AI_GENERATED`); 2 clearly-labeled AI **practice** modules included | Parts 1–2, Story, Assessments (HTTP 200) |

All four subjects now cover the **full academic year** (Parts 1 and 2 of the official
books): Arabic 18 lessons (units 1–6), National History 24 (units 1–6), Psychology 24
(units 1–6), and English 40 lessons (units 1–10 across both parts) — **106 lessons** in total.

**Important distinction:** the unit/lesson **titles** are factual metadata extracted from
the official books, but the lesson **bodies** (explanations, examples, key points,
practice questions) are **original, AI-generated study aids** based on those titles —
they are **not** the official textbook text and do **not** replace it. Every lesson
carries an `AI_GENERATED` label and a bilingual `contentNote`; the official PDF is
always linked for the authoritative wording.

**How unit/lesson titles were obtained:** extracted **textually** from the official
textbooks' tables of contents (`pypdf`) for Arabic, History, and Psychology, and by
**OCR** (RapidOCR on rendered pages) for English, whose official PDFs are scans with
no text layer. These are factual **metadata** (titles), not reproduced body content.
Titles from OCR are marked `PARTIALLY_VERIFIED` with a note pending manual review;
some textually extracted titles may also contain minor rendering artifacts (e.g.,
reversed digits in RTL) and are flagged the same way.

**What is NOT claimed:**
- No claim that the AI explanations reproduce the official textbook, its exact
  framing, or its exercises; they are study aids only.
- English (English Language) official unit *titles* are imported via **OCR** from the
  scanned PDFs and marked `PARTIALLY_VERIFIED` (manual review pending); the OCR pass
  is imperfect, and only clearly-labeled AI practice/explanation content is provided.
- No official teacher-authored content is included or attributed.
- No generated “media” or “teacher integrations” are claimed to exist.

All 14 official PDF links were verified to return **HTTP 200** with real payloads
before being listed. Sizes and check dates are recorded in
`content/registry/sources.json`.

---

## Content architecture (auditable)

Curriculum content is **kept separate from application code**:

```
content/
├── registry/
│   ├── curriculum.json   # subjects, grade, track, statuses, official pages
│   ├── sources.json       # source inventory + teacher candidate resources
│   ├── teachers.json      # student + teacher registry (names as metadata)
│   ├── ai-guidance.json   # human-reviewed AI rules + glossary (versioned)
│   └── audit-report.json  # latest self-audit output (regenerated by the loop)
└── subjects/
    ├── arabic.json        # units → lessons → sections → quizzes
    ├── english.json       # 10 units → lessons → sections → quizzes (OCR titles) + supplements
    ├── history.json
    └── psychology.json
```

`scripts/self-audit.mjs` (run via `npm run audit`) regenerates `audit-report.json`;
`.github/workflows/self-audit.yml` runs it on a schedule and commit.

- `src/lib/data.ts` is a thin, read-only access layer.
- `src/lib/content-types.ts` defines the shapes.
- An automated test (`tests/curriculum.test.ts`) enforces integrity: unique ids,
  bilingual titles, valid statuses, quiz validity, and that any `VERIFIED` lesson
  actually carries content or an official source link.

---

## Multi-LLM AI layer (free-first)

`POST /api/ai` explains a lesson with an **OpenAI-compatible** chat request. All
supported providers share one code path; the route walks a **free-first** list of
**configured** providers and **falls back automatically** on error, rate-limit, or
timeout.

| Order | Provider | Env key(s) | Free? | Default model |
|---|---|---|---|---|
| 1 | Groq | `GROQ_API_KEY` | ✅ | `llama-3.3-70b-versatile` |
| 2 | Google Gemini (OpenAI-compat) | `GEMINI_API_KEY`, `GOOGLE_API_KEY` | ✅ | `gemini-2.0-flash` |
| 3 | Cerebras | `CEREBRAS_API_KEY` | ✅ | `llama-3.3-70b` |
| 4 | OpenRouter | `OPENROUTER_API_KEY` | ✅ (`:free` models) | `meta-llama/llama-3.3-70b-instruct:free` |
| 5 | Mistral | `MISTRAL_API_KEY` | ✅ | `mistral-small-latest` |
| 6 | Together AI | `TOGETHER_API_KEY` | ✅ | `…-Instruct-Turbo-Free` |
| 7 | Ollama (local) | `OLLAMA_API_KEY` (optional) | ✅ | `llama3.1` |
| 8 | OpenAI | `OPENAI_API_KEY` | ❌ | `gpt-4o-mini` |
| 9 | Custom OpenAI-compatible | `AI_API_KEY` + `AI_API_BASE_URL` (+ `AI_MODEL`) | — | configurable |

Controls (all optional):
- `AI_PROVIDER_ORDER` — override precedence, e.g. `gemini,groq,openrouter`.
- `AI_MODEL` — force one model across providers.
- `AI_PROVIDER_ORDER=…,ollama` — explicitly enable a keyless local server.

**Graceful absence:** with no provider configured, `POST /api/ai` returns **HTTP 501**
with a friendly message and a list of free providers; the UI (`AskAi`) simply shows
the message. **The app is fully functional without any AI key.**

**Anti-fabrication prompt:** the server instructs the model to explain only the named
lesson, avoid inventing syllabus/exam content, say when unsure, and always label its
output as **AI-generated**. Results are returned with `label: "AI_GENERATED"` plus the
used provider/model.

**Grounding + curated guidance (makes answers smarter):** before calling a provider, the
route builds a compact **lesson brief** from the app's *own* verified content
(`src/lib/grounding.ts`) — subject, unit and lesson titles, title status, the app
summary, up to six key points, and the official source titles — and injects it, so
answers stay anchored to the named lesson instead of drifting into generic chat. It also
injects the human-reviewed rules from `content/registry/ai-guidance.json` (global +
per-subject rules, plus a small terminology glossary). The response reports
`grounded: true/false` and `guidanceVersion`. See
[Self-improvement loop](#self-improvement-loop-smarter-ai--automated-audit).

Run it test-free with a local model:

```bash
AI_PROVIDER_ORDER=ollama npm run dev   # then POST /api/ai
```

---

## Internationalization (AR/EN, RTL/LTR)

- **Arabic is the default** (`dir="rtl"`); **English** switches to `dir="ltr"`.
- A visible **language switcher** in the header.
- Choice is **persisted** (`localStorage` + `salma_locale` cookie).
- `document.documentElement.lang` / `dir` are updated live.
- UI strings live in `src/lib/i18n.ts`; both dictionaries must have identical keys
  (enforced by TypeScript via `const en: Dict` **and** by `tests/i18n.test.ts`).
- **Progress is preserved** across language switches (progress is language-agnostic
  and keyed by `subjectId/lessonId`).
- **Lesson content is bilingual data** (`{ ar, en }` per field); the viewer renders
  the active language. Where a lesson is published in its original language, that is
  reflected honestly (e.g., English practice text keeps an English reading).

---

## Audio, visuals, quizzes, progress

- **Audio** — `src/lib/speech.ts` wraps `window.speechSynthesis` (Web Speech API).
  Nothing is OS-specific; when unsupported, a clear message is shown.
- **Visuals** — `src/components/Visual.tsx` renders original inline SVGs.
- **Quizzes** — `src/components/QuizCard.tsx` gives immediate correct/incorrect
  feedback + explanation, tracks a score, and records the attempt.
- **Progress** — pure logic in `src/lib/progress.ts` (unit-tested), persisted by
  `src/lib/progress-context.tsx` under `salma.progress.v1`.

---

## Testing & quality

```bash
npm run typecheck   # TypeScript strict
npm test            # Vitest
npm run lint        # ESLint (next/core-web-vitals + next/typescript)
npm run build       # Next production build
npm run audit       # self-audit: integrity + every external link
npm run audit:offline   # integrity only (no network)
```

Coverage includes:
- `tests/i18n.test.ts` — AR/EN key parity, no empty strings.
- `tests/curriculum.test.ts` — registry integrity, statuses, source references,
  quiz validity, “no VERIFIED without content/source”, teachers flagged unverified.
- `tests/grounding.test.ts` — the lesson brief is bilingual and anchored; honesty,
  style and curated guidance rules reach the system prompt.
- `tests/audit-report.test.ts` — the committed self-audit report stays consistent
  with the live content (counts match) and carries no broken links.
- `tests/version.test.ts` — `package.json`, `package-lock.json`, `src/lib/version.ts`
  and `CHANGELOG.md` all agree on the app version.
- `tests/quiz.test.ts` — scoring + validation.
- `tests/progress.test.ts` — reviewed/quiz stats, immutability.
- `tests/ai-providers.test.ts` — free-first ordering, overrides, custom/local rules.
- `tests/api.test.ts` — 501 graceful absence, 400/404, provider success, **fallback
  chain**, all-fail 502, `/api/health`.
- `tests/components/*` — quiz feedback + lesson rendering (AR default), empty state,
  source links, prev/next.

---

## Deployment (Vercel)

1. Push this folder to a Git repository.
2. Import it into Vercel (framework auto-detected: **Next.js**).
3. (Optional) add any AI provider keys as **Environment Variables**.
4. Deploy. No build-time secrets are required.

No environment variable is required for the core app to build and run.

---

## Security & secrets

- Secrets are **server-only**. The AI key is read from `process.env` inside the
  route handler and is never sent to the client bundle.
- `.env*` (except `.env.example`) is git-ignored.
- `/api/ai` validates input, caps request time (25s `AbortController`), and never
  logs student content.
- All curriculum images/documents are **linked**, not proxied.

---

## External services

| Service | Purpose | Required? | Notes |
|---|---|---|---|
| Google Fonts (Cairo, Inter) | Arabic/Latin typography | No (graceful fallback) | loaded via `<link>` |
| Web Speech API | Text-to-speech | No (feature detection) | browser built-in |
| LLM provider (Groq/Gemini/…) | Optional “Ask AI” | No | free-first chain; 501 if unset |
| Official MOE blob storage | Official textbook links | No | link-only, not downloaded at runtime |

---

## Legal & attribution

- Official textbook content is **© 2026 Ministry of Education and Technical
  Education (Egypt). All rights reserved.** The app **links** to official PDFs and
  does **not** republish their body text.
- Lesson bodies in this app are **original, AI-generated** explanations created for
  study support, clearly labeled `AI_GENERATED`, and based on verified titles/themes.
- This project is **not affiliated** with the Ministry of Education.
- No paywalls, DRM, or access controls were bypassed; only publicly reachable
  official resources were referenced.

---

## Teacher names & verification policy

The student file names four teachers:

| Subject | Name on file |
|---|---|
| Arabic | الأستاذ محمد صلاح |
| English | الأستاذ أحمد سامي النجار |
| Psychology | الأستاذة سماح صبحي |
| National History | الأستاذ أحمد باشا |

**These names are preserved as metadata only.** Public search shows plausible
channels for some of these (common) names, but **identity cannot be established from
a name match alone**, so every teacher is recorded as **`UNVERIFIED_IDENTITY`** and
flagged for **manual verification**. **No content inside the app is attributed to
these teachers**, and no biographies/qualifications are invented.

Voice/video links recorded in `teachers.json` were each checked through the **official
YouTube oEmbed API** (which reports the real uploader). A link is only shown as a
teacher's voice once the uploader matches; videos found to belong to *other* teachers
were removed (see `auditLessons` in `content/registry/ai-guidance.json`).

---

## Self-improvement loop (smarter AI + automated audit)

The app improves itself over time in two honest, verifiable ways — it never invents
content and never silently rewrites itself.

**1. Smarter answers (grounding + curated guidance).**
- `src/lib/grounding.ts` builds a lesson-anchored brief from the app's own verified
  content and injects it into the AI prompt (see the AI section above).
- `content/registry/ai-guidance.json` is a **human-reviewed** rule set (version +
  `updatedOn`): global anti-fabrication rules, per-subject teaching rules, a small
  terminology glossary, and a log of `auditLessons`. Bumping `version` and adding rules
  is how the assistant "learns". Its `version` is returned by `/api/ai` (`guidanceVersion`).

**2. Automated audit loop (`npm run audit`).**
- `scripts/self-audit.mjs` performs **integrity checks** (every subject/unit/lesson/
  quiz/source/teacher entry is valid and consistent) and **link checks** (every URL in
  the registries is re-checked — YouTube videos via oEmbed to confirm the uploader,
  everything else via HTTP).
- It writes `content/registry/audit-report.json` (timestamp, per-link status, counts,
  and any **regressions** — links that were OK and are now broken). `/sources` shows a
  live self-check badge from this report.
- `.github/workflows/self-audit.yml` runs it on **every push** and **weekly**
  (`cron`), failing the build on integrity errors, broken links or regressions, and
  **committing the refreshed report** on the scheduled run (`[skip ci]`).
- `tests/audit-report.test.ts` keeps the committed report in sync with the content, so
  adding or changing lessons without re-running the audit fails CI.

---

## Versioning & upgrades

The app follows **Semantic Versioning**. The current release is **v0.1.0**.

- `src/lib/version.ts` is the single source of truth (`APP_VERSION`, `RELEASED_ON`,
  `VERSION_LABEL`). It is shown in the footer and returned by `/api/health`.
- `package.json`, `package-lock.json`, `src/lib/version.ts` and `CHANGELOG.md` stay in
  sync; `tests/version.test.ts` fails if they ever disagree.

**Upgrade (release) with one command:**

```bash
npm run release -- patch          # 0.1.0 -> 0.1.1
npm run release -- minor          # 0.1.0 -> 0.2.0
npm run release -- major          # 0.1.0 -> 1.0.0
npm run release -- 0.2.0 --tag    # explicit version + local git tag v0.2.0
npm run release -- minor --notes "Added a Grade-3 practice bank; faster audio"
```

The script updates the four files above and prints the exact `git add/commit/push`
commands (it never commits or pushes on its own). Then:

```bash
npm run typecheck && npm test && npm run build && npm run audit
git add -A && git commit -m "chore(release): v0.2.0"
git push origin main --follow-tags
```

Because this is a standard Next.js app on Vercel, **a new tag/commit upgrades the
deployed site automatically** — no migration step required. Content-only updates can
ship without a version bump; the self-audit loop keeps them honest.

---

## Salma Center

**مركز سلمى** — `Salma Center`
Egyptian Baccalaureate 2026–2027 · Arts and Humanities track · Grade 2.
