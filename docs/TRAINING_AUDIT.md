# Training and tracking audit — October 1, 2026

The app has a useful personal-training foundation, but the previous implementation had defects that could misstate progress and give inconsistent prescriptions. This change repairs those defects and adds repeatable browser checks. It does **not** establish that every feature is correct or that the app is the most effective program for every person.

The user's existing profile, schedule and equipment remain authoritative. Lose & Tone remains the initial default; saved preferences are retained. Muscle + Strength is a new optional focus, not an automatic change to the user's goal.

## Focus behavior

All focuses share equipment eligibility, exercise identity, logging, units, progression and history rules. There is no universally superior machine for a goal: selection should support the movement, available equipment, technique, repeatability and recovery.

| Focus | Working reps | Rest between working sets | Cardio |
|---|---|---|---|
| General Fitness | 8–12 | 75 seconds | Moderate steady effort; finisher capped at 25 minutes |
| Build Strength (formerly Power & Strength) | Main lifts 3–5; accessories 8–12 | Main lifts 210 seconds; accessories 90 seconds | Easy warm-up and manageable finisher, capped at 15 minutes; no automatic supersets |
| Build Muscle | 6–12 | Main lifts 150 seconds; accessories 90 seconds | Easy to moderate; finisher capped at 20 minutes |
| Lose & Tone | 10–14 | 75 seconds | More cardio allocation; optional circuit block; finisher capped at 45 minutes; sustainable effort |
| Endurance | 15–20 | 35 seconds | More steady cardio and up to two circuit blocks; finisher capped at 45 minutes |
| Muscle + Strength (optional) | Main lifts 4–8; accessories 8–12 | Main lifts 180 seconds; accessories 90 seconds | Manageable cardio, capped at 15 minutes; no automatic supersets |

These are starting prescriptions, not optimality guarantees. The app retains its three-working-set convention. Bodyweight exercises retain suitable individual targets; plank holds use seconds. Short sessions omit circuit cardio. Actual cardio depends on equipment, available slots and session length; the caps above apply to the **finisher**, not all weekly aerobic work.

The former Power & Strength option is labeled Build Strength because heavy, controlled repetitions do not constitute a distinct explosive-power program. Lose & Tone retains resistance work; its help no longer implies that a special rep range causes fat loss. Endurance combines muscular endurance and gym cardio; the separate Run plan still needs to be coordinated with lifting and recovery.

The optional combined focus rotates full-body sessions at up to three gym days, upper/lower at four, upper/lower/push/pull/lower at five, and push/pull/lower at six. Manual split choices take precedence. Full-body Quick now includes knee-dominant, hip-hinge, pushing and pulling patterns.

## Corrections

- **Progression:** previous sessions are selected by calendar date and gym, excluding the current/future date. Earned reps are retained. Automatic increases require at least three completed straight working sets at one load, all reaching the focus ceiling, with no reported RPE of 9.5 or higher. Partial sessions, clusters, drop sets and warm-ups do not qualify. Changing focus uses the prior load/reps conservatively when the earlier focus is known.
- **Records and analytics:** a single at 100 lb remains 100 lb, not an inflated estimated maximum. Corrections rebuild personal records. Strength charts use matching logged exercises; a machine press does not become a barbell bench record. The 1000 lb total uses actual matching lifts, not estimated maxima or Smith substitutes. Assisted-machine load is not treated as ordinary resistance progression. Current PR badges remain set-volume records, not every record category offered by dedicated loggers.
- **Workout preservation:** started workouts keep their exercise list, focus, split, prescription and cardio plan when the default focus changes. Completed sets cannot be reassigned or removed by intensity changes or exercise swaps. Unstarted state is mapped by exercise identity instead of silently reusing an index. Quick-fill and typed reps survive rendering.
- **Equipment:** an empty inventory no longer unlocks all machines. Bench/rack requirements are checked; unavailable alternatives are omitted. Cardio machines are not duplicated under different names. Dumbbell rack limits and editable machine increments/caps constrain suggested loads. Barbell rounding no longer subtracts weight when an exact load is already possible. User-entered actual results remain loggable.
- **Training guidance:** removed automatic advanced-set prescriptions, mandatory hypertrophy pyramids and unsupported guarantees about soreness, meal timing and cardio. Added RIR/RPE/e1RM definitions, assistance-load guidance and last-seven-day primary-muscle set/day counts. These counts are descriptive, not a fully individualized volume optimizer.
- **Named programs:** StrongLifts, Starting Strength, GZCLP and nSuns cards are educational references; their incomplete implementations cannot override Today. The remaining 5/3/1-style main-lift override is explicitly labeled an adaptation, not a complete implementation of Wendler's schedule and assistance programming.
- **Persistence and calculations:** malformed backup structure is rejected before overwrite; storage failures no longer report a successful save. Rest timers retain their deadline after restoration. Cardio totals do not include the entire lifting-session duration. Calorie calculation uses the rendered exercise snapshot. Bodyweight units and added-plate input remain stored in pounds. Calories, recovery scores, duration and estimated maxima are still estimates.
- **Development server:** serves only the six public app assets, preventing accidental access to local key files, Git metadata or backups. Service-worker shell cache advanced to v8 (v9 with the October 11 addendum).

Legacy history without a gym or training-focus identifier cannot retrospectively be assigned a verified gym or focus. It remains usable for compatibility. The changes do not rewrite the user's private browser data during development.

## Evidence and comparison

[ACSM's 2026 resistance-training guidance](https://www.acsm.org/wp-content/uploads/2026/03/Resistance-Training-Position-Stand-infographic.pdf) supports regular major-muscle training, heavier loading for strength, sufficient weekly work for hypertrophy, and distinguishing explosive power from slow heavy lifting. Its guidance also supports offering machines and free weights without asserting one is universally best. The app's specific rep ranges and rest intervals are implementation choices within that broader guidance.

[A concurrent-training systematic review and meta-analysis](https://pubmed.ncbi.nlm.nih.gov/34757594/) supports avoiding blanket claims that cardio prevents muscle or maximal-strength gains. Recovery and the nature/timing of hard endurance work still matter. Finisher caps are practical product defaults, not research-proven thresholds.

| Reference | Useful benchmark | App response / remaining gap |
|---|---|---|
| [Fitbod: how recommendations work](https://help.fitbod.me/hc/en-us/sections/360001078993-Understanding-Fitbod-How-It-Works) | Goal, equipment, training history and recovery inform recommendations | Equipment/history rules corrected; weekly coverage visible. This app has simpler heuristics, not a validated equivalent of Fitbod's system. |
| [Hevy: set records vs personal records](https://help.hevyapp.com/hc/en-us/articles/38279531346455-Set-Records-vs-Personal-Records) | Explicit distinctions between record types | Comparable-set filtering and correction fixed. A richer record system remains a worthwhile future improvement. |
| [Strong](https://help.strongapp.io/article/228-what-is-strong) | Reliable workout logging and progress review | Logging identity, units, history and persistence tested; device integrations and full real-world usability were not benchmarked. |
| [StrongLifts 5×5](https://stronglifts.com/stronglifts-5x5/workout-program/) | A named program has an actual schedule, set scheme and progression | Incomplete reference programs no longer pretend to implement the full program. |
| [Wendler's beginner 5/3/1](https://www.jimwendler.com/blogs/jimwendler-com/101065094-5-3-1-for-a-beginner) | Training-max programming sits inside a broader training plan | The limited main-lift adaptation is clearly labeled. |

Competitor documentation describes product behavior; it is not independent evidence that a product produces better outcomes. This was a documentation comparison, not a paid, hands-on trial of those apps.

## Verification

Run with Node 20+:

```sh
npm ci
npx playwright install chromium
npm test
```

Windows uses installed Microsoft Edge by default. Set `BROWSER_CHANNEL=chromium` to use downloaded Chromium instead. Optional `APP_URL` must point to an isolated localhost app. Tests create a disposable browser profile, disable sound/haptics and use synthetic data; they never load the user's real workout history. The Playwright dependency is development-only; production retains no build step or framework.

The suite parses every inline script, tests 432 generated combinations (six focuses × eight splits × three session lengths × three equipment configurations), checks focus-specific progression/cardio and started-session preservation, exercises save corrections, timers, units, records, backup import through the file picker, and reload. It also checks ten page widths and 59 modal shells at 430 × 932. Modal width checks do not prove every populated modal workflow. Results and screenshots are written to ignored `.verification/` files.

Latest completed verification: **116 checks passed; zero failures and zero browser errors**, including an offline service-worker reload and three development-server access checks. `git diff --check` passed. A phone-size screenshot was visually reviewed. The final pass also used a clean `npm ci --ignore-scripts` installation of the locked dependencies (zero reported dependency vulnerabilities).

## Final pre-merge review

A further review added ten regression/workflow checks and a nonempty workout/nutrition backup round trip. It reproduced and corrected four additional tracking defects:

- Completed cardio, including legacy entries, now uses the same duration/completion rules in Today, save previews and history. Skipped or merely typed unfinished cardio is excluded; a checked-off block can use its planned duration when actual time is blank.
- Manually entered cardio calories take precedence over estimates. Skipped lifting no longer contributes to the save-preview calorie calculation.
- Editing distance, time or heart rate preserves manually entered running calories. Clearing distance or time clears an otherwise stale pace.
- Reaching the maximum configured equipment load now holds earned reps instead of announcing a zero-pound increase and resetting reps.

The new regressions were observed failing before the fixes and passing afterward. Further checks cover metric body-weight/measurement entry, same-day corrections/deletion, food and water logging/removal, recovery/check-ins, goals, supplement toggles, saved templates, separate gym histories, and a simulated storage-quota failure. Save failure is verified not to display a successful workout summary or alter the previously persisted state. In-memory edits remain available for retry/export.

## Recommended next improvements

1. Run this harness on every pull request and make its result a required merge check. [Playwright documents GitHub Actions integration](https://playwright.dev/docs/ci-intro). This repository currently has no remote status check for the suite.
2. Add a visible backup-health indicator, versioned recovery copies, and a restore preview that shows workout/date counts before replacement. Browser [persistent-storage requests](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) can help protect local data but are not a substitute for backups.
3. Add per-exercise recommendation explanations: the previous comparable session, why load/reps changed, equipment limits, and how reported difficulty affected the decision. The existing workout-level explanation is a useful start.
4. Expand records into distinct best load, repetitions at a load, estimated maximum and session-volume categories, keeping assistance exercises separate.
5. Complete physical iOS/Android session checks: lock/unlock during timers, offline saving, reopening, and applying an update without losing an unfinished workout. Add accessibility checks for controls, focus navigation and contrast.

## Remaining boundaries

- Actual iPhone/Android suspension, notifications, installation/update prompts and training-session usability still need on-device testing. Desktop Chromium emulation is not a physical phone test.
- No full nutrition, supplement, marathon-coaching, AI-provider or NAS integration certification was performed. Existing prose elsewhere describing everything as feature-complete should not be read as verified evidence.
- Equipment setup instructions and catalog coverage are broad but not exhaustively certified exercise by exercise. Machine starting resistance and increments vary by model; use its label and the app's load configuration.
- No software test can establish ideal exercise form, personal recovery, adherence, an optimal program, or future physiological results. Evaluate actual performance trends and adjust training accordingly.
- Data remains primarily browser-local. JSON export is still important; storage can be cleared by the browser or device. This change does not introduce cloud synchronization.
- Repository changes do not automatically update a separately hosted site or an installed phone copy. Merge/deploy the reviewed changes and accept the PWA update before expecting the corrected behavior there.

## October 11, 2026 addendum: live re-planning, specialty sets, loads, organisation, home workout

These changes were made at the user's explicit request. Where they reverse earlier decisions above, this section takes precedence.

- **Live sessions follow the plan.** A session is *live* while its day is today or later and it is not saved to history, or while its workout clock is still running. Changing the split (Plan page or Today switcher), the focus, the intensity or the gym re-plans a live session even mid-workout. Logged sets are carried over by exercise identity. An exercise already worked on that the new plan drops stays at the top, marked as done under the earlier plan. Unlogged suggestions are re-derived. Index-keyed state (swaps, supersets, order) is reset. Saved and past sessions keep their snapshot, as before. This replaces "started workouts keep their exercise list when the default focus changes".
- **Repeated split switches.** The first Today switch moves the skipped workout to the next gym day. Later switches undo that shift first, so the week is never shifted twice, and switching back to the planned split restores it.
- **End without saving.** `discardWorkout()` clears the day's logged work and clock. History is never touched.
- **Specialty sets reinstated, as extras.** Each focus gets an automatic technique matched to its goal, always as an extra set after the work sets. The three-work-set floor and the three-straight-sets progression rule are untouched, and the extra set never counts toward records or progression.

  | Focus | Specialty set | Evidence |
  | --- | --- | --- |
  | Build Strength | One cluster set on the main lift | Clusters preserve velocity and force within a session ([Latella et al. 2019](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6851217/)). Chronic strength gains match straight sets (Jukic et al. 2021; [Davies et al. 2021](https://edisciplinas.usp.br/pluginfile.php/8499875/mod_resource/content/0/intervalo_entre_repeticoes_forca_hipertrofia_davies_2021.pdf)). |
  | Muscle + Strength | Cluster on the main lift; rest-pause on an accessory | As above |
  | Build Muscle | Drop set on the last isolation / machine exercises; one set to technical failure on a machine isolation | Drop sets showed no significant hypertrophy difference from traditional sets, with time savings in some protocols ([Sødal et al. 2023](https://pubmed.ncbi.nlm.nih.gov/37523092/)). Training to momentary failure has not been shown superior to non-failure training ([Refalo et al. 2023](https://pubmed.ncbi.nlm.nih.gov/36334240/)), so it is one optional extra set. Never on free-weight compounds. |
  | Lose & Tone | Drop sets on two isolation exercises | Keeps volume up in less time while cutting; hypertrophy comparable to traditional sets (Sødal 2023) |
  | Endurance | Rest-pause on accessories | In a small trained sample, rest-pause gave greater leg-press muscular endurance than straight sets ([Prestes et al. 2019](https://pubmed.ncbi.nlm.nih.gov/28617715/)): a bounded rationale, not a universal advantage. |
  | General Fitness | One drop set on the final isolation exercise | — |

  ACSM's resistance-training guidance treats advanced techniques (drop, rest-pause, cluster,
  failure) as optional and supports varying load and volume by goal; it does not validate this
  app's specific six-focus algorithm. The table above is the rationale for each choice, not a
  claim that the technique is required or superior.

  Specialty sets have their own switch (Settings → Specialty sets, or the ✨ chip on Today), independent of supersets. Supersets remain antagonist-paired and are no longer gated on the specialty-set switch ([Zhang et al. 2025](https://eprints.leedsbeckett.ac.uk/id/eprint/11908)).
- **Work-set doses.** Main lifts get 4 sets for Strength, Muscle + Strength and Build Muscle, and 3 for General, Tone and Endurance. This follows the NSCA ranges: strength 2–6, hypertrophy 3–6, general and endurance 2–3. Accessories stay at 3.
- **Profile starting loads.** The flat `weightPct` multiplier was replaced. `focusLoadFactor` converts the profile's 7-rep working weight to the load that leaves the focus's planned reps in reserve at the prescribed reps (Epley). That puts Strength at about 88 % of 1RM, Muscle about 79 %, Tone and General about 72 %, and Endurance about 63 %. The old ×1.15 strength factor put 3×4 above a true 4-rep max.
- **Organisation.** `exerciseCategory` sorts every exercise into one of six groups: Calisthenics, Dumbbell/Barbell, Plate-Loaded, Pin-Select (including cables), Bands/Springs & Functional, or Cardio. `equipmentCategory` does the same for every piece of equipment. Exercises are also sorted into seven body areas. `getExType` now uses the category instead of defaulting unknown exercises to a selectorized stack; 432 of 719 library exercises previously fell through.
- **Home workout.** See [HOME_EQUIPMENT.md](HOME_EQUIPMENT.md). Home sessions are `type:'home'` in history. They count toward the streak, calories, muscle recovery, weekly coverage and records, which are tracked per exercise. Progression history is kept per location.

Verification: 141 browser checks pass, adding regression tests for each item above. The tests cover all four home splits × six focuses × two lengths, and all six gym focuses × eight gym splits × three lengths.

## October 31, 2026 addendum: rest timer, set ranges, time estimates, cardio blocks, gym-first equipment

Made at the user's request. Where it differs from the sections above, this section takes precedence.

- **Rest timer always visible.** It is now a bar pinned above the bottom navigation on every page. Two defects made it disappear: viewing a rest or run day hid it and nothing showed it again while it kept counting, and the 2.5 s "GO!" hide could remove a countdown started right after. Every logged set starts it, including the last set of an exercise; a drop set gets 10 s and rest-pause 20 s before it. The first half of a superset round still goes straight to the partner.
- **Set ranges.** Three work sets remain the minimum. The maximum depends on focus and on main lift vs accessory: Build Strength, Muscle + Strength and Build Muscle main lifts up to 6 (Muscle accessories 5, others 4); Lose & Tone, General and Endurance up to 4. Full sessions add a set to the main lifts of the strength and muscle focuses (5). Adding a work set stops at the maximum.
- **Specialty sets on every day.** When a day has no eligible exercise for a focus's technique (a Strength core day with no barbell lift, an Endurance Quick day of three compounds), it goes on a machine or cable lift instead, never a free-weight compound. Verified for all 6 focuses × 8 splits × 3 lengths.
- **Time estimates.** Specialty extras are costed by type (a cluster or failure set includes its full rest). The displayed estimate is scaled by the user's own pace: the median ratio of real lifting time (workout clock − logged cardio − setup) to the model across the last 8 saved sessions, clamped to 0.9–1.5×. On the user's October data this is ×1.30. At the user's request the pace changes only the time shown, not the plan: Standard keeps the same number of exercises it always had, and Quick keeps three exercises and its warm-up even when that runs past 45 min. Standard/Full plans that exceed the band shorten the finisher, then take extra main-lift sets back toward three.
- **Cardio in 5-minute blocks.** Warm-up 5 min (Full 10; Strength Quick none), circuit blocks 5 min, finisher a multiple of 5 within the focus cap. The actual time logged stays free-form.
- **Clocks.** All timers read in minutes until 90 minutes (75:30, 89:59), then hours (1:30:00). Saved durations read "75m" below 90 and "1h 52m" from 90.
- **Equipment groups.** Cable machines and pin-select (selectorized, non-cable) machines are separate groups, and a new Benches & Stations group holds bodyweight work that needs gym equipment but no weights (Target Abs bench, back-extension bench, captain's chair, dip / pull-up stations, TRX). Calisthenics now means no equipment at all.
- **Split-switch fix.** Switching Today back to its planned split dropped the record of later days the user had edited on the Plan page, so the next switch could overwrite that edit. The record is now kept. It appeared only on some dates because Auto-Rotate decides what the planned split is; the existing test now passes on eight simulated dates, and a new test hits the path on any date.
- **Gym equipment first.** At the gym, machines, cables, free weights and stations are selected, ordered and substituted before sleds and bands, and those before calisthenics. Calisthenics appear only when no gym option fits. Accessories logged at that gym in the last 90 days are offered first within their tier. Home workouts are unchanged.

Verification: the browser suite adds checks for each item above (rest bar on every page/day view and after the last set, drop-set rest, per-focus reps/sets/specialty for 144 combinations, the add-set maximum, 5-minute cardio, Standard/Full band fit, pace calibration, the clock format, gym-first order for 144 combinations, and the new equipment groups). Service-worker shell cache advanced to v21.

## November 22, 2026 addendum: focus consolidation and weekly programs

Supersedes the focus table and the Muscle + Strength / Chest & Core statements above. Driven by a review of the athlete's 16 logged gym sessions (Oct 17 – Nov 22).

What the history showed:
- **Muscle + Strength was redundant.** Main lifts 4–8 @ 180 s sat between Build Strength (3–5) and Build Muscle (6–12) and changed nothing about exercise choice. Folded into **Build Muscle**; `hybrid` is migrated to `muscle` and normalised wherever an old session is read.
- **Chest & Core did not work at the gym.** It replaced each day's template with a fixed list, so Upper became Bench / Row / Rotary Torso / Pulldown (4 exercises, 18 sets) and Push became Bench / Incline / Rotary Torso / Shoulder Press, with accessories at an odd 13 reps (midpoint of 10–15). It is now **Home-only** (bodyweight + home gear, `hchestcore`), accessories 10–14. A gym plan left on it returns to the last gym focus actually trained (here: Lose & Tone) and the Home focus keeps Chest & Core.
- **Every future day was pinned to a manual split.** Week shifts from the Today switcher had written a mixed 8-split cycle (arms, glutes, core, push, pull…) into `dayConfig`, so Auto-Rotate never ran. The Plan page now offers **Follow <program>**, which clears upcoming manual picks.
- **Strength made every press/row/pulldown a 3–5-rep main lift** at 210 s, giving 3-exercise days with no vertical pull on Upper. Strength now has one or two **lead** lifts (first slot; plus the row on Upper and the press on Full Body) at 3–5 × 4 sets; supporting compounds are 6–8 × 3 @ 150 s; accessories 8–12 @ 90 s.

| Focus | Compounds | Accessories | Program by scheduled gym days |
|---|---|---|---|
| Build Strength | lead 3–5 @ 210 s (4 sets); others 6–8 @ 150 s (3) | 8–12 @ 90 s | Full Body ≤3 · Upper/Lower 4+ |
| Build Muscle | 6–10; lead 150 s, others 120 s (4 sets) | 10–14 @ 90 s | Full Body ≤3 · Upper/Lower 4 · PPL 5+ |
| Lose & Tone | 10–14 @ 75 s | 10–14 @ 75 s | Full Body ≤3 · Upper/Lower 4+ |
| General Fitness | 8–12 @ 75 s | 8–12 @ 75 s | Full Body ≤3 · Upper/Lower 4+ |
| Endurance | 15–20 @ 35 s | 15–20 @ 35 s | Full Body ≤3 · Upper/Lower 4+ |

Rationale: these thresholds are **planning defaults, not claims of an optimum**. Frequency mostly matters as a way to distribute weekly hard sets (Schoenfeld 2016 suggested twice-weekly exposure; the volume-equated 2019 analysis and ACSM 2026 do not establish a best frequency). Five-day PPL gives each day about 1.67 exposures a week on a continuous rotation, so only Build Muscle uses it and only at 5+ days. Heavier loading drives maximal strength; Upper / Lower simply spreads the heavy lifts. Endurance moves to Upper / Lower at 4+ days so the same muscles are not trained on consecutive days alongside running (NSCA frequency guidance counts other training load). Compounds sit at 6–10 for load progression and isolation at 10–14 for practical loading; the load meta-analyses were largely to momentary failure, so the RIR targets are a practical choice rather than a tested equivalence. Singer et al. 2024 found little extra hypertrophy beyond ~90 s rest, so 90 s is the accessory default and longer compound rests are for performance.

Other changes:
- **Splits are grouped by program** in every picker (Today switcher, Plan day, schedule editor), the focus's program first and open. Core, Arms and Glutes are "Add-on days". The single-muscle days (chest, back, shoulders, quads, hamstrings, calves) overlapped Push/Pull/Lower and are no longer listed; they still load for history and existing plans. Template headings: Upper Body, Lower Body, Full Body.
- **Auto-Rotate follows the workouts actually saved.** A past gym day that was not trained no longer uses up a rotation slot. The Today switcher's recommendation is the program's next split (`programSplitFor`).
- Upper template order is Bench, Row, Pulldown, Incline, so short sessions keep a vertical pull.
- Filler exercises never make a third exercise of one movement pattern (no third overhead press on Push, no box squat after back squat and lunges); core days are exempt so ab machines come before calisthenics.
- At an equipment cap (no heavier step) the reps already earned are held instead of being cut to the range ceiling.

Verification: 226 browser checks pass, including new checks for program choice by focus × gym days, rotation from saved workouts, migration of both retired focuses, lead-lift tiers, the grouped pickers and the Follow button. All 75 gym focus × split × intensity combinations and the Home Chest & Core workout were also driven with the athlete's real backup.

### Review fixes (November 23, 2026)

An external review of this change found, and this pass fixed:
- **Restores are atomic.** File import, Paste Backup and NAS restore all go through `validateBackupState` and `_commitRestore`, which rolls back to the previous state if loading or migration fails (NAS restore previously skipped validation).
- **Reset All Data** works through both confirmations (`confirmYes` clears its callback before running it).
- **Lead roles are recorded.** Saved exercises carry `lead`; history is judged against the role it was prescribed for (sessions saved before the flag count a Strength main lift as a lead). A lift that changes role on Strength gets its load re-derived for the new rep target instead of progressed. Rich templates keep `anchor`/`lead`; older templates infer them.
- **Rotation.** The auto-split cache is per calendar day and the Plan rebuilds on midnight rollover; a saved workout counts even if its day was later re-typed; a day a Today switch shifted the skipped workout onto is the program's plan for that day.
- **Follow** pins an in-progress workout's current split even when it came from the weekly default. A schedule with no gym days says so instead of claiming three.
- **Swaps** between a main lift and an accessory take the replacement's own reps and rest.
- `hybrid` history counts as Build Muscle in migration and in the progression focus comparison.

Second review round (same day):
- **Restore is a single transaction.** The candidate is migrated and render-checked (`_restoreSmoke`) in memory with `saveS` and catalogue rehydration suppressed (`_restoreDryRun`); its final bytes are written once, then it becomes the live state. A storage failure at that write leaves everything as it was. `validateBackupState` also rejects any top-level field whose type differs from a fresh state (e.g. `daySched: null`, `shoes: {}`).
- **Roles live on the sets.** Every unlogged work set is stamped `lead`, so work logged as a lead lift stays lead work through a live re-plan. History role = the sets' role, then the exercise flag, then the legacy assumption; work from both roles in one exercise never triggers a load increase. Swaps pass the destination slot's role into progression, and a role change derives its load from the best single completed set (`e1rm`), never from one set's load and another's reps.
- **Swaps across classes** take the replacement's set count, priority and ceiling as well as its reps and rest.
- **Templates** carry `roles:1`; older ones infer leads only from their own `baseSplit`.
- **Day rollover** is checked on visibility, focus and pageshow, and once a minute while the app stays open.
- **Copy.** Program descriptions describe the schedule the app actually produces (a fixed 5-day PPL preset gives Legs one slot; Full Body is best on non-consecutive days). With no gym days, no program is recommended anywhere.

Third review round:
- **Workout snapshots are validated on restore.** `exList` must be an array of named exercises; `exOrder`, `supersets`, cardio blocks, swap records, notes, added exercises and the workout timer must have their expected types; the smoke check also builds every saved session's exercise list.
- **Rollover respects work in progress.** It waits while any sheet is open, and an unsaved workout with logged activity stays on screen. The save sheet is bound to the day and mode it opened for (`_pendingSaveTarget`).
- **Mixed-role history.** Partly tagged work counts as mixed. On a Strength main lift, mixed work informs only the role being prescribed now (`getLastExSession(name, focus, curLead)`); if none was done in that role the other role's work re-derives the load, and untagged work alongside tagged work never adds load. The mixed guard applies only where the role changes the dose (Strength main lifts). A live re-plan backfills the old slot's role onto logged sets that predate the stamp.
- A swap to a main lift takes priority 1; with no gym days the Today switcher recommends nothing either.

Fourth review round:
- **Restore checks.** `exOrder` may not hold negative or repeated indices, and a full-length order must be a permutation (shorter or longer orders are repaired by the renderer). Warm-up rows and run `splits` are validated. The smoke check walks every saved Gym and Home session under its own date and mode and resolves every ordered exercise.
- **Each role keeps its planned sets.** Mixed-role filtering keeps that role's unfinished sets, so 3 of 4 lead sets is not a completed lead prescription.
- **Legacy backfill on re-plan.** For a Strength main lift, a logged set's own target decides its role (3–5 reps = lead); other lifts take the old slot's role.
- **Deferred Today advance.** The date change is recorded at once; Today moves to the new day only when the day on screen has no unsaved work under way, and a running cardio countdown counts as work.

Fifth review round:
- **Restore normalises and renders.** Numbers saved as text in history (distance, duration, volume, sets, cardio minutes, calories, elevation), body weights and measurements are converted to numbers; anything non-numeric fails. Measurement rows must be objects with a valid date. Inside the dry run the smoke check also renders Body, Marathon, History (and every history entry's detail), Progress, Goals and Home, so a shape the validator misses fails before the write; a rejected restore repaints the pages with the live state (`_repaintAfterRestore`). The history detail no longer assumes `day`, `phase`, `week` or an array `cardio`.
- **Unknown-role work withholds load.** In mixed-role history any untagged straight work set, done or not, keeps the role's work from counting as complete.
- **A picked date cancels a deferred advance.** `_rolloverPending` holds the date key of the workout it is waiting on; if the viewed date is no longer that day, the pending advance is dropped.

Sixth review round:
- **The restore check renders off screen.** `_restoreRenderCheck` renders Body, Marathon, History, Progress, Goals, Home, Nutrition, Plan (with saved workouts) and Equipment from the candidate inside `_inIsolatedDom`: page lookups go to an inert copy of the app, timers and storage writes are held, and the timer ids and history selection are put back. Nothing reaches the screen, so a rejected restore or a failed final write leaves the page, scroll, open sheet and fasting timer as they were, with no repaint. The stored bytes are fixed before the render, and the live state is parsed from them.
- **History detail is built, not mounted.** `_histDetailParts(entry)` returns the title and markup; `openHistDetail` mounts it. Imported text in the history list and detail (day, focus, phase, pace, HR, splits, cardio names…) is escaped, and history ids must be numbers because they are placed in click handlers.
- **More restore validation.** Numbers must be numbers or numeric text (`[3]` and `true` fail). No top-level list may contain empty rows or mix records with bare values. Fasts need a start (epoch or date text); saved workouts need an exercise list. Food rows' macros must be numeric and numeric text is converted, so two "100" kcal rows total 200; water and the water log are checked.

Seventh review round:
- **Imported names render as text.** User-entered names placed into page markup are escaped wherever they appear: exercise names (Today, History list, templates, swap and stall views), saved-workout names and previews, food, recipe, ingredient, meal-plan and beverage names, custom equipment and gym-profile names, shoes, supplements and goals. Text shown through `textContent` (toasts, confirms, prompts) is left as it is.
- **History ids are unique numbers.** `migrateState` gives any history entry with a missing, non-numeric or repeated id the next free number (max + 1), so the detail sheet and Delete always act on one workout. Existing unique ids are unchanged.
- **Saved workouts are checked down to their set rows.** Each exercise needs a name; `sets`, `reps`, `rest` and `p` are numbers or descriptive text; optional `setData` must be an array of set rows with numeric-or-blank weight and reps.
- **Fast times are epoch milliseconds.** Date text is converted on restore, and a blank start is rejected.

Eighth review round:
- **Escaping by construction, not by finding.** Every record property concatenated into page markup now goes through `escapeHtml` (about 480 sites, applied mechanically): exercise targets, serving labels, custom-library muscle labels, equipment descriptions and notes, template rep text, set types, injury tags and the rest. Left raw on purpose: `body`/`html` fields that hold the app's own markup, `length`, and plain-text sinks (toasts, confirms, prompts, `textContent`, storage keys, the AI prompt). A sweep of all ten pages and every history detail, with a fresh profile and a real backup, shows no double-escaped text.
- **Inline handlers are quote-safe.** All 101 handlers that pass a value inside a quoted JS string (`onclick="f('…')"`) now use `jsArg(v)`, which JS-escapes backslashes, quotes and line breaks and then HTML-escapes, so a name such as `Curl "Pro" 12' Bar` reaches Info, Chart, Swap and the rest intact. The Today rest button takes `parseInt(rest)`.
- **Record ids are unique positive safe integers** in history, saved workouts, recipes, shoes and race results (`migrateState`). The first holder of a good id keeps it; missing, text, 0, unsafe (`1e20`) or repeated ids get the smallest unused integers, which new `Date.now()` ids never meet.
- **Saved workouts:** `sets`, `rest` and priority are numbers (a label such as "90 seconds" keeps its number); `reps` may stay descriptive.

Ninth review round:
- **One delete, one record.** Deleting a gym profile or a My Foods entry removes only the first match. `migrateState` also gives a repeated gym-profile id a new one (`id-2`, …) and a repeated food name a suffix (` (2)`), dropping exact duplicate foods; references keep pointing at the first holder.
- **Composed labels.** Equipment notes, extra-activity metadata (`meta.join`), activity chip data attributes and search-query echoes (beverages, the exercise library, rest items) are escaped.
- **Plain text stays plain.** The sweep's escaping was removed where the text never becomes markup: share text (including PR exercise names, which were escaped before this PR), the deload confirmation, the barcode serving label (escaped again at display), stored beverage names, the rest-protocol search haystack, coaching tips and the home run glance.
- **Plan tooltips** use attribute escaping, so a note keeps its quotes and literal `&quot;` exactly.
