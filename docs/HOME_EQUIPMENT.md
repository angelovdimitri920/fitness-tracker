# Home exercise room — equipment and how the app uses it

Researched October 2026 from manufacturer, retailer and review listings. Amazon and the GMWD
site could not be opened directly from the build environment, so figures come from search
readings of those pages. Where listings disagreed, the lower or manufacturer figure is used.
The full write-up (with sources) lives in the "Home Gym Equipment — Research & Exercise
Guide" doc.

The home workout is a **separate daily session** (Today → 🏠 Home). It is built by the same
engine as the gym workout against the *Home Exercise Room* gym profile (`getHomeProfile()`),
saved to history as `type:'home'`, and never replaces the gym workout. It counts toward the
streak, calories and muscle recovery. Progression compares home sessions only with home
sessions.

## Equipment → app name → how it is logged

| Item | Equipment name in the app | Logged as |
| --- | --- | --- |
| GMWD Chest Press (independent converging arms, flat/incline/upright bench, leg rollers) | `GMWD Chest Press Machine` | Pounds, as a **true total**: both arms (~10 lb each, user-measured → base 20 lb; single-arm press 10 lb) + the plates on them. Loads snap to `base + 2 × per-arm bumper combo`. A ⚖️ correction overrides the base. |
| Bumper plates 2×45, 2×35, 2×25, 2×15, 2×10 | `Bumper Plates` | Per arm: 10, 15, 25, 35, 40, 45, 50, 55, 60, 70, 75, 80, 85, 90, 95, 105, 115, 120, 130 lb (20, 30, 65, 100, 110, 125 are impossible) |
| XMARK decline ab bench (XM-4416.1, 12 angles) | `Decline Bench` | Bodyweight, or a held plate / med ball |
| ProsourceFit tri-fold mat, Yes4All ab mat | `Yoga Mat`, `Ab Mat` | Bodyweight |
| HOTWAVE push-up board, push-up bars | `Push-Up Board`, `Push-Up Handles` | Bodyweight. Chest & Core rotates shoulder-width, comfortably wide and close grips. Use the chest markings on your board. Each grip keeps its own history. |
| Ab roller with knee pad | `Ab Roller / Ab Wheel` | Bodyweight |
| Trideer exercise ball | `Stability Ball` | Bodyweight |
| Amazon Basics 10 lb medicine ball | `Medicine Ball` | Fixed 10 lb |
| CAP 20 lb cement kettlebell | `Kettlebells` | Fixed 20 lb (progress by reps / tempo) |
| APEXUP weighted vest (20–32 lb model) | `Weighted Vest` | Pounds of vest load: 20–32 lb in 2 lb steps (20 lb shell + six 2 lb packs); starts at 20 |
| APEXUP ankle weights (1 lb modules) | `Ankle Weights` | 1–5 lb on one ankle |
| DMoose wrist roller | `Wrist Roller` | Pounds of the plate hung on it (10–45 bumpers) |
| Optional doorframe pull-up bar | `Pull-Up Bar (Doorframe)` | Strict bar work only. Muscle-ups, skin-the-cats and kipping variations are excluded. |
| Ultimate Arm Trainer / hydraulic or spring twister | `Twister Arm Trainer` | **Level** (dial or setting) |
| Python Power Twister | `Power Twister Bar` | **Level** (hand position) |
| GoFitness push-down bar | `Push Down Bar` | **Level** (springs attached) |
| Ueasy 5-tube chest expander | `Chest Expander` | **Level** (tubes attached) |
| Innstar resistance bands | `Resistance Bands` | Bodyweight / band |
| FitBeast grip kit | `Hand Grip Kit` | **Level** (gripper dial) |
| Thigh / pelvic-floor trainer | `Thigh Trainer` | **Level** / reps |
| UREVO 2-in-1 treadmill (confirmed: **no incline**) | `Treadmill` | Warm-up and finisher are a flat "Treadmill (Brisk Walk)". The home profile has `noIncline`, so incline options are never picked or offered. Warm-up and finisher may share the one treadmill. |

Level-based exercises carry the last logged level into the next session. Complete all work-set
targets at the same level to earn a rep increase. Level stays a device setting in the log.

### Chest & Core

Quick prioritizes the main press, the board when available, direct abs and upper-back work.
Standard rotates the Ultimate Arm Trainer, Python Power Twister and push-down bar as a chest
accessory. Full has room for more of the available tools and lower-body work. The adjustable chest
expander trains the upper back alongside pressing. Start around 15–18 reps per tool set and build
according to logged effort. Use the board legend and equipment instructions for setup.

Push-ups can build chest muscle. Handle width changes how the chest and triceps contribute,
and flat and incline pressing provide complementary angles. The research supports gradual
progression and consistent weekly training. Arnold Schwarzenegger describes flat and incline
pressing and flyes, while Chris Hemsworth's team uses structured progressive strength sessions
at home and in the gym. [Push-up training trial](https://pubmed.ncbi.nlm.nih.gov/29541130/),
[Grip-width study](https://pubmed.ncbi.nlm.nih.gov/16095413/),
[Arnold's training demonstration](https://www.youtube.com/watch?v=o9zCgPtsups),
[Centr training team](https://centr.com/blogs/thewarmup/behind-the-scenes-on-centr-power),
[Core Prodigy Python instructions](https://coreprodigy.com/pages/video).

Brisk walking and other moderate aerobic activity support overall fat loss. Resistance training
helps retain muscle as weight comes down. Chest and core training builds local muscle, and the
localized-fat-loss evidence does not justify prescribing sets to remove fat from a specific area.
The Gym focus offers one controlled drop set on a suitable accessory in Standard or Full.
[Localized-fat-loss review](https://doi.org/10.5114/hm.2022.110373),
[Aerobic exercise review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11672165/),
[Resistance training during dietary weight loss](https://pubmed.ncbi.nlm.nih.gov/40909191/),
[Drop-set review](https://pubmed.ncbi.nlm.nih.gov/41920484/).

Pull-ups and dips appear in Home workouts only when the appropriate equipment is enabled in the Home profile.

## Home rotation

Four home splits rotate daily: `hpush`, `hpull`, `hlegs` and `hcore`. `homeSplitFor(k)` picks
the next one that least overlaps that day's gym session and the last 48 h. The Home banner
lets you pick a different one for the day (`S.homeConfig[k]`). Once the day's home workout exists, the auto pick is pinned (`S.homeConfig[k] = {split, auto:true}`), so a later gym-side change never swaps the home workout under logged sets. Sessions default to the
Quick band (30–45 min). At home the time model drops travel and walking, so one more exercise
fits.

## Confirmed by the user (Oct 11)

- Home session length: 30–45 min. It is an extra session that counts toward the streak, calories and recovery.
- Vest 20–32 lb; GMWD arms ~10 lb each; treadmill has no incline.

## Still open

- GMWD: horn size (bumpers need 2" Olympic sleeves) and how many bumpers fit per horn.
- Thigh trainer: brand, and whether its resistance adjusts.
