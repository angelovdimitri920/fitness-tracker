# Handoff — start here

A pick-up summary for a fresh [Claude Code](https://claude.com/claude-code) session (or future
you). It points at the two things you'll most likely want to do next: **resume feature work**, or
**get the app onto your phone as something you actually use**. Reference docs:
[`README.md`](README.md) (features), [`CLAUDE.md`](CLAUDE.md) (architecture + work/research done),
[`docs/CONTROLS.md`](docs/CONTROLS.md) (every control → its function).

---

## Current status (as of this handoff)

- **The app is functionally feature-complete and verified.** `pf_workout_tracker.html` is a
  single-file vanilla-JS PWA. The workout-generation engine, logging, nutrition, running,
  body/recovery, progress, and the top-right Strength Profile / Plate Calc / Settings have all
  been reviewed and hardened over multiple passes (see `CLAUDE.md` → "What Claude Code has done").
- **Published** to GitHub: `git@github.com:angelovdimitri920/fitness-tracker.git` (branch `main`).
- **API key is externalized** — never hard-coded. The app reads it from
  `localStorage['pf_anthropicKey']`; you set it once per device via **Settings → AI Exercise
  Guides**. Never re-introduce a hard-coded key (GitHub/Anthropic secret-scanning would revoke it).
- **Not yet deployed for daily phone use** — that's Path B below. Everything else is done.

### Newest work (September 2026)

A pass driven by real gym use. Full detail in `CLAUDE.md` §3; the headline items:

- **Every timer is wall-clock based and persisted.** They used to count by decrementing a
  variable per `setInterval` tick, which iOS suspends the moment a home-screen PWA is
  backgrounded — putting the phone down to change music froze the clock. Do not reintroduce a
  tick-counting timer; see `CLAUDE.md` §2.
- **A 3-work-set minimum** is enforced on every path, including manual set removal.
- **Time estimates** model transitions, plate loading, warm-up ramps and realistic rest, and are
  shown as a range with their breakdown.
- **Pre-loaded ("starts at") weight** for bars and plate-loaded machines, with an optional
  "+plates" entry mode.
- **Supersets are optional** and pair on real muscle antagonism.
- **The Tone focus was rebuilt** around current evidence on training in a deficit.
- **Backlog items built:** screen wake lock + notifications for finished timers, stall detection
  with a one-tap deload, a "machine busy?" swap filter, loadable-weight snapping, and optional
  per-set RPE.

**One open item that only you can close:** the base weights for plate-loaded machines are
educated defaults — sleds and carriages differ between gyms. Check the ones you use (the starting
weight is usually printed on the frame) and correct them with the ⚖️ chip on the exercise card.
See `CLAUDE.md` §7.

---

## Path A — resume feature development

### Set up + verify (do this before and after any change)
1. Edit `pf_workout_tracker.html` directly (no build step).
2. **Syntax-check** the main script (a parse error blanks the whole app). With Node, parse each
   inline `<script>` with `new vm.Script(...)`. Without Node, JavaScriptCore works:
   `osascript -l JavaScript -e 'new Function(src)'`.
3. **Verify behavior in a browser**, not by reading: serve the folder (`node tools/serve.js`)
   and drive it. Wait ~2 s for the load screen before reading `S`. **Test at 430 × 932 (iPhone 14
   Pro Max)** — that is the target device. Sweep all 10 pages + all `.mo` modals for console
   errors and horizontal overflow, and drive all 120 split × focus × intensity combinations
   through `buildTodayWorkout`.
4. Keep changes small and surgical; re-run steps 2–3.

### Guardrails (don't break these — they were hard-won)
- **`sess.exList` snapshot is the source of truth** for today's exercises. Index-keyed consumers
  must read `getRenderedExList(k)` — never re-derive a filtered template list.
- **Cardio + exercise de-dup**: a machine never repeats across warm-up/mid/finisher (`cardioTypeKey`),
  and a movement never repeats in a day (used-name checks in swap/substitution/intensity-change).
- **Never reintroduce a tick-counting timer.** All three timer families are wall-clock +
  persisted because iOS suspends intervals for a backgrounded PWA (`CLAUDE.md` §2).
- **`MIN_WORK_SETS` = 3 is a hard rule**, not a default: never let any path prescribe or edit an
  exercise below three work sets.
- **A set's stored weight is always the TRUE TOTAL** in lbs, including any base/bar weight.
  `S.weightEntry` only changes what the input displays.
- **Never commit the Anthropic key** (it lives in `localStorage` only).
- **Dates**: `dKey()` for local `YYYY-MM-DD`; parse keys with `+'T12:00:00'` (avoids UTC off-by-one).
- After a deploy, **bump `CACHE_VERSION` in `sw.js`** so clients force-update.

### Suggested next features (backlog)
These are the "could-improve" notes from the README, roughly prioritized. None are blockers.
- **Workout**: a global warm-up-ramp auto-fill across compounds; inline editing of a past
  session's sets in History (currently delete + re-log).
- **Body/Nutrition**: progress photos; a weight-vs-calorie-intake overlay; a larger seeded food DB
  or a second food API to complement Open Food Facts.
- **Running**: **GPX import** (the one real gap vs Strava/Garmin — brings in route/HR without making
  the app a live tracker).
- **Plan/Goals**: drag-and-drop calendar editing; full mesocycle templates; user-defined custom
  goals; a shareable achievement card.
- **Progress**: per-chart date-range pickers.
- **Settings**: selective/partial import (merge instead of replace).
- **Data safety**: finish the NAS (Tailscale) auto-backup wiring so history is protected on-device.
*(Built since: lock-screen wake lock + timer notifications, stall detection with a one-tap
deload, the "machine busy?" swap filter, loadable-weight snapping, and optional per-set RPE.
Per-set RPE above is therefore done too.)*

---

## Path B — make it an app you use on your phone

The app installs as an offline PWA; the only missing piece is serving it from a real origin your
phone can reach. Recommended: **Tailscale HTTPS** (works anywhere incl. the gym, installs offline).

1. **Tailscale on the Mac + iPhone**, same account; in the admin console enable **MagicDNS** and
   **HTTPS Certificates**.
2. **Serve the folder**: `node tools/serve.js 8751` (or `python3 -m http.server 8751`). For
   hands-off, make it a `launchd` LaunchAgent so it starts on login.
3. **Expose over HTTPS**: `/Applications/Tailscale.app/Contents/MacOS/Tailscale serve --bg 8751`
   → `https://<your-mac>.<tailnet>.ts.net/pf_workout_tracker.html`.
4. **On the iPhone** (Tailscale connected): open that HTTPS URL in Safari → **Share → Add to Home
   Screen**. Launch it once online so the service worker caches it — then it runs **offline**.
5. **Set the AI key** (optional): Settings → AI Exercise Guides → paste your key (Settings only;
   never in the file). Your key is also saved locally in `ANTHROPIC_KEY_LOCAL.txt` (gitignored).
6. **Back up**: Settings → Export the JSON periodically (browser storage can be evicted), or finish
   the NAS auto-backup.
7. On every redeploy, bump `CACHE_VERSION` in `sw.js`.

See `README.md` → "Use it on your iPhone at the gym, via Tailscale" for the full version.

### Bigger future option (out of scope for now)
A native pivot (Apple Health / Watch integration, real GPS/HR capture) would need a different
shell (e.g. wrapping the PWA or rebuilding native). The current single-file PWA is deliberately
local-first and offline; that's the right call until you specifically want device sensors.

---

## Repo map
| File | What it is |
|------|-----------|
| `pf_workout_tracker.html` | The whole app (single file). |
| `sw.js` / `manifest.json` / `icon-*.png` | PWA shell (offline + install). Serve all together. |
| `README.md` | Feature overview (per page) + iPhone/Tailscale setup. |
| `CLAUDE.md` | Architecture, work/research done, conventions. |
| `docs/CONTROLS.md` | Per-control → function map. |
| `HANDOFF-CLAUDE.md` | This file. |

*(Note: stale `HANDOFF.md` / `NEXT-STEPS.md` from an earlier project state may sit in the working
folder; they're gitignored and superseded by the docs above — ignore them.)*
