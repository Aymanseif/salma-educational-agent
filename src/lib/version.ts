/**
 * Single source of truth for the app version.
 *
 * Kept in sync with `package.json` and `CHANGELOG.md` — enforced by
 * `tests/version.test.ts`. Bump it with `npm run release -- <patch|minor|major>`
 * (see `scripts/release.mjs`), never by hand.
 */
export const APP_VERSION = "0.3.0";
export const RELEASED_ON = "2026-10-11";

const [major = "0", minor = "0", patch = "0"] = APP_VERSION.split(".");

export const VERSION_MAJOR = Number(major);
export const VERSION_MINOR = Number(minor);
export const VERSION_PATCH = Number(patch);

/** Short human label, e.g. "v0.1" for 0.1.0 (full "v0.1.1" when a patch exists). */
export const VERSION_LABEL =
  VERSION_PATCH === 0 ? `v${major}.${minor}` : `v${major}.${minor}.${patch}`;
