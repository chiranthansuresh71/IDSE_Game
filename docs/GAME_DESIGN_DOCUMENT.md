# Game Design Document
**Concept:** detective puzzle game; the player is a junior data scientist restoring Nova City's corrupted systems.
**Story:** a "breach" corrupted records, statistics, charts and predictions. Twist: no hacker — a chain of poor data practices.
**Audience:** undergraduates new to data science. **Objective:** learn by performing data tasks (Part B rubric: discover the concept by playing).

**Learning loop:** intro → objective → act on generated data → feedback (no answer reveal on a miss) → optional hint (cost) → explanation + Learning Insight → next. Decisions have visible consequences (e.g. zero-fill changes the average; threshold changes accuracy; memoriser fails on test data).

**Structure:** Welcome → Dashboard → 5 missions (4–5 challenges each) → Final mystery (3 stages) → Victory.
**Mechanics (game-first):** real-time sorting conveyor (`js/arcade.js`: lives = System Integrity, combo, speed-up, relaxed no-timer mode, keys 1–9); physics toy (balance beam = mean); slider puzzles (median split, r-dial cloud matching, axis/k sliders); sandbox labs with live feedback (chart forge, missing-values lab, feature lab, overfit lab); simulation (pipeline run log); spot-the-flaw audit; plus spreadsheet cleaning, chart clicking/building and rule tuning.
**Design principle:** the learner acts first and the concept is revealed by the consequence (beam tips, auditor rejects, accuracy curve drops). Reading the explanation comes after play.
**Rules/scoring:** puzzle +100, practical +150, no-hint +25, completion +100, wrong −10, hint −20, floor 0. Total XP = sum of best mission scores. Max XP 4650 (computed from the missions).
**Ranks (share of max):** Trainee 0 · Explorer 12% (560) · Analyst 30% (1400) · Specialist 55% (2560) · Master Detective 80% (3720).
**Achievements:** First Clue, Clean Data, Pattern Master, Visualization Expert, Prediction Pro, Perfect Investigation, Master Detective.
**Progression:** missions unlock sequentially; final unlocks after M5; all replayable.
**UI/visual identity:** dark cyber-investigation terminal; palette #070B16/#101A2B with cyan/blue/purple accents; Space Grotesk + DM Mono; scanline, grid and binary particles; reduced-motion respected.
**Ending:** "NOVA CITY RESTORED — YOU CRACKED THE DATA MYSTERY" with score, accuracy, time, rank, badges, concepts.
