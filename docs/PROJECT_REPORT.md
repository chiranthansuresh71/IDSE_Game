# DATA LOCKDOWN — Project Report (Introduction to Data Science)

## 1. Abstract
DATA LOCKDOWN is a browser-based educational game in which learners restore a fictional city's corrupted data systems. Five missions and a final mystery, built from real-time conveyor, physics-toy, slider and sandbox-lab levels rather than question lists, teach data types, cleaning, exploratory statistics, visualization and basic supervised learning through generated datasets and computed feedback.

## 2. Introduction
Learners often read definitions of data science concepts without applying them. A game lets them act on data and observe consequences.

## 3. Problem Statement
How can core introductory concepts be learned by discovery rather than by reading or answering quiz questions?

## 4. Objectives
Teach 17+ concepts accurately; make player decisions change outcomes; use real computation on generated data; require no installation or backend; provide documentation and evidence of learning.

## 5. Existing Approach and Limitations
Typical e-learning uses slides and multiple-choice quizzes with fixed answers, which reward recall and cannot show consequences of decisions.

## 6. Proposed Solution
A seeded-random puzzle game where every answer is computed from data, with hints, scoring, achievements and explanations.

## 7. System Requirements
Modern browser; optional Python or VS Code Live Server.

## 8. Technology Stack
HTML5, CSS3, vanilla JavaScript (ES6+), Chart.js (with built-in fallback), LocalStorage, Web Audio API (synthesised sounds).

## 9. Game Architecture
Modular scripts under a `DL` namespace: data generators and statistics, state/storage, engine, components, missions (content separated from rendering). See DEVELOPER_GUIDE.md.

## 10. Game Design and Gameplay
Welcome → dashboard → five missions → final mystery → victory. Mechanics and scoring are in GAME_DESIGN_DOCUMENT.md.

## 11. Data Science Concepts Covered
See DATA_SCIENCE_CONCEPTS.md.

## 12. Implementation Details
Seeded RNG (mulberry32) regenerates identical data after refresh; correctness is verified by computing statistics (mean, median, modes, IQR fences, Pearson r, regression slope, best threshold rule, 1-NN) at run time. XP = sum of best mission scores prevents farming. LocalStorage is sanitised on load.

## 13. Educational Value
Discovery moments: zero-fill vs mean imputation; mean vs median under an outlier; truncated axes; training vs test accuracy of a memorising model; correlation vs confounding.

## 14. Testing and Validation
Automated Chrome playthroughs and screenshot checks (TESTING_REPORT.md). Peer playtests: *to be added by the authors in PLAYTEST_FEEDBACK.md*.

## 15. Results and Observations
All missions completed end-to-end by the test bot in repeated runs with no script errors. No learner-outcome data has been collected yet; do not claim any until playtests are done.

## 16. Limitations
Simplified models (single-feature rule, 1-NN); small datasets; accuracy only; no multi-user features; Chart.js path untested in sandbox; no formal accessibility audit.

## 17. Future Enhancements
Confusion matrix/precision/recall, clustering mission, sampling and bias-variance missions, teacher dashboard, localisation.

## 18. Conclusion
The game turns abstract concepts into decisions with visible consequences and provides a replayable, documented learning tool.

## 19. References
* Chart.js documentation, https://www.chartjs.org
* Wickham, H. (2014). Tidy Data. Journal of Statistical Software, 59(10).
* Tukey, J. W. (1977). Exploratory Data Analysis. Addison-Wesley.
* Cairo, A. (2016). The Truthful Art. New Riders.
