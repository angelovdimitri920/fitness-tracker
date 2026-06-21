# PF Fitness Tracker

A personal, single-file fitness tracker built as an offline-capable Progressive Web App (PWA).
Everything — workouts, nutrition, running, body metrics, and progress — lives in one HTML file
and is stored locally in your browser. No accounts, no server database, no tracking.

> Built for one user (me), with [Claude Code](https://claude.com/claude-code) doing the
> implementation. It's a vanilla-JS app: no build step, no framework, no dependencies.
>
> **Developing on this?** See [`CLAUDE.md`](CLAUDE.md) for architecture, the work/research done
> so far, current capabilities, and conventions for future changes.

---

## What it does

- **Workout engine** — generates a daily gym session from your chosen *focus* (Lose & Tone /
  Build Muscle / Power / Endurance / General) × *intensity* (Quick / Standard / Full) × the
  day's *split* (Push / Pull / Lower / Upper / Full Body / Glutes / Arms / Core) × your recent
  training. It picks exercises, sets/reps, set types (drop sets, rest-pause, failure), and
  cardio (warm-up / mid-workout / finisher) appropriate to all of those — and never repeats the
  same machine or movement within a day.
- **Set logging** — work/warm-up/drop/failure/rest-pause sets, supersets, plate calculator,
  rest timer, per-exercise swaps, skip, and 1RM estimates.
- **Strength programs** — 5/3/1-style training-max progression.
- **Nutrition** — food/macro logging, water, meal plans, recipes, barcode lookup (Open Food
  Facts), adaptive TDEE, and diet presets.
- **Running / marathon** — run logging, training plans, pace zones, race predictor.
- **Body** — weight, body-fat, measurements, BMI, and trend projections.
- **Progress & goals** — PRs, Wilks/DOTS, strength standards, achievements, streaks, charts.
- **Recovery** — daily check-ins, soreness/muscle-recovery tracking, deload scheduling.
- **PWA** — installs to your home screen and runs **fully offline** once cached (service worker).

---

## What's in this repo

| File | Purpose |
|------|---------|
| `pf_workout_tracker.html` | The entire app (~29k lines, single file). |
| `sw.js` | Service worker — offline caching + "new version" update banner. Bump `CACHE_VERSION` on each deploy. |
| `manifest.json` | PWA manifest (name, icons, theme, `start_url`). |
| `icon-192.png`, `icon-512.png` | Home-screen / install icons. |
| `README.md` | This file. |

All five files must be served **together from the same folder** for the PWA (offline + install)
to work.

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
