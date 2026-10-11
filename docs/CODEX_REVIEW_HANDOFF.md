# Review handoff: PR #4 (Plan/Today sync, specialty sets, organisation, Home workout)

**For:** an independent reviewer (Codex) to check every change on branch
`claude/plan-sync-focus-home-workout` and confirm it works.
**PR:** https://github.com/angelovdimitri920/fitness-tracker/pull/4 (base `main` @ `c9b45cc`)
**Status when handed off (Oct 11, 2026):** 141 browser checks pass, 0 failures, 0 browser errors.
One code-review pass has already been done and its findings fixed (section 6).

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

- `tools/verify.cjs` parses every inline `<script>`. It runs about 140 checks in one page at
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
- `sw.js` `CACHE_VERSION` → `pf-cache-v9`.
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
3. **`applyTodaySplitSwitch` undo** when the user also edits future days on the Plan page between switches, and with `S.prefs.autoRotateSplits` on (the shift logic predates auto-rotate and only reads `dayConfig`/`daySched`).
4. **`getExType` fallback changes:** suggested starting weights for formerly-"machine" exercises (EZ-bar, trap-bar, landmine, Smith, plate-loaded variants).
5. **Global mode state:** `cMode` + `_homeParked` + the `getActiveGym` override. Check page switches mid-workout, `resyncAllTimers` on visibility change, and notifications.
6. **Specialty planner edge cases:** Quick intensity, pinned templates, user-linked supersets, `_advSuggestEnabled` default (`true` unless `pf_advSuggest==='0'`).
7. **Home loads:** GMWD warm-up ramps (`getWarmupSets` / `warmupWeightFor`) produce weights that may not land on a bumper combination. These are cosmetic warm-up rows, not checked by tests.

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

## 7. Judgement calls (flag if you disagree)

- PRs are per exercise and therefore shared between gym and home. Progression history is per location.
- The vest and ankle weights start at their lightest setting. The GMWD starts conservatively from bench/OHP working weights.
- Home sessions default to Quick (30–45 min). The user can pick Standard on the card.
- Clusters were chosen for Build Strength. Long-term evidence shows parity with straight sets. The benefit is preserving rep quality within a session.

## 8. Known limitations / not covered by automated tests

- Real iPhone behaviour: background timers, wake lock, notifications, PWA update with `pf-cache-v9`.
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
