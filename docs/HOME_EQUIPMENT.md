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
| GMWD Chest Press (independent converging arms, flat/incline/upright bench, leg rollers) | `GMWD Chest Press Machine` | Pounds: plates on **both** arms (single-arm press: one arm). Loads snap to the bumper combinations below. The empty arm is unmeasured (listing says 8.8 lb). Set it with ⚖️. |
| Bumper plates 2×45, 2×35, 2×25, 2×15, 2×10 | `Bumper Plates` | Per arm: 10, 15, 25, 35, 40, 45, 50, 55, 60, 70, 75, 80, 85, 90, 95, 105, 115, 120, 130 lb (20, 30, 65, 100, 110, 125 are impossible) |
| XMARK decline ab bench (XM-4416.1, 12 angles) | `Decline Bench` | Bodyweight, or a held plate / med ball |
| ProsourceFit tri-fold mat, Yes4All ab mat | `Yoga Mat`, `Ab Mat` | Bodyweight |
| Hotwave push-up board, push-up bars | `Push-Up Board`, `Push-Up Handles` | Bodyweight |
| Ab roller with knee pad | `Ab Roller / Ab Wheel` | Bodyweight |
| Trideer exercise ball | `Stability Ball` | Bodyweight |
| Amazon Basics 10 lb medicine ball | `Medicine Ball` | Fixed 10 lb |
| CAP 20 lb cement kettlebell | `Kettlebells` | Fixed 20 lb (progress by reps / tempo) |
| APEXUP weighted vest | `Weighted Vest` | Pounds of vest load. The default range is 4–32 lb in 2 lb steps; the purchased range is unconfirmed. |
| APEXUP ankle weights (1 lb modules) | `Ankle Weights` | 1–5 lb on one ankle |
| DMoose wrist roller | `Wrist Roller` | Pounds of the plate hung on it (10–45 bumpers) |
| Doorframe pull-up bar | `Pull-Up Bar (Doorframe)` | Strict bar work only. Muscle-ups, skin-the-cats and kipping variations are excluded. |
| EAST MOUNT hydraulic twister, Oscillating Slim spring twister | `Twister Arm Trainer` | **Level** (dial / setting). Pound ratings are not trustworthy. |
| Python Power Twister | `Power Twister Bar` | **Level** (hand position) |
| GoFitness push-down bar | `Push Down Bar` | **Level** (springs attached) |
| Ueasy 5-tube chest expander | `Chest Expander` | **Level** (tubes attached) |
| Innstar resistance bands | `Resistance Bands` | Bodyweight / band |
| FitBeast grip kit | `Hand Grip Kit` | **Level** (gripper dial) |
| Thigh / pelvic-floor trainer | `Thigh Trainer` | **Level** / reps |
| UREVO 2-in-1 treadmill (no incline on the common model) | `Treadmill` | Warm-up and brisk-walk finisher |

Level-based exercises (`isLevelExercise`) never feed volume, 1RM or records.

## Home rotation

Four home splits rotate daily: `hpush`, `hpull`, `hlegs` and `hcore`. `homeSplitFor(k)` picks
the next one that least overlaps that day's gym session and the last 48 h. The Home banner
lets you pick a different one for the day (`S.homeConfig[k]`). Sessions default to the
Quick band (30–45 min). At home the time model drops travel and walking, so one more exercise
fits.

## Open questions (check on the equipment)

- GMWD: horn size (bumpers need 2" Olympic sleeves), how many bumpers fit per horn, empty-arm resistance.
- Weighted vest: which range (4–10, 12–18 or 20–32 lb) and how much each sand pack weighs.
- UREVO model: incline and top speed.
- Thigh trainer: brand, and whether its resistance adjusts.
