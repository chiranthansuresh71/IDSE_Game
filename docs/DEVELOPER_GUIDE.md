# Developer Guide

## Architecture
Classic scripts under one global namespace `DL` (no bundler, works from `file://`). Load order is in `index.html`.

| File | Role |
|---|---|
| `data/datasets.js` | seeded RNG (`DL.rand`), statistics (`DL.stats`), dataset factories (`DL.data`) |
| `storage.js` / `state-manager.js` | LocalStorage + sanitised game state (`DL.state`) |
| `scoring.js`, `achievements.js` | XP rules, ranks, badges |
| `arcade.js` | real-time conveyor mini-game engine: `DL.arcade.conveyor(root, spec, api)` |
| `ui.js`, `components.js`, `charts.js` | DOM helpers; classify/rows/table/checks components; Chart.js adapter + fallback renderer |
| `game-engine.js` | runs challenges, hints, scoring, completion, reports |
| `dashboard.js`, `main.js` | dashboard, settings, victory, welcome/intro |
| `missions/*.js` | content + interaction for each mission; `final.js` = final mystery |

## State & LocalStorage
Key `dataLockdown.save.v1`: `{player, settings, unlocked, missions{id:{completed,best,attempts,perfect}}, progress{id:{seed,idx,done,score,wrong,hints,hinted,hintLevel,shared}}, achievements, insights, final, stats}`. `sanitize()` rebuilds a valid state from any saved JSON. Total XP = sum of best mission scores (+final), so replays can't duplicate XP.

## Mission shape
```js
DL.missions.push({ id, number, icon, title, difficulty, concept, description, closing, report(shared),
  challenges:[{ id, kind:'standard'|'practical', mechanic, title, intro, objective, hints:[], 
     setup(rng, shared) -> data, render(root, data, api), explain, insight:{concept,short,text,real} }] });
```
`api`: `wrong(msg)` (−10), `stepOk(msg)`, `note(kind,msg)`, `correct(msg,{factor,explainExtra})` (awards XP once), `shared` (persisted per run), `rng`. The RNG is seeded from `run.seed + hash(challenge.id)`, so a refresh restores identical data.

## How to add...
* **Mission:** create `js/missions/mission-6.js`, push to `DL.missions`, add the script tag, extend `MISSION_IDS` in `state-manager.js` and the final-unlock logic.
* **Puzzle:** add an object to a mission's `challenges`; compute the answer from `setup()` data, never hard-code.
* **Dataset:** add a factory in `datasets.js` using the passed RNG.
* **UI theme:** edit CSS variables at the top of `css/style.css`.

## Arcade (conveyor) engine
```js
DL.arcade.conveyor(root, { title, brief, tip, goal, lives, fall, minFall,
  bins:[{id,label,desc}], next(rng, i) -> {label, sub?, bin, why} }, api);
```
Items fall via `requestAnimationFrame`; `press(binId)` routes the lowest item (bins or keys 1–9). Correct → combo and speed-up; wrong/missed → integrity −1. Reaching `goal` calls `api.correct(...)`; losing calls `api.wrong(...)` and shows a retry overlay. `root.__arcade = {front, press, state, start}` is used by the test bot. Every item is generated from the seeded `rng`, so the correct bin is computed, not looked up by position.

## Charts
`DL.charts.render(canvas, spec)` accepts a small spec (type, labels, datasets, axis titles, yMin/yMax/yLog, onClick) and uses Chart.js if present, else the built-in renderer.

## Scoring/achievements
Constants in `scoring.js`; rank thresholds are shares of the computed maximum XP. Achievements are checked after each solve/completion in `achievements.js`.
