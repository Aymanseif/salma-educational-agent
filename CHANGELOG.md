# Changelog

All notable changes to the Salma Educational Agent are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

Use `npm run release -- <patch|minor|major>` to bump the version; it updates
`package.json`, `src/lib/version.ts` and inserts a new entry below. Keep the
`[Unreleased]` section for work in progress.

## [Unreleased]

## [0.1.1] - 2026-10-11

### Changed
- Rebrand: replaced the student's full name with Salma Center
- generalized the home greeting

## [0.1.0] - 2026-10-11

First tagged release (v0.1).

### Added
- Bilingual (AR/EN) curriculum for the Egyptian Baccalaureate 2026-2027, Grade 2,
  Arts and Humanities: 4 subjects, 28 units, **106 lessons** (Arabic, English,
  National History, Psychology), each with an original AI-generated explanation
  and a practice quiz.
- Prominent provenance labels: `VERIFIED`, `PARTIALLY_VERIFIED`, `SOURCE_MISSING`,
  `NOT_YET_IMPORTED`, `AI_GENERATED`; official sources recorded with HTTP checks.
- Four teacher entries with deep-researched, **oEmbed-verified** voice/video links
  and honest attribution (`UNVERIFIED_IDENTITY`, strong vs. partial matches).
- Optional multi-provider "Ask AI" endpoint (free-first chain, graceful 501).
- **Grounded AI**: lesson-anchored briefs + the human-reviewed rules in
  `content/registry/ai-guidance.json` (versioned).
- **Self-audit loop**: `npm run audit` checks integrity and every external link
  (YouTube via oEmbed), writes `content/registry/audit-report.json`, and runs on
  a schedule via `.github/workflows/self-audit.yml`.
- Version badge in the footer, `/api/health` reporting, and semver release tooling.
