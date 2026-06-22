# PF Fitness Tracker

A personal, single-file fitness tracker built as an offline-capable Progressive Web App (PWA).
Everything — workouts, nutrition, running, body metrics, and progress — lives in one HTML file
and is stored locally in your browser. No accounts, no server database, no tracking.

> Built for one user (me), with [Claude Code](https://claude.com/claude-code) doing the
> implementation. It's a vanilla-JS app: no build step, no framework, no dependencies.
>
> **Developing on this?** See [`CLAUDE.md`](CLAUDE.md) for architecture, the work/research done
> so far, current capabilities, and conventions for future changes — and
> [`docs/CONTROLS.md`](docs/CONTROLS.md) for a per-control map (every control → the function that
> powers it) so you can jump straight to the code when adding or changing a feature.

---

## What it does

PF Fitness Tracker rolls the half-dozen apps a serious lifter/runner usually juggles —
a workout logger (Strong/Hevy), a macro tracker (MyFitnessPal/Cronometer), a run planner
(Strava/Garmin), a body-metrics app, and a progress dashboard — into one local-first PWA.
Because it's built for a single user, it does things subscription apps won't: it **generates and
periodizes** your training instead of just recording it, it **models your specific gym's
equipment**, and it cross-references lifting + running + nutrition + recovery in one place — with
no ads, no account, no paywall, and every number derived from your own logged data.

It's organized into **ten pages** (bottom navigation) plus **three always-available tools** in the
top-right toolbar (Strength Profile, Plate Calculator, Settings). Each is documented below: what it
does, where it goes beyond typical apps, and whether it's feature-complete or has room to grow.

### 🏠 Home — daily command center
A dashboard that surfaces only what matters *today*, rebuilt on every visit.
- **Greeting + streak header** — time-aware greeting and your current workout streak.
- **Today's plan card** — gym / run / both / rest, with the day's split + focus, and live logged
  status ("✅ Gym logged · Easy run 2 mi"); tap to jump to Today.
- **Recovery check-in** — inline sleep-hours + sleep-quality / energy / soreness inputs that feed
  your recovery score without leaving the dashboard.
- **⚡ Quick Log** — one-tap **+Water** and **Log Weight**, the two most frequent entries.
- **Marathon glance** — current training week/phase with a jump to the Marathon page.
- **This Week** — week-to-date volume, sets, cardio minutes, and run mileage.
- **🏆 1000 lb Club** — live bench+squat+deadlift total from your logged PRs vs the 1000 lb goal.
- **Strength-program card** — if a program (e.g. 5/3/1) is active, today's prescribed lifts.
- **🥗 Today's Fuel** — calories / protein logged vs target.
- **💊 Supplements** — today's supplement checklist with one-tap "taken" toggles + streaks.
- **⚖️ Body Weight** — latest weight + trend; **📋 Weekly Check-In** on Sundays / when due.
- **Backup reminder** — a banner if you haven't exported a backup in 30+ days.

*vs other apps:* most open to a generic feed or an empty log; this opens to a context-aware
briefing that already knows your schedule, recovery, and targets. **Feature-complete.** Optional
polish: drag-to-reorder or show/hide cards.

### 🏋️ Today — the live workout
The most-used screen and the app's centerpiece. Rather than a blank logger, it **auto-builds** an
appropriate session, then gives you a deep logging surface.
- **Week strip** — the current week with per-day dots (gym/run/rest + completion); tap any day.
- **Auto-generated workout** — from your focus × intensity × the day's split × what you trained in
  the last 48 h, the engine selects exercises, set/rep targets, rest, set types, and cardio.
- **Intensity selector** — Quick / Standard / Full rescale exercise count, sets, and cardio to a
  target time band (~30–45 / 60–90 / 90–120 min).
- **Set logging** — per-set weight + reps with done toggles, supporting **work, warm-up, drop,
  failure, and rest-pause** set types. Warm-up sets auto-suggest from your working weight; advanced
  set types are auto-assigned per focus and editable.
- **Add/remove sets & "Continue Drop"** — extend any exercise or build multi-stage drop chains.
- **Supersets** — link two exercises; the app alternates them, equalizes their set counts, and
  visually groups the cards.
- **Per-exercise swap** — replace any exercise with an equipment-valid alternative for the same
  muscle (never one already in today's workout).
- **Skip** — drop an exercise for today without losing it from the template (excluded from
  volume / completion / PRs).
- **Plate calculator** — per-set bar-loading visual (which plates per side) for barbell lifts.
- **Rest timer + workout timer** — auto-starting rest countdown with audio cues, plus a
  pause/resume session timer (both leak-free).
- **Cardio blocks** — warm-up, optional mid-workout, and finisher cardio, each with its own
  machine, duration, target, swap, skip, and timer; **a machine never repeats within a day.**
- **Live stats bar** — running sets, volume, minutes, calories, completion %, and PRs.
- **Est. 1RM + progressive-overload alerts** — per-set 1RM estimate and a nudge when you're ready
  to add weight.
- **Smart note** — a plain-English summary of the day's plan and any advanced sets.
- **Split switcher** — override the day's split on the fly.
- **Rich templates** — save a session (exercises, sets, weights, supersets, intensity) as a
  reusable template and re-apply it; "Auto workout" resets back to the engine.
- **Save → summary → history** — saving computes volume/sets/calories/completion/PRs, shows a
  post-workout summary, then writes to history (idempotent — re-saving never duplicates).
- **Run mode** — on run days the page becomes a run logger (distance, time, pace, HR, RPE,
  cadence, elevation, splits, injury tag).
- **Rest-day mode** — on rest days the page becomes an **active-recovery hub**: a library of
  recovery/mobility activities (self-massage, mobility work, easy walks/hikes, stretching, etc.)
  with "Log Done" tracking, plus targeted stretch suggestions for recently-trained muscles once
  you have history. (`buildRestDayRecovery`)

*vs other apps:* Strong/Hevy log what *you* pick; this *prescribes* a periodized session and still
lets you override everything, with cardio, supersets, drop sets, and a plate calc built in.
**Feature-complete** and heavily verified. Possible additions: optional per-set RPE, a global
warm-up-ramp auto-fill, and a rest-day mobility flow.

### 📋 Plan — schedule & periodization
- **Week-focus selector** — set the week's training focus (drives the whole engine).
- **Calendar** — week / 2-week / month views of gym/run/rest days, color-coded, with
  logged-volume/mileage badges; tap a day to edit its type/split or add a note.
- **Weekly schedule editor** — assign which weekdays are gym/run/both/rest and each gym day's
  split; changes propagate to Today, the week strip, and auto-rotate.
- **Auto-rotate splits** — cycle a muscle-balanced rotation so consecutive days don't overlap;
  logged days freeze, manual overrides win.
- **Training-load heatmap** — an 8-week volume/intensity heatmap.
- **Deload scheduler** — schedule deloads (or get a recommendation from accumulated load), with
  "due"/"active" banners and the engine reducing volume on those weeks.
- **Strength-program card** — pick/configure a strength program.

*vs other apps:* periodization, auto-rotation, and deload management are usually coach-only or
premium-tier; here they're built in and visual. **Feature-complete.** Room to grow: drag-and-drop
calendar editing and full mesocycle templates.

### 🧰 Equipment — your gym, modeled
This is what lets the engine pick only exercises you can actually do.
- **Gym profiles** — multiple gyms (e.g. "My Planet Fitness," a home gym), each with its own
  equipment list; switch the active gym and the whole engine adapts.
- **Equipment catalogue** — a large catalogue of machines/equipment, each expandable to the
  exercises it enables, with muscles worked.
- **Enable/disable** — toggle equipment or individual exercises; disabled ones are excluded from
  generation and substitution.
- **Custom exercises** — add your own movements.
- **Accessory estimator** — derive every accessory's working weight from your big-4 lifts via
  strength ratios (one button).
- **Strength profile** — your working weights per lift, used for plate math, 1RM, and prescriptions.

*vs other apps:* most apps use a flat global exercise list; modeling *your specific gym's
equipment* and gating generation on it is unusual and genuinely useful for a commercial-gym
member. **Feature-complete** for use. The underlying catalogue has some unused/alternate entries
(noted in `CLAUDE.md`) worth tidying, and a "scan my gym" first-run wizard would smooth setup.

### 🏃 Marathon / Running — endurance hub
- **Marathon configuration** — pick a training program + race date; the app derives your current
  week and phase.
- **Run programs** — multiple plans (casual re-entry → full marathon) with weekly run types/mileage.
- **24-week phase map** — visual base / build / peak / taper map.
- **This week's runs** — the prescribed runs for the week.
- **Pace zones + race-pace calculator** — easy/tempo/interval/long paces and a target-pace tool.
- **Race-time predictor** — Riegel-model predictions across distances from a recent result.
- **Race countdown** — days to race + % of training completed.
- **Training-run + race-day fuel planners** — carb/fluid plans scaled to run duration/distance.
- **Long-run history + progression trend**, **run consistency** (plan adherence), **running PRs**.
- **Shoe mileage** — track mileage per pair for rotation/retirement.
- **Stretch library** and **post-race recovery** protocol.

*vs other apps:* this is the *planning + analysis* layer Strava charges for — structured plans,
pace zones, predictors, fueling, shoe rotation — not GPS tracking. **Feature-complete** as a
planner. The deliberate gap vs Strava/Garmin is live GPS/HR capture (logging is manual); a future
GPX import would bridge it.

### ⚖️ Body — metrics & trends
- **Weight logging** — log today's weight (lb/kg), also via Home quick-log.
- **Weight trend chart** — bodyweight over time with a smoothed moving average so daily noise
  doesn't mislead.
- **BMI & goal progress** — BMI plus progress toward goal weight, **direction-aware** (works for a
  cut or a bulk).
- **Time-to-goal projection** — projects your goal date + weekly rate from your recent trend.
- **Body-fat tracking**, **measurements** (waist/arms/etc., add/edit/delete + trend charts), and
  **health markers / vitals & labs** (blood pressure, resting HR, etc.).

*vs other apps:* trend smoothing + a direction-aware goal projection beats MyFitnessPal's raw
graph and rivals a dedicated app like Happy Scale, while also holding measurements and lab
markers. **Feature-complete.** Could add: progress photos and a weight-vs-intake overlay.

### 🥗 Nutrition — full macro tracker
- **Meal logging** — foods into Breakfast/Lunch/Dinner/Snacks with running macro totals.
- **Macro goals + bars** — calorie/protein/carb/fat targets with progress bars.
- **Food database + search + "My Foods"** — built-in foods, search, and your saved custom foods.
- **Barcode lookup** — Open Food Facts lookup (external product names safely escaped).
- **Beverages** — quick logger (water/coffee/tea/soda/juice) with volume-scaled calories/sodium
  and hydration weighting.
- **Water tracking** — daily water with a goal + 14-day chart.
- **Micronutrients** — fiber/sugar/sodium and micro breakdown.
- **Meal plans** (build & apply reusable day-plans), **meal prep** (log portions from batches),
  **recipes** (build + log servings with macro estimation), and **copy yesterday**.
- **14 diet presets** — High-Protein, Balanced, Keto, Mediterranean, Pescatarian, Vegetarian,
  Vegan, Paleo, DASH, Low-Carb, Carnivore, Flexitarian, Zone, Endurance-Carb — each with a macro
  split, science notes, and priority/avoid foods.
- **Adaptive TDEE** — adjusts your calorie target from your actual weight-change trend, not a
  static formula.
- **Intermittent-fasting timer** and **supplement scan** (flags which logged foods cover your
  tracked supplements, whole-word matched).

*vs other apps:* it matches MyFitnessPal's core logging (DB, barcode, custom foods, meal plans)
while adding adaptive TDEE, an IF timer, 14 evidence-noted diet presets, and supplement
cross-referencing — with no ads or premium gate. **Feature-complete** for daily use. The one area
MFP/Cronometer still lead is raw database/restaurant breadth (this leans on Open Food Facts + your
own foods); a larger seeded DB or a second food API would close that.

### 🏆 Goals — targets & achievements
- **Active goals** — goal weight, the **1000 lb-club hero goal**, race countdown, and more — every
  one computed from *logged* data via dedicated helpers (nothing is pre-awarded).
- **Achievements** — ~35 achievements across weight, strength, the 1000-lb club, running,
  consistency, and schedule, each unlocked by a real test against your history.
- **Upcoming milestones** — the next thresholds you're approaching.

*vs other apps:* honest gamification — achievements derive strictly from logged performance, and
the headline goal ties to your big-3 PRs. **Feature-complete.** Could add user-defined custom
goals and a shareable achievement card.

### 📈 Progress — analytics (six tabs)
- **Activity** — all-time summary, a 12-week workout-calendar heatmap, workout-type breakdown
  (60 days), workout frequency (8 weeks), weekly workout time, longest streak, and an 80/20
  intensity-vs-time split.
- **Strength** — strength standards vs bodyweight, a lift-ratio "health check" (imbalances),
  predicted-1RM milestones, **Wilks/DOTS** with an info modal, volume by muscle group and by split
  type (30 days), per-exercise progression charts, "ready to progress" suggestions, and **plateau
  detection**.
- **Body** — bodyweight trend, measurement trends, and a training-vs-weight correlation.
- **Nutrition** — calorie-vs-target, protein-vs-goal, and water charts, plus weekly macro averages.
- **Marathon** — weekly mileage, pace trend, long-run progression, week-by-week compliance.
- **Recovery** — recovery-score trend (14 days), energy/soreness trends, sleep hours/quality
  charts, and a muscle-recovery (48/72 h) map.

*vs other apps:* Wilks/DOTS, lift-ratio analysis, plateau detection, muscle-recovery mapping, and
an 80/20 audit are powerlifting/coach-grade analytics rarely bundled into a consumer app — and
they span lifting, running, nutrition, and recovery in one place. **Feature-complete**, and the
app's analytical strength. Charts are lightweight/custom-drawn; future polish could add
date-range pickers and per-chart export (some CSV exports already live in Settings).

### 🗂️ History — your logbook
- **Chronological log** — every saved gym + run session, grouped by month.
- **Session detail** — the full breakdown per entry: exercises, sets/weights/reps, set types,
  cardio, duration, calories, PRs, rating, and notes.
- **Edit/delete** — delete a session; PRs and streaks are **recomputed** so stats stay correct.
- **Gym / run / "both" days** — a lift and a run on the same day are shown distinctly.

*vs other apps:* a solid logbook, with the nice touch that deletions correctly recompute
PRs/streaks (many apps leave stale records). **Feature-complete.** Could add inline editing of a
past session's sets (currently delete/re-log) and search/filter by exercise.

## Top-right tools (available from every screen)

Three icons sit in the top-right toolbar on **every** page — the Strength Profile, the Plate
Calculator, and Settings. They're not in the bottom-nav because you reach for them from anywhere.

### 💪 Strength Profile (top-right)
Your lifting "identity" — a four-tab modal that feeds weight suggestions, 1RM math, plate loading,
and relative-strength scoring across the whole app.
- **📊 Profile tab** — **Relative Strength** (Wilks & DOTS scores, with a "what is this?"
  explainer) at the top; an editable **working weight per lift** for the big-4 *and* every
  accessory; a one-tap **"Estimate all accessory lifts from my Big 4"** that derives accessory
  working weights from your bench/squat/deadlift/OHP via strength ratios; and a built-in **Epley
  1RM** explainer. Save Profile persists it.
- **🎯 Test Max tab** — enter a weight × reps for any lift; it estimates your 1RM (Epley) and shows
  the **working weight it will store** (a true 1-rep test is scaled to ~80% for the working set),
  then **Apply to Profile**. Keeps a per-lift **test history**.
- **🏆 PRs tab** — your personal-best list per exercise.
- **📝 Notes tab** — per-lift notes (injuries, cues, limitations) that resurface as reminders on
  the matching exercise card during a workout.

*vs other apps:* a single source-of-truth strength profile that drives auto-prescription, plate
math, relative-strength scoring, and injury cues app-wide goes well beyond the per-exercise 1RM
most loggers offer. **Feature-complete.** Could add: an RPE/velocity-based max estimate and a graph
of test-max history over time.

### 🏋️ Plate Calculator (top-right)
A standalone quick tool (distinct from the per-set plate hint shown inside a workout): enter a
target weight and bar weight and it renders the exact **plates per side**, with an "off by X — try
Y" message when a load isn't makeable with standard plates, in lb or kg. **Feature-complete.**

### ⚙️ Settings & Profile (top-right)
The full configuration page (`setupModal`):
- **👤 Your Profile** — name, height, goal weight, age, sex (for calorie math), and **weight unit**
  (lb/kg) applied everywhere.
- **🔥 Activity level** with a live **TDEE preview** — drives calorie targets.
- **⚡ Default intensity** and **default gym/run days** — the baseline weekly schedule.
- **Workout preferences (toggles)** — auto-rotate splits, auto-supersets, warm-up sets, auto
  rest-timer, smart notes, run mode, advanced-set suggestions, net-carbs, and adaptive TDEE.
- **🔔 Reminders** — notification permission, a **master on/off switch**, a quiet-hours window,
  week-starts-on, and individual reminder toggles.
- **🎨 Appearance** — light/dark theme. **🔒 Privacy** — optional **app-lock PIN**.
- **🤖 AI Exercise Guides** — paste your Anthropic key (stored on-device only) to enable AI guides.
- **🗄️ Data** — JSON **export/import**, **CSV exports** (weights, nutrition, workouts, runs, health
  markers), a **printable summary report**, **Reset All Data** (double-confirmed), and **NAS
  (Tailscale) backup** to a Synology with credentials kept out of the portable export.

*vs other apps:* the depth here — adaptive TDEE, per-gym scheduling, a reminders master switch,
app-lock, theming, full export/CSV/print, and self-hosted NAS backup — is closer to a power-user
tool than a typical settings screen. **Feature-complete.** Possible add: selective/partial import
(merge rather than replace). The app installs as a home-screen **PWA** and runs **fully offline**
once cached.

### Overall — feature-completeness & how it compares
**The app is functionally feature-complete for daily use.** Every page works, it's been verified
across the full workout-generation matrix, and it's been hardened over multiple review passes. Its
real edge over mainstream apps is **integration and intelligence**: it generates and periodizes
training, models your specific gym, and unifies lifting + running + nutrition + recovery +
analytics with no subscription, ads, or account — every metric from your own data.

Where dedicated apps still lead, by design:
- **No live GPS/HR capture** — running is manual-log + analysis, not tracking (a future GPX import
  is the bridge).
- **Food-database breadth** trails MyFitnessPal/Cronometer (relies on Open Food Facts + your foods).
- **No multi-device sync** — data is per-device `localStorage`; JSON export/import + NAS backup is
  the deliberate, private alternative.

The smaller, optional enhancements noted per page (custom goals, progress photos, drag-and-drop
calendar, per-chart date ranges, inline history edits, GPX import) are the natural next iterations —
none are blockers to daily use.

---

## What's in this repo

| File | Purpose |
|------|---------|
| `pf_workout_tracker.html` | The entire app (~29k lines, single file). |
| `sw.js` | Service worker — offline caching + "new version" update banner. Bump `CACHE_VERSION` on each deploy. |
| `manifest.json` | PWA manifest (name, icons, theme, `start_url`). |
| `icon-192.png`, `icon-512.png` | Home-screen / install icons. |
| `README.md` | This file — overview + per-page features + iPhone/Tailscale setup. |
| `HANDOFF-CLAUDE.md` | Pick-up handoff: current status, how to resume features, how to deploy to a phone. |
| `CLAUDE.md` | Architecture, work/research done, conventions for future changes. |
| `docs/CONTROLS.md` | Per-control reference: every control → the function that powers it. |

The five **app** files (`pf_workout_tracker.html`, `sw.js`, `manifest.json`, and the two icons)
must be served **together from the same folder** for the PWA (offline + install) to work; the
Markdown docs are reference-only.

---

## Run it locally (quick check)

From this folder, on any machine with Python:

```bash
python3 -m http.server 8751
```

Then open `http://localhost:8751/pf_workout_tracker.html`. Your data persists in that browser's
local storage (it's keyed to the origin/URL, so always use the same address).

---

## Use it on your iPhone at the gym, via Tailscale

The goal: reach the app from your phone **anywhere** (cellular or gym Wi-Fi), installed to your
home screen, working **offline** while you train. Tailscale gives your Mac a private, stable
address your phone can hit from anywhere; Tailscale's HTTPS lets the app install as an offline
PWA (service workers require a secure context — HTTPS or localhost).

### One-time setup

1. **Install Tailscale on both devices** and sign in to the same account (tailnet):
   - Mac: <https://tailscale.com/download> (already installed here as `Tailscale.app`).
   - iPhone: Tailscale from the App Store.
2. **Enable MagicDNS + HTTPS** in the Tailscale admin console
   (<https://login.tailscale.com/admin/dns>) → turn on **MagicDNS** and **HTTPS Certificates**.
   Your Mac then has a name like `your-mac.your-tailnet.ts.net`.
3. **Serve the app folder** on the Mac. In this folder:
   ```bash
   python3 -m http.server 8751
   ```
4. **Expose it over Tailscale HTTPS** (in a second terminal). The Tailscale CLI on macOS lives
   inside the app bundle, so either add it to your PATH or call it directly:
   ```bash
   /Applications/Tailscale.app/Contents/MacOS/Tailscale serve --bg 8751
   ```
   This proxies `http://localhost:8751` to `https://your-mac.your-tailnet.ts.net`.
   Check it with `… Tailscale serve status`. (Run `… Tailscale serve --help` if your version's
   flags differ.)

### On the iPhone

5. With Tailscale **connected** on the phone, open Safari and go to:
   ```
   https://your-mac.your-tailnet.ts.net/pf_workout_tracker.html
   ```
6. Tap **Share → Add to Home Screen**. Launch it once while connected so the service worker
   caches everything.
7. Done — tap the icon at the gym. It runs **offline**; you don't need the Mac reachable to log
   a workout. (You only need it reachable to *update* to a newer build or sync nothing else —
   all data is local to the phone.)

### Keeping it available
- The Mac must be awake while you're *installing/updating*. To keep it awake during a session:
  `caffeinate -d`.
- For a hands-off, always-on setup, run the Python server as a `launchd` LaunchAgent (so it
  starts on login and restarts if it dies), or host the same five files on an always-on box
  (e.g. a Synology NAS) and point `tailscale serve` at that instead.
- **Updating the app:** replace the files, bump `CACHE_VERSION` in `sw.js`, reload once online,
  and tap the "new version ready" banner.

---

## AI exercise guides (optional) — and the API key

The app has an optional feature that fetches AI-written exercise guides from the Anthropic API.
**No API key is committed to this repo** (you must never publish a live key — it would be
scraped and abused). Without a key, every other feature works normally and the guide panel just
shows a "set your key" message.

To enable it on **your own device only**, open the app and run this once in the browser console:

```js
localStorage.setItem('pf_anthropicKey', 'sk-ant-...your-key...');
```

…or set `ANTHROPIC_API_KEY` directly in your local copy of the HTML — but **never commit that
change**. Treat the key like a password.

---

## Tech notes

- **Single file, no build.** Open the HTML and it runs. All CSS/JS is inline; the only network
  calls are optional (Google Fonts, Open Food Facts, the AI guide).
- **Storage.** State is a single object persisted to `localStorage` under `pf_v4`. It's
  per-origin, so your data is tied to the exact URL you use — keep it consistent.
- **Backups.** Browsers can evict local storage. Use **Settings → Export** periodically to save
  a JSON backup, and **Import** to restore. (A NAS auto-backup option is built in.)
- **Offline.** The service worker is network-first for the page (so you always get the freshest
  build when online) and cache-first for assets, falling back to cache when offline.

---

## License

Personal project — all rights reserved. Not intended for redistribution.
