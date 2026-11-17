# Testing Report
Only tests that were actually run are listed.

## Automated playthrough (tests/play.js + tests/solvers.js, Playwright + headless Google Chrome, 1280×900)
A bot recomputes each challenge's data from the stored seed and plays the **real UI** (clicks, typing, slider input, sorting-conveyor routing through the game's own `press()` hook, chart clicks).
* Full journey Welcome → name → intro → Missions 1–5 → Final → victory: **passed in 3 consecutive final runs on the redesigned game-style levels** (fresh random data each time; 28 levels each; 0 JavaScript errors). An earlier run found one unwinnable missing-values seed (see bugs below).
* Scoring: hint −20 verified; arcade integrity loss does not change XP (only a failed level costs −10); score floor 0; no-hint bonus; completion bonus once; replaying Mission 1 raised the total only to the maximum, **4650**.
* Persistence: reload mid-mission kept hint count and hint level; reload after finishing kept XP; corrupted/hostile LocalStorage JSON handled; reset clears XP.
* Unlocking and all 7 achievements triggered.
* **Seed sweeps (computed, not played):** 3,000 seeds for the missing-values lab (mean fill, median fill and dropping always pass; zero-fill never passes) and 300 seeds each for the point-cloud matching level and the feature lab (an honest solution always reaches the target).

## Responsive check
Screenshots of every challenge at 390 px (mobile emulation) and key levels at 1280 px were taken and reviewed. A script checks horizontal overflow; the one overflow found (six evidence bins on a phone) was fixed (bins wrap to 3 columns) and rechecked: none remain.

## Not done / limitations
* Chart.js CDN was blocked in the test sandbox, so charts were tested with the **built-in fallback renderer**; please open the game once online and click through Missions 3–5.
* Not tested in Firefox/Safari or on physical phones; no real screen-reader audit.
* The bot uses the game's internal hooks for the real-time conveyor, so real-time reaction difficulty for humans has not been measured (a Relaxed no-timer mode exists).
* **No peer playtesting has been done** — see PLAYTEST_FEEDBACK.md.

## Bugs found and fixed during testing
* Missing-values lab: the auditor's tolerance made the level unwinnable on rare seeds (about 0.6% with an absolute tolerance, found while re-running the bot). Fixed: the tolerance is relative to how wrong zero-fill is; verified over 3,000 seeds.
* Balance beam graphic clipped at large tilt → tilt reduced and viewBox adjusted.
* Evidence bins overflowed on phones; audit-claim buttons had default browser styling → CSS fixed.
* Earlier: table checkbox size; rule tuner started near the optimum; chart hit-testing hook for tests.
