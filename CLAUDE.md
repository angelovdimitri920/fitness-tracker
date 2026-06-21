# PF Fitness Tracker — Project Context & Development Notes

Context for the developer and for any future [Claude Code](https://claude.com/claude-code)
session working on this repo. The user-facing overview lives in [`README.md`](README.md); this
file is the deeper "how it's built, what's been done, what's left."

---

## 1. What this is

A **single-file, offline-capable PWA** for one user's personal training. The entire app is
`pf_workout_tracker.html` (~29k lines): inline CSS + vanilla JS, **no build step, no framework,
no dependencies**. It tracks gym workouts, nutrition, running/marathon, body metrics, recovery,
and progress, and installs to a phone home screen to run offline.

**Design philosophy:** ship lean, single-file, local-first. All state is one JS object (`S`)
persisted to `localStorage`. No backend, no accounts, no analytics.

---

## 2. Architecture (orientation for editing)

- **State:** one global object `S`, persisted to `localStorage['pf_v4']` via `saveS()`; created
  by `initS()`, loaded by `loadS()`, schema-upgraded by `migrateState()` /
  `rehydrateCustomCatalogues()`. Other `pf_*` keys: `pf_nasCfg` (NAS creds), `pf_anthropicKey`
  (AI key), `pf_lastBackup`, `pf_advSuggest`, `pf_lock`, `pf_nasLastBackup`.
- **Pages (10):** home, today, plan, equipment, marathon, body, nutrition, goals, progress,
  history. Navigation via `switchPage(id, btn)`. Each has `build*/render*/update*` functions.
- **Dates:** `dKey(date)` → local `YYYY-MM-DD`. **Always parse keys with `+'T12:00:00'`** to
  avoid a UTC off-by-one. Marathon weeks via `mWeekNum()` / `mStartDate()`.
- **The workout engine** (the heart of the app):
  - `WTPL` — split templates (push/pull/lower/upper/fullbody/glutes/arms/core), each with
    exercises `{n,t,sets,reps,rest,p}` and a cardio finisher.
  - `FOCUS_META` / `SETS_BY_FOCUS` / `FOCUS_PROGRESSION` / `INTENSITY_BANDS` — the focus
    (tone/muscle/power/endurance/general) × intensity (quick/standard/full) parameters.
  - `selectWorkoutForDuration()` — picks the exercise count + cardio durations to fit the
    intensity's time band, de-prioritizing muscles trained in the last 48h (`getRecentMuscles`).
  - `buildGym()` — renders the day; snapshots the chosen list onto `sess.exList`.
  - `applySmartSetTypes()` — assigns advanced set types (drop/failure/rest-pause) per focus.
  - Cardio de-dup via `cardioTypeKey()` + `_cardioBySlot`; exercise availability via
    `getEquipmentSafeExercise()` / `isExerciseAvailable()` against the active gym profile.
- **Invariant (important):** `sess.exList` (set in `buildGym`) is the single source of truth for
  today's rendered exercises. Every index-keyed consumer must read it via `getRenderedExList(k)`
  — never re-derive a filtered template list (that historically dropped/misattributed sets).
- **Service worker** (`sw.js`): network-first for the page (always-fresh online), cache-first
  for assets, offline fallback. Bump `CACHE_VERSION` on every deploy so clients force-update.

### Editing / verifying conventions
- **No Node in the typical dev env.** Syntax-check the main `<script>` with JavaScriptCore:
  extract it and run `osascript -l JavaScript -e 'new Function(src)'`. A parse error makes the
  whole app fail to load, so always syntax-check after edits.
- **Verify behavior by serving + driving a browser**, not by eyeballing. The file is ~2.8 MB and
  has a ~2s artificial load screen — wait before reading `S`.
- **Never hard-code the Anthropic API key** (see §6). It must stay in `localStorage` only.

---

## 3. What Claude Code has already done

This app was built and then hardened over several focused sessions (June 2026):

- **Multiple comprehensive review + bug-fix passes**, each combining static analysis,
  exhaustive live simulation (all 120 split × focus × intensity combinations), and multi-agent
  adversarial review. Highlights of what was found and fixed:
  - **Cardio de-duplication:** the same machine could appear in warm-up + mid + finisher (e.g.
    Rowing twice) because variant labels ("Rowing Machine" vs "Rowing Machine (Steady)") slipped
    past a name-based check. Now de-duped on canonical machine *type* (`cardioTypeKey`).
  - **Exercise de-duplication:** the same movement can no longer appear twice in a day (auto
    selection, manual swaps, and equipment substitution all guard against it), while still
    allowing the same *equipment* for different movements.
  - **Generation-engine verification:** confirmed set types, sets/reps, cardio count/duration,
    and exercise selection all scale correctly with focus × intensity × split × recent history.
  - **Crash hardening:** `getPrevBest`, `updateSet`, `toggleSet` now guard against malformed
    history / stale DOM that previously could blank the whole Today page.
  - **Module bug hunts** across nutrition, body, marathon, goals, data-integrity, recovery,
    strength programs, templates, history, schedule editor, reminders/supplements — ~25 real
    bugs fixed (e.g. beverage sodium not scaling with volume, weight-goal math assuming only
    loss, `mWeekNum` returning 0 for a future start, supplement streak excluding today,
    `resetAllData` leaving orphaned keys, several HTML-escaping gaps).
  - **Security:** added `escapeHtml()` for user/external strings (gym names, custom exercises,
    Open Food Facts product names) to prevent broken renders / injection.
- **API key externalized** (this session): moved from a hard-coded value to `localStorage`
  (`pf_anthropicKey`) + a **Settings → AI Exercise Guides** field, so the source is safe to
  publish and the key is set per-device.

> If you're a future Claude Code session: the engine and modules have been heavily verified.
> Prefer small, surgical changes; re-run the syntax check and a live page sweep after edits;
> and preserve the `exList` snapshot + cardio/exercise de-dup invariants.

---

## 4. Research baked into the app

- **Exercise science** drives `FOCUS_META` (rep ranges, rest, set counts, set types, cardio
  multipliers). Values are grounded in cited literature (NSCA / Schoenfeld / Helms / Prilepin),
  with the reasoning kept in comments next to the tables — e.g. hypertrophy at 6–12 reps with a
  working load that lands the top set near 1–2 reps-in-reserve, power at 3–5 reps with long
  rest, "tone" emphasizing higher reps + more cardio for a fat-loss phase.
- **Nutrition** presets (`MACRO_PRESETS`, diet presets) include macro splits and short science
  notes per diet; adaptive TDEE adjusts targets from logged weight trend.
- **Running/marathon** uses standard models (e.g. Riegel race prediction, phase-based training
  weeks, pace zones).
- **Strength standards / Wilks / DOTS** use the published coefficient formulas.
- The user is the sole athlete; the defaults in `initS()` reflect his real profile, goals
  (incl. a 1000-lb-club target), and constraints (a cut phase on tirzepatide → protein floor).

---

## 5. Current capabilities

- **Workouts:** auto-generated daily session from focus × intensity × split × recent training;
  full set logging (work/warm-up/drop/failure/rest-pause), supersets, plate calculator, rest +
  workout timers, per-exercise swaps/skip, 1RM estimates, PR detection, and history.
- **Strength programs:** 5/3/1-style training-max progression that overrides set/weight scheme.
- **Templates:** capture a session as a reusable rich template and re-apply it.
- **Nutrition:** food/macro/water logging, meal plans, recipes, barcode lookup (Open Food
  Facts), beverages, micronutrients, adaptive TDEE, diet presets.
- **Running/marathon:** run logging, training plans, pace zones, race predictor/countdown, fuel
  plans, long-run trends.
- **Body:** weight, body-fat, measurements, BMI, trend + goal projection.
- **Progress & goals:** PRs, Wilks/DOTS, strength standards, ORM milestones, volume charts,
  achievements, streaks, calendars.
- **Recovery:** daily check-ins, soreness + muscle-recovery tracking, deload scheduling.
- **Platform:** installable PWA, offline via service worker, JSON export/import + optional NAS
  (Tailscale) backup, light/dark theming, optional app-lock PIN.
- **Optional AI:** exercise guides via the Anthropic API when a key is set (Settings). Fully
  optional — everything else works without it.

---

## 6. The Anthropic API key (read before touching AI features)

- **Never commit a live key.** The committed source reads it from
  `localStorage.getItem('pf_anthropicKey')` and is empty otherwise. All ~4 fetch sites check the
  `ANTHROPIC_API_KEY` var (updated live by `saveAnthropicKey()`), so no reload is needed.
- **To enable AI guides on a device:** Settings → AI Exercise Guides → paste the key → Save
  (stored in `localStorage` only). Or, on a desktop console:
  `localStorage.setItem('pf_anthropicKey','sk-ant-...')`.
- The key call uses `anthropic-dangerous-direct-browser-access` (browser CORS) against
  `api.anthropic.com/v1/messages` with model `claude-sonnet-4-6`.

---

## 7. What's left before daily phone use

**The code is done and verified — nothing functional is outstanding.** What remains is setup:

1. **Serve it from an origin and install it** (see README). A downloaded file won't reliably
   persist data on iOS — it needs a real URL.
2. **For "anywhere, offline" gym use → Tailscale** (see README's Tailscale section): run a local
   server on the always-on machine, expose it over Tailscale **HTTPS** (`tailscale serve`) so the
   PWA can install and cache for offline, then Add to Home Screen on the iPhone.
3. **Set the AI key once** (optional) via Settings, if you want exercise guides.
4. **Back up periodically** — Settings → Export (or the NAS auto-backup). Browsers can evict
   local storage; a backup protects your history.
5. **On each deploy**, bump `CACHE_VERSION` in `sw.js` so the phone force-updates.

Everything else — the workout engine, logging, nutrition, running, progress, recovery — is
implemented, tested, and ready.
