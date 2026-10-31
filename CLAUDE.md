# PF Fitness Tracker — Project Context & Development Notes

> **Current verification:** Read [TRAINING_AUDIT.md](docs/TRAINING_AUDIT.md) before changing training logic — including its **October 11** and **October 31 addenda**, which supersede earlier statements there (started-session snapshots, automatic advanced sets, set maximums, time estimates, equipment groups). Run `npm ci` and `npm test` (Playwright browser required; in a container with a preinstalled Chromium use `CHROMIUM_PATH=/opt/pw-browsers/chromium npm test`). A *live* session (today or later, unsaved) re-plans on split / focus / intensity / gym changes, carrying logged sets by exercise identity; saved and past sessions keep their snapshot. Records and progression must use comparable completed work sets — specialty extras (`spec:true`) never count.

Context for the developer and for any future [Claude Code](https://claude.com/claude-code)
session working on this repo. The user-facing overview lives in [`README.md`](README.md); this
file is the deeper "how it's built, what's been done, what's left."

> **Picking up fresh? Start with [`HANDOFF-CLAUDE.md`](HANDOFF-CLAUDE.md)** — current status, how
> to resume feature work (with the suggested backlog), and how to get it running on a phone.

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
  - `MIN_WORK_SETS` (= 3) — **hard rule**: no exercise is ever prescribed, or allowed to be
    edited down to, fewer than three work sets. Enforced in `_focusSetCount`, in the
    `getRenderedExList` legacy fallback, and in `removeExtraSet`.
  - `MAX_SETS_BY_FOCUS` / `workSetRange(ex, focus)` — the ceiling, by focus and main-lift vs
    accessory (Strength / Muscle + Strength / Muscle main lifts up to 6; Tone / General /
    Endurance up to 4). Full adds a set to the main lifts of the strength and muscle focuses
    (`fullComp`); `addExtraSet` stops at the max; the card shows the range ("3–4 sets").
  - `TIME_MODEL` — every constant behind the duration estimate in one place (per-rep tempo, set
    changeover, rest slop, warm-up ramp cost, per-exercise transition split by compound vs
    machine, fixed session overhead). `_exLiftSeconds` is the only consumer.
    `selectWorkoutForDuration` returns `estMin`/`estLowMin`/`estHighMin` + a `breakdown`;
    `_renderIntEstLine` renders it after supersets are seeded. `specialtySetMinutes(type,rest)`
    costs each specialty extra (a cluster or failure set includes its full rest).
  - **Personal pace** — `personalPaceInfo()` compares the last ≤8 saved sessions' real lifting
    time (clock − logged cardio − setup) with `_historyLiftModelMin` for those exact sets; the
    median (≥3 sessions, clamped 0.9–1.5×) scales `_exLiftSeconds`, so the band picks fewer
    exercises for a slower lifter. `_exLiftSecondsRaw` is the unscaled model. Shown on the
    estimate line ("your pace ×1.30"). `S.prefs.personalPace===false` turns it off.
  - **Fitting the band, in order:** drop lowest-priority exercises to the floor (3; 2 Strength;
    4 full body) → Standard/Full: finisher down to 5 min → Quick: skip the warm-up cardio, Gym
    Quick then down to 2 exercises → take main lifts' extra sets back toward 3 (`trimSets`).
    Full Body Quick keeps its four patterns and can run over (Strength most).
  - **Cardio is planned in 5-minute blocks** (`roundCardio5`): warm-up 5 (Full 10, Strength
    Quick 0), circuit blocks 5, finisher a multiple of 5 within `FINISHER_CAP`.
  - `FINISHER_CAP` (inside `selectWorkoutForDuration`) — cardio is capped per focus rather than
    stretched to fill the band; when the cap bites, the builder adds another **lift** instead.
  - `QUICK_REST_BY_FOCUS` — **Gym** Quick sessions rest at the short end of each focus's own
    range (Muscle / Muscle + Strength 90 s, Strength 3 min, General 60 s, Tone 70 s, Endurance 30 s)
    so 3 exercises × 3 work sets fit 30–45 min; if the plan still runs over, the finisher is
    shortened or skipped (`_cardioPlan.finisherMin` 0, shown as a note) before any exercise is
    dropped. Passed as `prescriptionForFocus(ex, focus, quickGym)`. Home and Standard/Full rests are
    unchanged. Full Body · Strength Quick is the one known exception (~51 min on a fresh profile).
  - `getBaseWeight` / `BASE_WEIGHT_EXACT` / `BASE_WEIGHT_RULES` / `BASE_WEIGHT_NONE` — the
    pre-loaded weight of bars and plate-loaded machines, with `S.baseWeights` overrides. The
    weight STORED on a set is always the true total; `S.weightEntry` only changes what the input
    shows (`entryToTotalLbs` / `totalToEntryLbs`).
  - `computeAutoSupersets` / `SUPERSET_ANTAGONISTS` — pairs come from the chosen exercises'
    actual muscle groups, never from fixed template indices.
  - `snapToLoadable` / `isLoadableWeight` / `_perSideLoads` — every suggested weight is snapped
    to `base + 2 × (a stack of standard plates)`. Plain 5 lb rounding is only safe while a base
    weight happens to be a multiple of 5, which stops being true the moment the user corrects a
    sled to its real weight.
  - `detectStall` / `applyDeload` / `_stallBanner` — a lift is stalled when its best **e1RM**
    (not bar weight, so an extra rep still counts as progress) hasn't improved over
    `STALL_SESSIONS`. `S.deloads[exName]` records an applied deload or a dismissal so it isn't
    re-flagged. **`applyDeload` writes `auto:false` deliberately** — an auto-flagged weight is
    treated as a stale suggestion and regenerated on the next render, silently undoing it.
  - `exerciseEquipmentKeys` / `sharesEquipment` — backs the "machine busy?" swap filter.
  - `RPE_SCALE` / `setSetRPE` / `lastRPEFor` — optional per-set RPE (`S.prefs.trackRPE`), also
    used to sharpen the stall message.
  - `refreshWakeLock` / `notifyTimerDone` — screen wake lock while a timer runs, and a
    notification when one finishes in the background. Both best-effort; a refusal must never
    affect the timers themselves. Notifications go via `registration.showNotification` so they
    still arrive once the page is backgrounded (`sw.js` handles `notificationclick`).
  - `selectWorkoutForDuration()` — picks the exercise count + cardio durations to fit the
    intensity's time band, de-prioritizing muscles trained in the last 48h (`getRecentMuscles`).
  - `buildGym()` — renders the day; snapshots the chosen list onto `sess.exList`.
  - `applySmartSetTypes()` — assigns advanced set types (drop/failure/rest-pause) per focus.
  - Cardio de-dup via `cardioTypeKey()` + `_cardioBySlot`; exercise availability via
    `getEquipmentSafeExercise()` / `isExerciseAvailable()` against the active gym profile.
- **Gym vs Home session.** The workout on screen is `GS(k)` — `S.sessions[k].gym`, or
  `S.sessions[k].home` while the Today page's 🏠 Home tab is showing (`cMode==='home'`,
  `wkKey(k)`). Every Today-workout function reads the session through `GS(k)`, the split
  through `wkTpl(k)` and swaps through `swapKeyOf(k,i)`, so one engine serves both. Don't
  write `S.sessions[k].gym` in workout code. The Home module (its own `<script>` after the
  main one) adds the home profile, gear, ~40 exercises, the `hpush/hpull/hlegs/hcore` templates
  (`WTPL[...].home`), the rotation (`homeSplitFor`) and fixed loads (`loadingRules`). See
  docs/HOME_EQUIPMENT.md. Home history entries are `type:'home'`.
- **Live re-planning.** `sessionPlanKey(k)` (split|focus|intensity|gym) is stored on the
  session. When it changes on a live session, `buildGym` calls `_replanSession` and rebuilds,
  merging logged sets by exercise name (dropped-but-worked exercises stay as `carried`).
  Today-switcher week shifts are recorded in `dayConfig[k].todaySwitch` so repeated switches
  undo the previous shift (`applyTodaySplitSwitch`). User-added library exercises live in
  `sess.addedEx` and survive re-plans.
- **Specialty sets.** `SPECIALTY_BY_FOCUS` / `planSpecialtySets` / `applySpecialtySets` add one
  extra set (cluster, drop, failure, rest-pause) after the work sets — never in place of one.
  Switch: `_advSuggestEnabled` (Settings → Specialty sets, ✨ chip). Supersets are separate.
- **Organisation.** `exerciseCategory(name)` / `equipmentCategory(item,section)` →
  plate / pin (selectorized, not cable) / cable / freeweight / station (bodyweight on a bench,
  bar or station: Target Abs bench, captain's chair, back-extension bench, dips, pull-ups, TRX —
  `STATION_RE`) / bands / calisthenics (no equipment) / cardio. `EX_CATEGORIES` is listed in
  that order, which is the order of every grouped list. `BODY_AREAS` group ELIB muscle
  groups. Used by the exercise library (`openExerciseLibrary`), swap list chips and the
  Equipment page "By type" view, and as `getExType`'s fallback.
- **Gym first.** `gymEquipmentTier(name)`: 0 machines / cables / weights / stations, 1 sleds &
  ropes, 2 bands, 3 calisthenics. At the gym (not Home) the pool, the selection sort, the
  workout order and `getEquipmentSafeExercise` substitutes all go by tier first, so bodyweight
  work only appears when no gym option is left. Accessories logged at this gym in the last 90
  days (`_familiarGymExercises`) are offered first within their tier; a parenthetical variant of
  a machine already in the pool ("Back Extension Machine (Weighted)") isn't added twice.
- **Invariant (important):** `sess.exList` (set in `buildGym`) is the single source of truth for
  today's rendered exercises. Every index-keyed consumer must read it via `getRenderedExList(k)`
  — never re-derive a filtered template list (that historically dropped/misattributed sets).
- **Timers — all three are wall-clock based and persisted.** iOS suspends `setInterval` the
  moment a home-screen PWA is backgrounded, so anything that counts by decrementing a variable
  per tick silently stops. Store an absolute deadline (or start instant) and derive elapsed time
  from `Date.now()`:
  - Cardio: `S.sessions[k].gym.cardioBlocks[key].timer`, repainted by one shared ticker
    (`_cardioTickAll`) so a page rebuild can never orphan a countdown. `restoreCardioTimers()`
    re-attaches after every `buildGym`.
  - Rest: `_restEndAt` mirrored to `localStorage['pf_restTimer']`, restored by
    `restoreRestTimer()`. The rest bar is fixed above the bottom nav and moved to `<body>`, so it
    shows on every page; **only `syncRestTimerUI()` decides whether it is visible** (running,
    paused, or the 2.5 s "GO!" after it ends). Never hide `#timerWrap` directly — the rest/run-day
    views used to, and it never came back while it kept counting. Every logged set starts it
    (`_restAfterSet`: 10 s before a drop set, 20 s before rest-pause, warm-up rest after warm-ups,
    "Next: …" note); the only exception is the first half of a superset round.
  - Display: every clock uses `fmtClock` — minutes up to 89:59, then `1:30:00` from 90 minutes;
    whole-minute durations use `fmtDurShort` / `fmtMinutes` with the same rule.
  - Workout: `S.sessions[k].gym.wTimer` ({startedAt, accumMs, running, active}), loaded per
    viewed day by `syncWorkoutTimerFromState()`.
  `resyncAllTimers()` runs on visibilitychange / pageshow / focus. **Never reintroduce a
  tick-counting timer.**
  - **Staleness guards.** Because these survive everything, they also survive things they
    should not — the app left open over a weekend, or a backup restored mid-session. A clock
    still `running` from more than `TIMER_STALE_MS` (12 h) ago is treated as abandoned and
    cleared; an expired countdown is only credited if it expired within
    `CARDIO_CREDIT_WINDOW_MS` (2 h), so nothing implausible is ever written to history.
- **Service worker** (`sw.js`): network-first for the page (always-fresh online), cache-first
  for assets, offline fallback. Bump `CACHE_VERSION` on every deploy so clients force-update.

### Editing / verifying conventions
- **Syntax-check after every edit.** A parse error blanks the whole app. With Node available:
  parse each inline `<script>` with `new vm.Script(...)`. Without Node, JavaScriptCore works:
  `osascript -l JavaScript -e 'new Function(src)'`.
- **Verify behavior by serving + driving a browser**, not by eyeballing. `node tools/serve.js`
  serves the folder. The file is ~2.9 MB and has a ~2s artificial load screen — wait before
  reading `S`.
- **Test at iPhone 14 Pro Max size (430 × 932).** That is the target device. Sweep all 10 pages
  and all `.mo` modals for horizontal overflow and console errors.
- **Drive all 120 combinations.** `splits × focuses × intensities` through the real
  `buildTodayWorkout` path is cheap and catches most regressions in the engine.
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

### September 2026 pass — reported bugs + requested features

A round driven by real gym use. What was found and changed:

- **Timers were the big one.** All three (rest, cardio, workout) counted by decrementing a
  variable once per `setInterval` tick. iOS suspends timers as soon as a home-screen PWA is
  backgrounded, so putting the phone down to change music froze the clock — the reported
  "cardio timers stop keeping track" bug. Rebuilding the Today page also killed any running
  cardio countdown outright. All three are now wall-clock + persisted (see §2).
- **Workout timer endings.** Pause/resume plus two distinct endings — 🏁 Finish once every
  exercise and cardio block is complete, or End early with a count of what is still unlogged —
  both handing off to the save sheet. Cancelling pauses the clock rather than charging the
  decision time to the session.
- **Three-set floor.** `SETS_BY_FOCUS` had accessories at 2 for Tone and Endurance, and Quick
  subtracted a set from every exercise, so a Quick Tone day prescribed 2×15 on half the list.
  Now clamped on every path; Quick shortens a session by dropping exercises instead.
- **Time estimates.** The old figure counted 42s of effort plus the prescribed rest and nothing
  else. `TIME_MODEL` now covers tempo, set changeover, rest slop, warm-up ramps, walking between
  machines, loading plates and arrival overhead, and the estimate is shown as a range with its
  breakdown.
- **Cardio no longer pads the band.** `FINISHER_CAP` per focus; Power/Full had been getting a
  46-minute finisher, the exact interference effect its own guidance warns against. Quick skips
  mid-workout cardio circuits, which had pushed every Tone/Endurance Quick day past 50 min.
- **Pre-loaded weight** for bars and plate-loaded machines, with an optional "+plates" entry
  mode, base-aware plate hints, base-clamped suggestions, and loadable warm-up ramps.
- **Supersets are properly optional** (the toggle now clears them from the workout on screen,
  and there is a chip on the Today page) and pair on real muscle antagonism instead of fixed
  template indices — which had been linking a rear-delt fly to a bicep curl.
- **Missing "quick notes".** 92 EX_INFO entries store their coaching note under `tips` rather
  than `cues`, which is what every renderer reads — those cards showed an empty Coaching Cue
  box. Normalised once in `getExInfo`.
- **Equipment matching.** EXERCISE_DEPS had to match a gym-profile item character for character
  and that branch returns early, so ten exercises (all kettlebell work, the ab-wheel family,
  pistol squat) were unreachable from *any* possible gym profile.
- **Four more `exList` invariant violations** fixed: set-type badges, the strength-program card,
  both muscle-overlap warnings, and the legacy fallback's own set count.
- **Tone focus rebuilt** around current evidence on training in a deficit (see §4).
- **Bottom nav** labels shortened to ≤7 characters with proper flex clipping; ten tabs now fit
  an iPhone 14 Pro Max without running into each other.

A second round then added the backlog items: loadable-weight snapping, stall detection with a
one-tap deload, the "machine busy?" swap filter, screen wake lock + timer notifications, and
optional per-set RPE.

Verification each round: parse-check every inline script; drive all 120 split × focus ×
intensity combinations through the real render path (also asserting every suggested weight is
loadable); sweep 10 pages + 59 modals at 430 × 932 for horizontal overflow and console output;
and run a full log → finish → save cycle. **Wake lock and notifications can only be fully
confirmed on the real device** — an embedded preview pane denies both, which is itself a useful
test that they degrade without breaking anything.

> If you're a future Claude Code session: the engine and modules have been heavily verified.
> Prefer small, surgical changes; re-run the syntax check and a live page sweep after edits;
> and preserve the `exList` snapshot + cardio/exercise de-dup invariants.

---

## 4. Research baked into the app

- **Exercise science** drives `FOCUS_META` (rep ranges, rest, set counts, set types, cardio
  multipliers). Values are grounded in cited literature (NSCA / Schoenfeld / Helms / Prilepin),
  with the reasoning kept in comments next to the tables — e.g. hypertrophy at 6–12 reps with a
  working load that lands the top set near 1–2 reps-in-reserve, and power at 3–5 reps with long
  rest.
- **Tone was rebuilt in September 2026** and the old note here ("higher reps + more cardio for a
  fat-loss phase") no longer describes it. It ran 12–15 reps at 70% with 52 s rest — the classic
  light-weight/high-rep toning model — which is the wrong prescription precisely when you are
  cutting. [Schoenfeld et al.'s 2024 Bayesian
  meta-analysis](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/full)
  on inter-set rest finds rests under 60 s measurably reduce hypertrophy through lost volume
  load, and [network meta-analysis of exercise under caloric
  restriction](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1579024/full)
  finds lean mass is preserved by keeping the *load* respectable rather than by adding reps. Tone
  now runs 10–14 reps at ~85% with 75 s rest; the deficit still comes from its 1.6× cardio
  multiplier (the largest of any focus) and the mid-workout cardio block. `FOCUS_PROGRESSION.tone`
  moved to floor 10 / ceiling 14 to match. **If you revisit these numbers, keep rest ≥ 60 s.**
- The other four focuses were re-checked against the same literature in that pass and stand as
  written: Power (3–5 @ 85–90%, 3–4 min rest), Muscle (6–12 @ 67–85%, 90 s), General (8–12, 75 s),
  Endurance (15–20, 35 s — short rests are the training goal there, not an oversight).
- **Nutrition** presets (`MACRO_PRESETS`, diet presets) include macro splits and short science
  notes per diet; adaptive TDEE adjusts targets from logged weight trend.
- **Running/marathon** uses standard models (e.g. Riegel race prediction, phase-based training
  weeks, pace zones).
- **Strength standards / Wilks / DOTS** use the published coefficient formulas.
- The user is the sole athlete; the defaults in `initS()` reflect his real profile, goals
  (incl. a 1000-lb-club target), and constraints (a cut phase on tirzepatide → protein floor).

---

## 5. Current capabilities

- **Workouts:** auto-generated daily session from focus × intensity × split × recent training,
  with a **3-work-set minimum on every exercise** and a duration estimate that models transitions,
  plate loading and realistic rest; full set logging (work/warm-up/drop/failure/rest-pause),
  **optional** supersets, **pre-loaded weight with an optional "+plates" entry mode**, plate
  calculator, **wall-clock rest/cardio/workout timers that survive backgrounding**, per-exercise
  swaps (A→Z with explanations) and skip, 1RM estimates, PR detection, and history.
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
   - `exportData()` tries the **native share sheet first** (on iOS that means Save to Files /
     Mail / AirDrop), then an `<a download>` click, then the clipboard. That order matters: an
     anchor download is unreliable in an iOS standalone PWA and **fails silently** — there is no
     error to catch, so it cannot be detected, only avoided by trying share first.
   - **`importFromText()` ("Paste Backup") is the escape hatch** when a file never made it off
     the old device. Same restore path as `importData`, just parsed from pasted text.
   - **On iOS a home-screen PWA has its own storage container, separate from Safari at the same
     URL.** Opening the URL in Safari will NOT show an installed app's data. This is why
     migrating between installs has to go through an export, and why deleting a home-screen
     icon can take its history with it.
5. **On each deploy**, bump `CACHE_VERSION` in `sw.js` so the phone force-updates.

Everything else — the workout engine, logging, nutrition, running, progress, recovery — is
implemented, tested, and ready.

### One thing only the athlete can do: confirm the base weights

`BASE_WEIGHT_EXACT` / `BASE_WEIGHT_RULES` ship sensible defaults for how much each bar and
plate-loaded machine weighs empty (Olympic bar 45 lb, leg press sled 160, hack squat 95, Smith
carriage 20, plate-loaded carriages 25–60). **Sleds and carriages genuinely differ between gyms
and between manufacturers**, and nothing in the app can measure them. The numbers are a starting
point, not a claim.

Check the ones you actually use — most machines have the starting weight printed on the frame or
the sled — and correct them with the ⚖️ chip on the exercise card. Corrections live in
`S.baseWeights[exerciseName]` and override everything else. Until then, treat logged totals on
plate-loaded machines as approximate; every derived number (volume, 1RM, PRs) inherits whatever
the base weight says.
