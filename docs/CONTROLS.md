# Per-Control Reference

A developer's index of the app's controls, mapped to the functions that power them — so when you
want to change a feature you can jump straight to the code. The user-facing feature descriptions
live in [`../README.md`](../README.md); this is the "which function do I edit" companion.

Conventions: everything lives in `pf_workout_tracker.html` (single file). State is the global `S`,
saved by `saveS()`. Most screens have a `build*`/`render*` entry function that regenerates the DOM.
Search the file by function name to find a control.

---

## Top-right toolbar (every screen)

### 💪 Strength Profile — `strengthModal` (opened by `renderStrengthModal()` + `openModal('strengthModal')`)
| Control | Function(s) | What it does |
|---|---|---|
| Tab switch (Profile/Test Max/PRs/Notes) | `switchSpTab(tab)` | Shows the matching `spPane-*` pane |
| Relative-strength scores (Wilks/DOTS) | `buildWilksDots()`, `calcWilks()`, `calcDOTS()`, `wilksRating()` | Renders score tiles at top of Profile tab |
| "What is this?" (Wilks/DOTS) | `openWilksInfo()` | Explainer modal |
| Working-weight fields per lift | `renderStrengthModal()` → `spFields`; `saveStrengthProfile()` | Edit/save each lift's working weight (`S.strength`) |
| Estimate accessories from Big 4 | `estimateAccessoriesFromBig4()` | Derives every accessory weight from bench/squat/deadlift/OHP via ratios |
| Test Max: lift select | `onTestLiftChange()` | Updates label/units for the chosen lift |
| Test Max: weight × reps inputs | `updateTestMaxPreview()` | Live est-1RM (Epley) + the working weight that will be stored (1-rep test → ~80%) |
| Test Max: Apply to Profile | `applyTestMax()` | Writes working weight + 1RM; appends to per-lift `S.strengthTests` |
| PRs list | `buildSpPRList()` | Personal bests per exercise (from `S.pbs`) |
| Notes per lift + Save | `buildSpNoteFields()`, `saveStrengthNotes()` | Per-lift cues/injuries (`S.strengthNotes`), shown on workout cards |
| Strength program chips/detail | `renderProgramChips()`, `renderProgramDetail()`, `selectProgram(id)`, `setProgramTM(lift)`, `openProgramsModal()` | Pick/configure a program (e.g. 5/3/1), set training maxes |

### 🏋️ Plate Calculator — (opened by `openPlateCalcModal()`)
| Control | Function(s) | What it does |
|---|---|---|
| Target + bar weight | `calcPlatesModal()` | Renders plates-per-side; "off by X / try Y" when not loadable; lb/kg aware |

### ⚙️ Settings & Profile — `setupModal` (opened by `openSettings()`)
| Control | Function(s) | What it does |
|---|---|---|
| Profile fields (name/height/goal/age/sex) | `openSettings()`, `saveSettings()`, `cancelSettings()` | Read/write `S.profile` |
| Weight unit (lb/kg) | `setWeightUnit(u)`, `_applyWeightUnitUI()` | Unit applied app-wide via `toDisplayWeight`/`fromDisplayWeight` |
| Activity level + TDEE preview | `setActivityLevel(l)`, `updateTDEEPreview()` | Calorie-target basis |
| Default intensity | `setDefaultIntensity(i)` | Baseline Quick/Standard/Full |
| Default gym/run days | `saveSettings()` (`S.setup.gymDays`/`runDays`) | Baseline weekly schedule |
| Preference toggles | `toggleAutoRotate`, `toggleAutoSuperset`, `toggleWarmupSets`, `toggleAutoTimer`, `toggleSmartNote`, `toggleRunMode`, `toggleNetCarbs`, `togglePlateDisplay`, `toggleAdaptiveTDEE`, `toggleAdvSuggest` | Flip the matching `S.prefs.*` (note: "enabled unless `===false`" for the workout ones) |
| Reminders | `renderReminderSettings()`, `toggleAllReminders()` (master), `toggleReminder()`, `saveReminderPrefs()`, `requestNotifPermission()`, quiet-hours + week-start inputs | Reminder scheduling + master off-switch |
| App-lock PIN | `setAppLock()`, `renderAppLockSetting()`, `_lockCfgGet/Set()`, `_hashPIN()` | Optional PIN gate |
| Theme | `renderThemeSetting()` / theme setter | Light/dark |
| AI Exercise Guides key | `saveAnthropicKey()`, `renderAnthropicKeyStatus()` | Stores key in `localStorage['pf_anthropicKey']`; updates live `ANTHROPIC_API_KEY` |
| Export / Import backup | `exportData()`, `importData()` | JSON full backup / restore (double-confirmed) |
| CSV exports + report | `exportCSV(kind)`, `printReport()`, `_csvEsc/_csvJoin/_downloadFile` | weights/nutrition/workouts/runs/health CSVs; printable summary |
| Reset all data | `resetAllData()` | Double-confirmed; clears all `pf_*` keys |
| NAS (Tailscale) backup | `nasCfgGet/Set()`, `nasReadCfgFromUI()`, `nasMaybeAutoBackup()`, NAS push/test | One-way push to a Synology; creds kept out of the export |

---

## 🏠 Home — `buildHomePage()`
| Control | Function(s) | What it does |
|---|---|---|
| Today's plan card | `buildHomePage()` (+ `homeNav(page)`) | Status + jump to Today |
| Recovery check-in | `buildRecoveryCheckin(k)`, `setRecovery()`, `selectSoreness()` | Inline sleep/energy/soreness inputs |
| +Water / Log Weight | `homeQuickWater(ml)`, `homeQuickWeight()` | One-tap quick logs |
| Supplements | `buildHomeSupps()`, `toggleSuppToday(id)`, `getSuppStreak()` | Daily supplement checklist + streaks |
| Weekly check-in | `buildCheckinCard()`, `openCheckinModal()`, `saveCheckin()` | Sunday/when-due check-in |
| Backup banner | `checkBackupReminder()`, `exportData()` | 30-day backup nudge |

## 🏋️ Today — `buildTodayWorkout()` → `buildGym()`, `buildWeekStrip()`
| Control | Function(s) | What it does |
|---|---|---|
| Week strip | `buildWeekStrip()` | Per-day dots; tap to change `vDate` |
| Intensity selector | `setIntensity(lvl)` | Quick/Standard/Full; rebuilds + clears stale state |
| Engine (auto-build) | `selectWorkoutForDuration()`, `buildGym()`, `getRenderedExList(k)` | Picks exercises/sets/cardio; snapshots `sess.exList` |
| Set done toggle | `toggleSet(ei,si,btn)` | Marks set done; rest timer + superset handling |
| Weight/reps inputs | `updateSet(ei,si,field,val)` | Writes set value (weight stored in lbs) |
| Add set / type picker | `addExtraSet(ei,type)`, `addContinueDrop(ei,si)`, `removeExtraSet(ei,si)` | Add work/drop/failure/rest-pause; drop chains |
| Set-type change | `updateSetType()`, `autoFillSetType()`, `applySmartSetTypes(k)` | Assign/auto-assign advanced set types per focus |
| Warm-up sets | `getWarmupSets()`, `toggleWarmup(ei,wi,btn)` | Auto warm-up ladder + done toggles |
| Swap / Skip exercise | `openSwap(idx,name)`, `doSwap()`, `undoSwap()`, `toggleSkipExercise(ei)` | Equipment-valid swap (no dupes); skip excludes from save |
| Quick-fill | `quickFillExercise(ei)` | Pull last session's sets |
| Superset link/unlink | `openLinkModal(ei)`, `linkSuperset(ei,p)`, `unlinkSuperset(ei)` | Pair + alternate two exercises |
| Plate hint | `calcPlates()`, `_plateHint()` | Per-set bar loading |
| Rest timer | `startTimer(s,force)`, `pauseTimer()`, `stopTimer()`, `addTime(d)` | Auto rest countdown + cues |
| Workout timer | `startWorkoutTimer()`, `pauseWorkoutTimer()`, `resumeWorkoutTimer()`, `endWorkoutTimer()` | Session stopwatch |
| Cardio blocks | `buildCardioBlock()`, `updateCardioBlock()`, `toggleCardioBlock()`, `toggleCardioSkip()`, `startCardioTimer()`, `openCardioSwap()`, `selectCardioSwap()`; dedup `cardioTypeKey()` | Warm-up/mid/finisher cardio, each with timer + swap; no machine twice/day |
| Smart note | `applySmartSetTypes()` (sets note), `dismissSmartNote(k)` | Plain-English plan summary |
| Split switcher | `buildSwapWorkoutBanner(k)` | Override today's split |
| Templates | `promptSaveTemplate()`, `confirmSaveTemplate()`, `applyWorkoutTemplate(id)`, `resetToAutoWorkout()`, `_captureRichTemplate(k)` | Save/apply a full session; reset to engine |
| Save flow | `saveWorkoutPrompt()`, `confirmSave()`, `doSaveWorkout(rating,notes)` | Compute volume/sets/cals/PRs → summary → history (idempotent) |
| Run mode (run days) | run branch of `doSaveWorkout`, run input handlers | distance/time/pace/HR/RPE/cadence/elevation/splits/injury |
| Rest-day mode | `buildRestDayRecovery()`, `buildRestDayRecovery`/recovery "Log Done" handlers | Active-recovery/mobility library + targeted stretch suggestions |

## 📋 Plan — `buildPlan()`
| Control | Function(s) | What it does |
|---|---|---|
| Week focus | `buildWeekFocusRow()`, focus setter (`S.weekFocus`) | Drives the engine |
| Calendar + view toggle | `buildPlanCalendar()`, `setPlanView(v)`, `planOffset` nav | Week/2-week/month |
| Per-day editor | `openDayModal()`/`buildDayPreview()`, `saveDayConfig()`, day-type/split setters | Override a day's type/split/note |
| Schedule editor | `openScheduleEditor()`, `renderScheduleEditor()`, `saveScheduleEditor()` | Assign gym/run days + splits |
| Auto-rotate | `toggleAutoRotate()`, `autoSplitFor(k)`, `getEffTpl(k)` | Rotating split scheme |
| Training-load heatmap | `buildTrainingLoadHeatmap()` | 8-week volume heatmap |
| Deload scheduler | `openDeloadScheduler()`, `getDeloadRecommendation()`, `confirmDeloadSchedule()`, `removeDeloadWeek()`, `isDeloadWeek(k)`, deload banners | Schedule/auto-recommend deloads |
| Strength-program card | `renderStrengthProgramCard()` | Active program summary |

## 🧰 Equipment — `buildEquipmentPage()`
| Control | Function(s) | What it does |
|---|---|---|
| Gym profiles | `setActiveGym(id)`, `confirmAddGym()`, `confirmRenameGym()`, `deleteActiveGym()` | Multiple gyms; active gym drives availability |
| Equipment catalogue + toggles | `buildExercisePage()`/catalogue render; enable/disable handlers (`S.enabledExercises`) | Turn equipment/exercises on/off |
| Custom exercise | `confirmAddCustomExercise()` | Add your own movement |
| Availability engine | `isExerciseAvailable()`, `getEquipmentSafeExercise()` | Gates generation/substitution |

## 🏃 Marathon — `buildMarathon()`
| Control | Function(s) | What it does |
|---|---|---|
| Program + race config | run-program setter, `mWeekNum()`, `mStartDate()`, `getPhase()` | Week/phase derivation |
| Pace zones + race pace calc | `buildPaceZones()` | Easy/tempo/interval/long + target pace |
| Race predictor / countdown | `buildRacePredictor()`, `buildRaceCountdown()` | Riegel predictions; days/% to race |
| Fuel planners | `buildRaceDayFuelPlan()`, `generateFuelPlanFromCalc()` | Carb/fluid plans by duration |
| Long-run history/trend, consistency, PRs | `buildLongRunHistory()`, `buildLongRunTrend()`, `buildRunConsistency()`, `buildRunningPRs()` | Endurance analytics |
| Shoes / stretches / recovery | shoe handlers, `buildStretchLibrary()`, `buildPostRaceRecovery()`, `buildRunModeSelector()` | Mileage rotation, stretches, post-race |

## ⚖️ Body — `buildBodyPage()`
| Control | Function(s) | What it does |
|---|---|---|
| Log weight | `logWeight()`, `homeQuickWeight()` | Add today's weight |
| Weight trend chart | `buildBodyPage()` chart + moving average | Smoothed bodyweight graph |
| BMI + goal progress | `calcBMI()`, `buildBMIGoalCard()` | BMI + direction-aware goal % |
| Time-to-goal | `calcTimeToGoal()` | ETA + weekly rate (loss or gain) |
| Measurements | add/edit/`deleteLatestMeasurement()` + trend charts | Waist/arms/etc. |
| Health markers | `renderHealthMarkers()`, `deleteLatestHealth()` | BP / resting HR / labs |
| Weight history | `renderWeightHistory()` | Editable log |

## 🥗 Nutrition — `buildNutritionPage()`
| Control | Function(s) | What it does |
|---|---|---|
| Log/remove food | `addToCart()`, `unifiedAddToCart(Qty)()`, `addRestItemToMeal()`, `removeFood()` | Foods into meals; macro totals |
| Macro goals/bars | `getMacroGoals()`, `getAdaptiveTDEE()` | Targets + progress bars (zero-goal guarded) |
| Custom foods / search | `saveAndAddCreatedFood()`, `renderMyFoods()`, `renderMyMeals()` | Build + reuse foods/meals |
| Barcode / Open Food Facts | `fetchOpenFoodFacts()`, `bcRenderProduct()` | Scan/lookup (names escaped) |
| Beverages | `openBevPicker()`, `confirmBeverage()` | Volume-scaled cals/sodium + hydration |
| Water | `homeQuickWater()` + page water UI | Daily water + chart |
| Micronutrients | `renderMicroNutrients()`, `toggleMicroNutrients()` | Fiber/sugar/sodium/micros |
| Meal plans / prep / recipes | `openMealPlanner()`/`saveMealPlan()`/`applyMealPlan()`; `openMealPrepBuilder()`/`saveMealPrep()`/`logMealPrepPortion()`; `openRecipeBuilder()` | Plan, prep, recipes |
| Copy yesterday | `copyYesterdayMeal()` | Clone a prior day |
| Diet presets (14) | `DIET_PRESETS`, `MACRO_PRESETS`, diet picker | Macro split + science per diet |
| IF timer / supp scan | `_ifInterval` tick; `scanFoodsForSupp(id)` | Fasting window; foods-cover-supps |

## 🏆 Goals — `buildGoalsPage()`
| Control | Function(s) | What it does |
|---|---|---|
| Active goals | `buildActiveGoals()` + `_gClubTotal/_gBest1RM/_gMinWeight/_gLongestRun/_gPerfectWeeks/_gLongestStreak` | Live goals from logged data |
| Achievements | `buildAchievements()`, `ACHIEVEMENTS[]` | ~35 unlock tests |
| Upcoming milestones | `buildUpcomingMilestones()` | Next thresholds |

## 📈 Progress — `switchProgTab(tab)` → `buildProgressTab()`
| Tab | Function(s) | What it does |
|---|---|---|
| Activity | `buildActivityTab()`, `buildAllTimeStats()`, `buildWorkoutCalHeatmap()`, `buildWorkoutTypeChart()`, `buildStreakDetails()`, `build8020Split()` | Volume/streak/heatmap/80-20 |
| Strength | `buildStrengthTab()`, `buildStrengthStandardsTable()`, `buildLiftRatioCheck()`, `buildOrmMilestones()`, `buildMuscleVolChart()`, `buildSplitVolumeChart()`, `buildExerciseProgressionChart()`/`populateExerciseProgressionSelect()` | Standards, ratios, 1RM milestones, progression, plateaus |
| Body | `buildBodyProgressTab()` | Weight/measurement trends + correlation |
| Nutrition | `buildNutritionProgressTab()` | Calorie/protein/water charts + macro avgs |
| Marathon | `buildMarathonProgressTab()` | Mileage/pace/long-run/compliance |
| Recovery | `buildRecoveryTab()`, `buildMuscleRecovery()` | Recovery score, sleep/energy, 48/72h muscle map |

## 🗂️ History — `renderHistory()`
| Control | Function(s) | What it does |
|---|---|---|
| Session list (by month) | `renderHistory()`, `buildHistMonthBanner()` | Chronological gym+run log |
| Session detail | `openHistDetail()` (sets `selHistId`) | Full breakdown of an entry |
| Delete | `deleteHist()` | Removes entry; `recomputePBs()` + `updateStreak()` |

---

*Tip when extending: keep the `sess.exList` snapshot invariant (index-keyed consumers must use
`getRenderedExList(k)`), preserve the cardio/exercise de-dup (`cardioTypeKey`, used-name checks),
and never hard-code the API key (see [`../CLAUDE.md`](../CLAUDE.md)).*
