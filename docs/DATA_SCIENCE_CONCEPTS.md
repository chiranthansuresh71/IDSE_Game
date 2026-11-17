# Data Science Concepts Taught

Each entry: definition · example · formula · where in the game · takeaway · real-world use.

| Concept | Definition & example | Formula | In game | Takeaway | Real world |
|---|---|---|---|---|---|
| Data types | Numerical, categorical, boolean, text. Age=21, City=Chennai | – | M1 C1 (conveyor), C4 (import lab) | Type decides valid operations | Patient records |
| Discrete vs continuous | Counted vs measured. Vehicles vs temperature | – | M1 C2 (conveyor) | Counts ≠ measurements | Traffic data |
| Structured vs unstructured | Table schema vs images/audio/text | – | M1 C3 (conveyor) | Unstructured needs processing first | Customer emails |
| Missing values | Blank fields; collect, drop or impute — never assume 0 | – | M2 C2 (missing-values lab + auditor), C4 | Zero-fill distorts averages | Sensor gaps |
| Duplicate data | Same record twice (same ID) | – | M2 C1, C4 | Check the key before deleting | Patient de-duplication |
| Data cleaning/validation | Detect and fix wrong, incomplete, duplicate, inconsistent data | – | M2 | Verify against a source | Hospital data quality |
| Mean/median/mode | Average, middle of sorted data, most frequent | mean = Σx/n | M3 C1 (balance beam), C2 (split the crowd), C3 (tally race) | Median is robust; mode works for categories | Income reporting |
| Outliers | Values far from the rest; IQR rule Q1−1.5·IQR, Q3+1.5·IQR | – | M3 C4 | Investigate before deleting | Fraud detection |
| Correlation | Direction/strength of linear relation, r∈[−1,1] | Pearson r | M3 C5 (match the cloud + confounder lab) | Correlation ≠ causation | Medical studies |
| EDA | Summarising/inspecting data before modelling | – | M3 | Explore first | All analytics |
| Visualization & chart choice | Line=time, bar=categories, histogram=distribution, scatter=relationship, pie=parts of whole | – | M4 C1 (chart forge), C4 | Match chart to question | Dashboards |
| Histograms / scatter plots | Binned frequencies / paired points | – | M4 | See shape and relation | Exam analysis |
| Misleading charts | Truncated axes, wrong label order, undeclared log scale | – | M4 C3 (Lie-Factor repair) | Read the axes | Report auditing |
| Features & target | Inputs vs the outcome to predict | – | M5 C1 (feature lab, data leakage) | Don't use IDs | Loan default |
| Classification vs regression | Predict a label vs a number | – | M5 C2 (conveyor) | Target type decides | Disease / stay length |
| Decision rule (simple model) | IF feature ≥ threshold THEN Pass | – | M5 C3 | Models are learned from data | Forecasting |
| Training vs testing | Learn on one part, evaluate on unseen part; overfitting | – | M5 C4 (overfit lab) | Trust test accuracy | Spam filters |
| Prediction accuracy | Share of correct predictions | Correct/Total×100 | M5 C5 | Also inspect error types | Diagnostics |
