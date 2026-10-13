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
