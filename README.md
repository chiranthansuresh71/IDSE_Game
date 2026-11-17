# DATA LOCKDOWN — Crack the Data Mystery

> *Every dataset hides a secret. Can you find the truth?*

An educational detective puzzle game that teaches introductory data science **by doing it**. Nova City's database has been corrupted; as a junior data scientist you clean data, compute statistics, read charts and build a prediction rule to find out what really happened.

Built with HTML5, CSS3, vanilla JavaScript and Chart.js. No server, account or build step.

## How to run
Open `index.html` in Chrome/Edge/Firefox, **or** serve the folder:
```bash
python3 -m http.server 8000     # then open http://localhost:8000
```
Chart.js loads from a CDN; if you are offline a built-in canvas renderer takes over, so the game still works. Details: [docs/INSTALLATION_GUIDE.md](docs/INSTALLATION_GUIDE.md).

## Why it is a game, not a quiz
* **Data is generated, not hard-coded.** Every run uses a random seed; datasets are produced by code and every answer is *computed* from that data (means, medians, correlations, accuracy, the best decision rule...). Replays show different data.
* **Decisions change outcomes.** Fill missing marks with 0 and watch the class average collapse; move a threshold and watch accuracy change; memorise training data and watch test accuracy fall.
* **It is played, not answered.** Levels are game mechanics, not question lists: a real-time **sorting conveyor** with lives and combos (data types, discrete/continuous, structured/unstructured, classification vs regression, tracing evidence to causes), a **balance-beam physics toy** that makes the mean tangible, a **split-the-crowd** median slider, a **tally race** for the mode, **point-cloud matching** with an r-dial, a **missing-values lab with an auditor**, a **chart forge** where the council reacts to your chart, **Lie-Factor repair** of misleading charts, a live **feature lab** (data leakage trap) and an **overfit lab** with training/test curves, a **pipeline simulator** and a **hidden-flaw audit**.
* **Failing is part of play:** wrong routings cost System Integrity; labs let you experiment freely and show consequences before you commit.

## Missions
| # | Mission | Concepts |
|---|---------|----------|
| 1 | The Missing Records | data types, discrete/continuous, structured/unstructured, schema (3 conveyor levels + import-test lab) |
| 2 | The Corrupted Database | duplicates, missing values, inconsistent data, full cleaning task |
| 3 | The Hidden Pattern | mean, median, mode, outliers, correlation vs causation |
| 4 | The Visualization Vault | choosing, reading, auditing and building charts |
| 5 | The Prediction Protocol | features/target, classification vs regression, decision rule, train/test, accuracy |
| Final | The Final Mystery | evidence → cause, workflow order, report audit |

## Features
Dashboard with rank/XP/progress, mission locking, hints (−20 XP), +100/+150/+25 scoring, 7 achievements, Learning Insight cards, case-file knowledge review, LocalStorage saves (corruption-safe), reset with confirmation, optional synthesised sound (off by default), reduced-motion support, keyboard/screen-reader support, responsive layout.

## Docs
[Gameplay guide](docs/GAMEPLAY_GUIDE.md) · [Game design](docs/GAME_DESIGN_DOCUMENT.md) · [Developer guide](docs/DEVELOPER_GUIDE.md) · [Concepts](docs/DATA_SCIENCE_CONCEPTS.md) · [Installation](docs/INSTALLATION_GUIDE.md) · [Testing report](docs/TESTING_REPORT.md) · [Project report](docs/PROJECT_REPORT.md) · [Playtest log](docs/PLAYTEST_FEEDBACK.md) · [Contributing](docs/CONTRIBUTING.md)

## Folder structure
```
index.html  css/  js/ (engine, arcade, state, storage, scoring, achievements, ui, charts, components, dashboard, main)
js/missions/ mission-1..5.js final.js   js/data/datasets.js   assets/   docs/   tests/   screenshots/
```
## Credits & licence
MIT licence. Fonts: Space Grotesk, DM Mono (Google Fonts, OFL). Charts: Chart.js (MIT). Sounds are synthesised in the browser (original). Icons are inline SVG.
