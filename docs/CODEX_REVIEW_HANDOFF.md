# Review handoff: PR #4 (Plan/Today sync, specialty sets, organisation, Home workout)

**For:** an independent reviewer (Codex) to check every change on branch
`claude/plan-sync-focus-home-workout` and confirm it works.
**PR:** https://github.com/angelovdimitri920/fitness-tracker/pull/4 (base `main` @ `c9b45cc`)
**Status (Oct 12, 2026):** 170 browser checks pass, 0 failures, 0 browser errors.
Six review passes have been done and their findings fixed: the first code review (section 6),
Codex's review of `cc74234` (6a), its re-review of `30e18e0` (6b), round 3 on `9f0ddaa` (6c),
round 4 on `1a42daa` (6d) and the comprehensive review of `d7f5029` (6e).

Please review for **correctness first**, then for regressions in existing features. The app is
one file, `pf_workout_tracker.html`: inline CSS and vanilla JS, no build step. Read `CLAUDE.md`
§2 for the architecture and `docs/TRAINING_AUDIT.md` (including the **October 11 addendum**)
before judging training logic.

---

## 1. How to run and verify

```sh
npm ci
npm test                                         # Playwright, isolated profile, synthetic data
CHROMIUM_PATH=/path/to/chromium npm test         # if Playwright's bundled browser isn't installed
node tools/serve.js 8753                         # then open http://localhost:8753/pf_workout_tracker.html
```

- `tools/verify.cjs` parses every inline `<script>`. It runs 170 checks in one page at
  430 × 932 (the target device is an iPhone 14 Pro Max), sweeps 10 pages and all modals for
  horizontal overflow, and does a real save → reload → file-import → offline-reload cycle.
  Results go to `.verification/results.json`; screenshots to `.verification/*.png`.
- The app has a ~2 s artificial load screen. Wait before reading `S`.
- **Dates matter.** Most older tests pin `vDate` to 2026-10-01, which is in the past, so those
  sessions are *not live*. The new tests use `liveDay()` (today + 3 days) to exercise live
  behaviour. Keep that distinction in mind when writing extra checks.

## 2. What the user asked for (acceptance criteria)

1. Changing the current day's plan on the **Plan page** updates **Today**, even mid-workout.
2. Changing the split on **Today** works as many times as wanted, and the exercises update each time.
3. A focus chosen on the Plan page updates Today. Switching back and forth gives correct exercises every time.
4. Each focus includes **specialty sets**. **Supersets are a separate on/off option** from the other specialty sets.
5. An option to **end a workout without recording it**.
6. Each focus is accurate and distinct: sets, reps, specialty sets, weight, exercises. Researched.
7. Exercises and equipment organised into **Calisthenics / Dumbbell-Barbell / Plate-loaded
   machines / Pin machines**, with body-area subgroups. Used for choosing, swapping and gym equipment.
8. A separate **Home workout**, available every day, 30–45 min, using the user's home
   equipment. It is an *extra* session. It counts toward the streak, calories and muscle recovery.
   - Equipment: `docs/HOME_EQUIPMENT.md`.
   - Doorframe pull-up bar.
   - GMWD chest press with bumpers 2×45/35/25/15/10 and arms of about 10 lb each.
   - Vest 20–32 lb.
   - Treadmill with no incline.

## 3. Change inventory (search the file for these names)

### 3.1 Live re-planning: Plan ↔ Today sync (criteria 1–3)
| Piece | What it does |
| --- | --- |
| `isLiveSession(k,key)` | A session is live if its day is ≥ today and not in history, or its workout clock is active. Saved and past sessions keep their snapshot. |
| `sessionPlanKey(k)` | `split\|focus\|intensity\|gymId`. Stored as `sess.planKey`. Legacy sessions without one adopt it instead of re-planning. |
| `buildGym` → `_replan` | When the key changed on a live session, `_replanSession()` runs and the list is rebuilt. Logged sets merge by exercise **name**. Worked exercises the new plan drops are prepended with `carried:true` ("DONE · EARLIER PLAN" badge). Kept exercises get undone sets re-prescribed (auto values cleared). |
| `_replanSession(k,gym)` | Clears index-keyed state: swaps (prefix via `swapPrefix`), supersets, `exOrder`, `swapOriginals`, template pin. Carries `exNotes` by name (`_noteCarry`). Keeps finished or running cardio and pins its machine. |
| `getEffTpl` / `getWorkoutFocus` | Only fall back to the session snapshot when **not** live. `getEffTpl` asks `isLiveSession(k,'gym')` explicitly. |
| `applyTodaySplitSwitch(k,new)` + `shiftWeekSplitsForward(…, changedOut)` | The first Today switch shifts the week once and records `dayConfig[k].todaySwitch = {orig, prevSplit, changed:{dk:{prev,set}}}`. Each later switch undoes that record first. Switching back to `orig` restores the week. A day the user edited since is left alone. |
| `buildSwapWorkoutBanner` / `confirmSplitSwitch` | The switcher is shown for any live session (not hidden after logging) and no longer wipes the session. |
| `setIntensity` | Mid-workout on a live session it now re-plans instead of refusing. |
| `applyWorkoutTemplate` | Sets `gym.planKey` after installing the template, so the re-planner doesn't undo the pin. |
| `autoSplitFor` (Auto-Rotate) | Rewritten in the Codex round: walks forward from `AUTO_SPLIT_EPOCH` (2024-01-01) via `_autoSplitPinned` / `_nextAutoSplit`, so a day's split never depends on query order or cache state. **This shifts the projected rotation users saw before**; logged days and manual overrides are unchanged. |

### 3.2 End without saving (criterion 5)
`discardWorkout()` is reached from 🗑 in `renderTimerBar` and the `#discardBtn` button (`refreshDiscardBtn()`, called from `updateStats`).

- It clears the viewed session (gym or home), the workout clock, rest and cardio timers, and that session's swaps.
- It never touches history.
- On a day already saved it refuses with a toast, and the button is hidden.

### 3.3 Specialty sets and focus accuracy (criteria 4, 6)
| Piece | What it does |
| --- | --- |
| `SPECIALTY_BY_FOCUS`, `planSpecialtySets`, `applySpecialtySets`, `specialtySetTarget` | One extra set (`spec:true`) after the work sets, chosen by focus. Live sessions only. |
| Rules | Strength gets a cluster `cl` on the main lift. Muscle + Strength gets `cl` plus rest-pause `rp`. Muscle gets drop `ds` and failure `fl` on a machine isolation exercise. Tone gets `ds`×2. Endurance gets `rp`×2. General gets `ds`×1. Quick sessions get one specialty set. Excluded: timed holds, level-based gear, assisted movements, drops on bodyweight or fixed-weight implements, `fl` on free-weight compounds. |
| User control | Removing a specialty set sets `exD.specRemoved` (it won't come back). Changing its type converts it to a user set. Switch: `_advSuggestEnabled` (`toggleAdvSuggest`, Settings "Specialty sets", ✨ chip in `_renderIntEstLine`). Supersets: separate `S.prefs.autoSuperset`, no longer gated on `_advSuggestEnabled`. |
| New set type `cl` (Cluster) | Select option, add-set picker, CSS `.stype.cl`, `SET_TYPE_INFO.cl`, `autoFillSetType`. Not a record or progression set (`isStrengthRecordSet` requires `wk`). |
| `SETS_BY_FOCUS` | Main lifts get 4 sets for power, hybrid and muscle, and 3 for general, tone and endurance. Accessories get 3. |
| `FOCUS_RIR` + `focusLoadFactor(focus,reps)` | Replaces the flat `weightPct` for **profile-based** starting loads only. Formula: `(30+8)/(30+reps+RIR)`, clamped to 0.5–1.12. |
| Superset equalisation | Pads only non-specialty sets; the specialty extra stays last. |
| `FOCUS_DETAIL` text | Plan-page cards now show work sets, load zone and the specialty sets above. |

### 3.4 Organisation (criterion 7)
| Piece | What it does |
| --- | --- |
| `exerciseCategory(name)` | Returns `calisthenics`, `freeweight`, `plate`, `pin` (selectorized machines and cables), `bands` (bands, spring/hydraulic gear, sleds, ropes) or `cardio`. Ordered regex rules, then a fallback through `EXERCISE_DEPS`. Results are cached in `_exCatCache`. |
| `equipmentCategory(item,section)`, `equipmentBodyArea` | The same idea for Equipment-page items. |
| `EX_CATEGORIES`, `BODY_AREAS`, `bodyAreaOf` | Labels; body areas group the ELIB muscle groups. |
| `getExType` fallback | Unknown names now follow their category instead of defaulting to `'machine'`. Before, 432 of 719 ELIB exercises fell through. This changes **weight suggestions** for those exercises; worth a look. |
| Exercise Library | `openExerciseLibrary(mode)`, `renderExerciseLibrary`, `addExerciseToToday`. Added exercises are stored in `sess.addedEx` and re-appended by `buildGym` on every re-plan. |
| Swap modal | Category chips (`setSwapCat`), grouped headers. |
| Equipment page | "By type" view (default, `S.prefs.equipView`). The row renderer was extracted to `_eqItemRow`. |

### 3.5 Home workout (criterion 8)
| Piece | What it does |
| --- | --- |
| Session routing | `wkKey(k)` (`'home'` when `cMode==='home'` and k is the viewed day), `GS(k)`, `wkTpl(k)`, `swapPrefix`/`swapKeyOf`, `isHomeMode`, `isWkHistType`. About 200 `S.sessions[k].gym` reads in Today-workout functions were mechanically rewritten to `GS(k)` / `sess[wkKey(k)]`. **Please scan for any missed or wrongly converted site.** |
| Today tab | The `#modeTabs` Home button is always shown. `buildTodayWorkout` creates `S.sessions[k].home` (intensity `quick`) and routes to `buildGym`. A rest day still shows the rest card unless Home is selected. |
| Parking | `switchPage` sets `_homeParked` while another page is open. `getActiveGym` returns the real gym then, `buildTodayWorkout` returns early, and the home session and its timers stay intact. |
| Home module | Its own `<script>` right after the main one. It defines the home profile (`getHomeProfile`, id `home-room`, `isHome`, `noIncline`), `HOME_EQUIPMENT_DEFAULT`, the `home_gear` catalogue section and `HOME_EXERCISES` (~40, each with ELIB group, deps and `EX_INFO`). It also defines `EXERCISE_REQUIRES_ALL` (AND requirements), the templates `WTPL.hpush/hpull/hlegs/hcore` (`home:true`), `homeSplitFor` (rotation that avoids the day's gym muscles and the last 48 h; pinned for the day once the home session exists), `buildHomeBanner`/`setHomeSplit` and `gmwdPlateHint`. |
| `getActiveGym` override | In the module: home profile while `cMode==='home' && !_homeParked`. |
| Loads | `homeLoadingRules()` → `gym.loadingRules`, read by `getExerciseLoading` (regexes cached in `_loadRuleRx`). Values: GMWD = `base + 2×perArm` (single-arm: `base + perArm`), with base from `BASE_WEIGHT_EXACT` (20 / 10, overridable via ⚖️). Kettlebell fixed at 20, med ball at 10, vest 20–32 in steps of 2, ankle 1–5, bumper implements {10,15,25,35,45}. `snapToLoadable` uses `values` even when a base weight exists. |
| Level-based gear | `isLevelExercise`: twisters, Power Twister, push-down bar, chest expander, gripper, finger band, thigh trainer. `getExType` → `bodyweight`. The set row shows a LEVEL input (`updateSet(...,'level')`), and the level is saved in history set logs. These never feed volume, 1RM or records. |
| Timed holds | `isTimedHold` (plank, dead hang, holds) is prescribed and logged in seconds. |
| Doorframe bar | `isExerciseAvailable` treats `Pull-Up Bar (Doorframe)` as a pull-up bar **except** muscle-ups, skin-the-cat, around-the-world, kipping, typewriter and L-sit pull-ups (unless a rack is present). Bar exercises that never declared deps got `['Pull-Up Bar','Power Rack / Squat Cage','Pull-Up Bar (Doorframe)']`. |
| Cardio | `Treadmill (Brisk Walk)` added to `CARDIO_OPTIONS` / `CARDIO_MET`. `noIncline` filters incline options in `getEquipmentSafeCardio` and `getAvailableCardioOptions`. On a home profile the warm-up and finisher may share the one treadmill. |
| Time model | `selectWorkoutForDuration`: home templates get less overhead and cardio and +1 minimum exercise. |
| Saving and history | `doSaveWorkout` writes `type:'home'`, `gymId:'home'`, deduped per (date, type). `isSessionComplete(k,key)`. `priorGymHistory` and the last-session, PREV, stall and RPE readers filter by `isWkHistType`, so progression stays per location. `getRecentMuscles`, `weeklyMuscleSets`, `recomputePBs`, the calories chart and nutrition `activityBurn` include home. History gets a 🏠 filter and icon, and the `-Infinity lbs` display for bodyweight exercises is fixed. |

### 3.6 Other
- `sw.js` `CACHE_VERSION` → `pf-cache-v14`.
- `tools/verify.cjs`: `CHROMIUM_PATH` support. The backup-restore assertion is now date-independent; it failed on `main` once the real date moved past Oct 1.
- Docs: `CLAUDE.md` §2, `docs/TRAINING_AUDIT.md` addendum, `docs/HOME_EQUIPMENT.md`.

## 4. Invariants that must still hold

- `sess.exList` is the only source for index-keyed consumers. Use `getRenderedExList(k)`.
- `MIN_WORK_SETS` = 3 on every exercise. Specialty extras never count toward it, and never replace a work set.
- Records and progression use only comparable completed `wk` sets. `spec`, `ds`, `rp`, `cl`, `fl` and `wu` sets, level-based sets and assisted lifts are excluded.
- Every suggested weight is loadable (`isLoadableWeight`), including home implements.
- Saved and past sessions never re-plan. History is never modified except by an explicit save.
- Gym and Home never share a session, swaps, a timer or a history entry.
- No tick-counting timers. All three timers stay wall-clock based (see CLAUDE.md).

## 5. Please look hardest at

1. **The `GS()` conversion.** Any function still reading `S.sessions[k].gym` while Home is showing writes to the wrong session. Excluded on purpose (gym-only): `getEffTpl`, `autoSwapOut`/`autoSwapIn`, `buildWeeklyMGSets`, `calcTimeToGoal`, `confirmSplitSwitch` path, the plan calendar.
2. **Re-plan merge in `buildGym`.** Duplicate names, a carried exercise that later reappears, user-added sets on a kept exercise (trimmed to the new prescribed count when unlogged), drop-set chains (`addContinueDrop`) on a re-planned exercise, and supersets right after a re-plan.
3. **`applyTodaySplitSwitch` + the new `autoSplitFor`.** Fixed in the Codex round (§6a #1–2). Please re-check: a switch, then a Plan edit, then auto-rotate toggled on or off between switches; a switch on a day before a logged session; and whether the epoch walk misbehaves for dates before 2024 or far in the future.
4. **Starting weights.** The `getExType` fallback changed in this PR, and `inferStrengthRef` / `STRENGTH_REF_PATTERNS` were added in the Codex round for unmapped variants. Check the pattern order (first match wins) for names the tests don't cover, and dumbbell (`compound_db`) or cable names that should *not* get an inferred reference.
5. **Global mode state:** `cMode` + `_homeParked` + the `getActiveGym` override. Check page switches mid-workout, `resyncAllTimers` on visibility change, and notifications.
6. **Specialty planner edge cases:** Quick intensity, pinned templates, user-linked supersets, `_advSuggestEnabled` default (`true` unless `pf_advSuggest==='0'`).
7. **Warm-up rows.** `getWarmupSets` now snaps rows down to loadable weights and drops any that are not lighter than the work load. A light work load can therefore produce 0 or 1 warm-up rows instead of 2. Check that nothing downstream assumes exactly two (warm-up checkboxes keyed by index, save completion %).

## 6. Already reviewed and fixed (don't re-report unless still broken)

| Finding | Fix |
| --- | --- |
| Applying a template was immediately undone by the re-planner | `planKey` set in `applyWorkoutTemplate` |
| Home last-session, PREV, stall and RPE history ignored home entries | `isWkHistType` in those readers |
| Changing an auto specialty set's type was reverted | `updateSetType` converts it to a user set |
| Notes and `swapOriginals` stayed index-keyed across a re-plan | Carried by name / cleared |
| Home split could flip after a gym-side change | Pinned for the day once the home session exists |
| Discard on a saved day could later blank the history entry | Refused on saved days |
| `getWorkingWeight` read a template index | Reads `getRenderedExList` |
| The home cardio ticker stopped while another page was open | Parking keeps `cMode` |
| GMWD totals changed from plates-only to arms + plates | Not an issue: no home data existed before this PR |
| Loading rules were rebuilt every call | Cached by base-weight signature; regexes cached |

Each fix has a regression test in `tools/verify.cjs` (search "Review follow-ups").

## 6a. Codex review of `cc74234`: fixed

| # | Finding | Fix |
| --- | --- | --- |
| 1 | A future Plan edit was overwritten by the next Today switch | Undoing a switch leaves any day whose split no longer matches what the switch wrote, and the re-shift skips it (`applyTodaySplitSwitch` `protect`) |
| 2 | Today switching broke with Auto-Rotate Splits on | Root cause: `autoSplitFor` recursed to a depth cap and anchored there, so a day's split depended on which day was asked first after a cache clear (with a cold cache every day came out the same). It now walks forward from a fixed epoch (`AUTO_SPLIT_EPOCH`), and `shiftWeekSplitsForward` shifts the effective (rotated) plan |
| 3 | Home clock hidden on scheduled rest days | `renderTimerBar`, interval launcher and notes exempt `cMode==='home'` |
| 4 | Home-only cardio countdown did not request the wake lock | `wakeLockWanted` checks both `gym` and `home` cardio blocks |
| 5 | GMWD warm-up rows could be unloadable (e.g. 30 lb) | `warmupWeightFor` snaps down with `snapToLoadable`; `getWarmupSets` keeps only rows lighter than the work load, de-duplicated |
| 6 | Home sessions ignored by four recovery builders | `isResistanceWorkout(h)` (gym or home) in all four |
| 7 | Weekly completion could exceed 100% | Home sessions listed separately (`+N home`), percentage capped |
| 8 | Live home calories used gym exercise identities | `getWorkoutCalsBurned(key)` reads that session's `exList` and swap namespace |
| 9 | Turning supersets off mutated a saved Home session | Guard is `isSessionComplete(k, wkKey(k))` |
| gap | Implausible starting loads for unmapped bar / landmine / Smith variants (EZ-bar wrist curl at 90 lb) | `inferStrengthRef` infers a reference lift from the movement when `EX_TO_STRENGTH` has none |

Each has a regression in `tools/verify.cjs` (search "Codex review"). All ten regressions were
confirmed to fail against `cc74234` and pass now. Test gaps closed as well: auto-rotate on; a
Plan edit between two switches; Home on a rest day; the wake lock with only home cardio;
nutrition's home calories while the Gym tab shows; GMWD warm-ups for every loadable total and
every focus; the exact specialty mix per focus × intensity on four splits; starting-load
plausibility for 120+ bar / machine variants.

## 6b. Codex re-review of `30e18e0`: fixed

| # | Finding | Fix |
| --- | --- | --- |
| F1 | A Plan edit was protected for one switch, then overwritten by the next | `todaySwitch.protect` persists the protected dates and every undo carries them forward, for as long as the switch stands (it ends when Today returns to its planned split). |
| F2 | After toggling Auto-Rotate, "back to the original" landed on the stale recorded split | After undoing, `applyTodaySplitSwitch` takes "original" from `getEffTpl(k)` under the *current* settings. If that already equals the request there is no override. Otherwise it is a fresh switch from the current plan. |
| F3 | Undo restored the old override on a shifted day that had since been saved | A changed day with a saved gym session is never undone, and it is protected from later shifts. `_autoSplitPinned` now ranks a logged split above an override, so the next day rotates on from what was trained. History is never written. |
| F4 | Broad name patterns picked the wrong reference (Z-press → bench; curl-grip extension → curl) | `inferStrengthRef` decides the movement family from the exercise's own ELIB group (`getMG`) via `STRENGTH_REF_BY_GROUP`. Name patterns pick only within a family, or for family-less groups (functional, core, strongman). The fallback patterns gained the overhead-press names and put extension before curl. |
| F5 | Dates before `AUTO_SPLIT_EPOCH` all resolved to Push | `_preEpochAutoSplit` runs the rotation backwards from the epoch, so 2023 days rotate and join 2024 seamlessly. Earlier days honour only their own override or log; that limitation is documented in the code. |

Regressions are in `tools/verify.cjs` (search "Codex re-review"). All five fail at `30e18e0` with the
reported symptoms and pass now. They cover:
- F1 under all four combinations (initial Auto-Rotate state × toggled or not), through four
  non-original switches with a save → reload in the middle, then a return to the original.
- F2 in both toggle directions, with Monday left unpinned and a save → reload between the steps.
- F3 through the real build/save path. It checks the history is byte-identical, plus a date that
  was already logged before the first switch with a differing override.
- F4 by reference identity, and by tripling every unrelated strength field (the weight must not
  move) and then the referenced one (it must). A family sweep over every ELIB group, and no
  dumbbell or cable name ever gets an inferred reference.
- F5 cold vs warm caches and step-by-step succession across 2023-12-18 → 2024-01-12, plus a
  pre-epoch override.

## 6c. Codex round 3 on `9f0ddaa`: fixed

| # | Finding | Fix |
| --- | --- | --- |
| R3-1 (P1) | A backup containing a saved Home workout could not be restored | `validateBackupState` accepts `home` history and validates it exactly like `gym`, including each exercise being an object. `sessions[k].home` is validated like `sessions[k].gym`. **Paste Backup** (`importFromText`) previously skipped validation entirely; it now runs the same validator, so a malformed paste never replaces the saved data. |
| R3-2 (P2) | Fuzzy `getMG` guesses for custom names overrode accurate movement patterns | `inferStrengthRef` trusts only an exact catalogue group (`elibExactGroup`), or the exact group of the name without a trailing `(…)` suffix. Every other name goes straight to the movement patterns; the fuzzy guess is never used here. |
| R3-3 (P2) | With no session snapshot, the displayed split followed the override while the rotation followed history | New shared `loggedGymSplits()` index (cached on the history array and its length). `getEffTpl` reads it right after the completed-snapshot check and before any override, and `autoSplitFor` uses the same index. The Plan day preview shows the trained split, marked "✓ trained". A logged day is never live, so this can't fight the re-planner. |

Regressions are in `tools/verify.cjs` (search "Codex round 3"), plus the rewritten backup round trip near the end.
All fail at `9f0ddaa` with the reported symptoms and pass now. The one exception is the
malformed-file check, which the old validator passed by rejecting every Home backup. Coverage:
- A real Home save plus gym, run and nutrition data, exported through `exportData()`, caught as an
  actual download, re-imported through the real file picker, then checked by type and content.
- The same file with a broken Home entry, refused by the file picker with saved state byte-identical.
- Seven malformed Home/session/type shapes rejected by the validator.
- Paste Backup refusing a malformed backup without reaching the restore step, and accepting a valid one.
- Seven suffixed or custom names, checked for reference identity and against unrelated-lift
  changes, plus a rendered General Fitness template at a gym with a landmine station.
- A history-only day with a conflicting override, after save → reload: `getEffTpl`, `autoSplitFor`,
  `wkTpl`, Today's `#todaySub`, the Plan cell (done) and the Plan day preview all agree, the next
  day rotates from the logged split, and history stays byte-identical.

Accepted by Codex and unchanged: switch protection ends when the switch transaction ends, and later
switches rebase on the current plan. Pre-epoch calendar walks are a bounded cost (about 5 ms for a
2023 month on desktop) and were left as they are.

## 6d. Codex round 4 on `1a42daa`: fixed

| # | Finding | Fix |
| --- | --- | --- |
| R4-1 (P2) | A trailing parenthetical was stripped even when it named a different movement ("Smith Machine Squat (Calf Raise)" → squat, prescribed 245 lb from a 400 lb squat; "Deadlifts (Barbell) (Romanian)" → deadlift) | A suffix is stripped only when it is a movement-neutral annotation: `isNeutralExerciseSuffix`. Every word must match `NEUTRAL_SUFFIX_WORD`, which covers tempo, pause, eccentric, set-scheme words and numbers such as `3-1-1` or `2 sec`. Stacked neutral groups are stripped one at a time, so "(Slow) (Paused)" reaches its catalogue base. Any other suffix keeps the full name, which goes to the movement patterns: (Calf Raise) → `calfstand`, (Romanian) → `bbrdl`. The exact original-name lookup still runs first. |

The regression is in `tools/verify.cjs` (search "Codex round 4"). It fails at `1a42daa` with the
reported symptom and passes now. It checks:
- Reference identity for nine names: both movement-changing repros, a hack-squat calf variant,
  and the neutral `(Slow)`, `(Slow) (Paused)`, nested, `3-1-1 tempo`, `(Paused)` and extension cases.
- Unrelated-field perturbation on every name (tripling every other strength field must not move
  the weight; tripling the referenced one must).
- Direct checks of `isNeutralExerciseSuffix`.
- The rendered General Fitness Smith-machine template with squat 400 and calf 130. The calf raise
  must be ≤ 130 lb.

Accepted by Codex and unchanged: the history-index cache design (no in-place split writer exists)
and the saved-day Plan modal UX.

## 6e. Codex comprehensive review of `d7f5029`: fixed

| # | Finding | Fix |
| --- | --- | --- |
| F1 (P2) | A saved Home workout could be relabelled by the split buttons, and a resave rewrote its history split | `homeSplitFor` reads the saved Home split first (`loggedSplitsOf('home')`, the same per-type index the gym uses), then a non-live session snapshot, then `homeConfig`. `setHomeSplit` refuses a non-live Home session. The banner hides the split buttons and says "✓ Saved". |
| F2 (P2) | Ending Home without saving cancelled the Gym rest countdown | The rest timer stays a single person-level countdown, but now records its owner (`_restOwner` = `date|gym` or `date|home`, persisted in `pf_restTimer.o`). `discardWorkout` stops it only when it belongs to the discarded session. An older saved timer with no owner is never stopped by a discard. |
| F3 (P2) | The Workouts CSV left out Home | `exportCSV('workouts')` uses `isResistanceWorkout` and has a new **Type** column (Gym / Home). The printable report (`printReport`) had the same gap and now counts Home ("Workouts (N home)") and marks Home rows 🏠. |
| F4 (P2) | Weekly volume bars ignored Home | Each day's bar sums gym + home volume, converting units on the summed value, so the bars add up to the weekly total. |
| F5 (P2) | History detail showed "0 lbs × 15 reps" for level gear and reps for timed holds | New `fmtLoggedSet(name, set)`: `Level N × R reps` for level gear, `S sec` (optionally with weight) for timed holds, and plain reps for unloaded work. Loaded sets are unchanged. |
| F6 (P3) | "Save as Workout Template" was hidden for Home on rest and run days | `updateSaveTemplateBtnVisibility` shows it whenever Home has a workout, on any day type. |
| obs | 6 of 96 Home Quick builds were estimated above 45 min | `selectWorkoutForDuration` now trims the lowest-priority exercise while the plan, including its expected specialty sets (~1.5 min each), exceeds the top of the band. It keeps at least 3 exercises (2 for Build Strength, 4 for full body, which must keep knee / hinge / push / pull). All 96 Home Quick combinations now plan 37–44 min. |
| obs | Research wording overstated two studies | Comments, the Plan-page text and `TRAINING_AUDIT.md` now say: drop sets showed no significant hypertrophy difference, with time savings (Sødal 2023); failure has not been shown superior (Refalo 2023); the rest-pause endurance result is a small leg-press study (Prestes 2019); advanced techniques are optional (ACSM). |

Regressions are in `tools/verify.cjs` (search "Codex comprehensive review", plus the Home Quick
duration test). All seven fail at `d7f5029` with the reported symptoms and pass now. They cover:
- F1: the Legs button is absent, a direct `setHomeSplit` is refused, the title, list and resaved
  history keep `hpush`, and a history-only day after reload still reads `hpush`.
- F2: the Gym timer survives a Home discard, Home's own timer is cleared, and a legacy unowned
  timer is kept.
- F3: a Home-only CSV, mixed Gym + Home + Run, escaping, the Runs CSV unchanged, and the report.
- F4: bars on a Home-only day and on a same-day Gym + Home, with the sum equal to the total, plus kg.
- F5: level, seconds and a loaded set after save → reload, through the real detail modal.
- F6: all four day types.
- Duration: all 96 Home Quick combinations land within 30–45 min, each with ≥ 3 exercises.

## 7. Judgement calls (flag if you disagree)

- PRs are per exercise and therefore shared between gym and home. Progression history is per location.
- The vest and ankle weights start at their lightest setting. The GMWD starts conservatively from bench/OHP working weights.
- Home sessions default to Quick (30–45 min). The user can pick Standard on the card.
- Clusters were chosen for Build Strength. Long-term evidence shows parity with straight sets. The benefit is preserving rep quality within a session.

## 8. Known limitations / not covered by automated tests

- Real iPhone behaviour: background timers, wake lock, notifications, PWA update with `pf-cache-v14`.
- Template save/apply on the Home tab works through the shared code, but has no dedicated test.
- `autoSwapIn` iterates `sess.gym.exercises` with `.forEach`, but it is an object. This bug predates this PR and is caught by its `try`. It was left untouched.
- The Plan page does not show the home workout. Home is chosen on Today only.

## 9. Manual smoke test (≈10 min at 430 × 932)

1. Today (gym day): Start the timer, log one set. On the Plan page, change today's split, then return to Today. The logged set is still there and the list is new.
2. Today → Change split three times, then back to the original. The Plan calendar's next days are unchanged from the start.
3. Plan → focus Strength → Tone → Muscle. Today's reps, sets and specialty sets follow each time. Toggle ✨ and 🔗 independently.
4. 🗑 End Without Saving: nothing in History, the clock is reset.
5. Today → ➕ Add Exercise. Filter by type and body area, add one, change the focus, and check it stays.
6. Equipment → By type / By section. Swap an exercise and use the category chips.
7. Today → 🏠 Home. Check the split banner and GMWD per-arm hints (e.g. "Each arm: 25 + 15 · total includes 20 lbs of arms"). On level exercises, check the LEVEL input. Check the treadmill shows Brisk Walk only. Save it, then check that the History 🏠 entry exists and the gym workout is untouched.
