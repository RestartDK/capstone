# Methodology Checklist

This is a broad checklist about what to consider when working on your methodology chapter. Your methodology must be coherent with your Literature Review and make your later implementation straightforward to understand, reproduce, and evaluate. What goes in this chapter depends greatly on the TFG type, so you are not expected to have every one of these sub-sections as part of your methodology:

---

## 1) Data Collection

**If you collect data firsthand:**

- Apply proper sampling to minimize bias; state the frame, inclusion/exclusion criteria, and recruitment approach.
- Justify variable selection: why each variable is relevant to the research question and expected to influence the outcome.
- Document any consent, privacy, and data protection procedures (even for non-sensitive data).

**If you use external data:**

- Identify credible sources (repositories, institutional platforms, open databases) and cite/attribute correctly; include each dataset's license.
- Explain provenance and relevance of each source; if you merge multiple datasets, describe harmonization (schema alignment, label standardization, units).

**Required outcomes:** A table or paragraph per dataset stating scope, license, time span, population, key variables, known limitations, and the precise reason it fits your study.

---

## 2) Feature Engineering

Explain what data you transformed and why, grounded in your literature review:

- Preprocessing choices (normalization/scaling), outlier handling, missing value strategy, categorical encoding, temporal windows/aggregations, and any domain-specific derived features.
- If you combine modalities (e.g., images + metadata), justify the feature fusion design and show expected contribution to the target.
- If the dataset is imbalanced, describe mitigation (reweighting, resampling, augmentation) and why it suits your data.

**Required outcomes:** A clear data-wrangling pipeline diagram and a short justification for each decision (one line each is fine).

---

## 3) Analysis (Models & Metrics)

Select methods that fit your problem type and data (e.g., regression, classification, clustering, hypothesis testing, dimensionality reduction, bootstrapping, global optimization).

- Define primary and secondary metrics, and explain how they reflect the real-world goal (e.g., F1 vs. Accuracy for imbalance; calibration error; statistical power for tests…).
- Report per-class metrics where applicable and include confusion matrices and ROC-AUC (or PR-AUC) to show tradeoffs.
- Plan an error analysis (which cases fail and why).

**Baselines & Ablations:**

- Start with simple baselines, then incrementally test more advanced methods.
- Run ablation studies (e.g., with vs. without certain features, preprocessing, or pipeline stages) to demonstrate necessity of components and quantify lift.
- Discuss computational tradeoffs (training time, memory, latency) when comparing alternatives.

---

## 4) Architecture

If your project involves a system or model architecture to be implemented later, your Methodology must include:

- **a) High-level diagram & data flow:** components, inputs/outputs, how data moves.
- **b) Justification of design choices** linked to literature and problem constraints (why this backbone, why attention, why early fusion vs. late fusion, etc.).
- **c) Tools & platforms:** frameworks and library versions; why these tools, not how to use them.
- **d) Expected performance/behavior** and how it supports your chosen metrics and evaluation plan.

---

## 5) Methodology Validation

- **a) Theoretical validation:** cite prior work supporting your approach and assumptions; show your method fits the data and research question.
- **b) Empirical validation:** define your data splits (train/validation/test), leakage prevention, cross-validation if appropriate, early stopping, model checkpointing, and hyperparameter strategy (grid/random/Bayes). State stopping criteria and selection criteria (which metric picks the final model).
- **c) Practical validation:** explain how choices reflect real-world constraints (latency, compute budget, feasibility, deployment setting). If using a multi-stage pipeline, justify sequential filtering and show its effect on efficiency vs. recall.
- **d) Robustness & fairness checks:** sensitivity to parameter changes, stability across data slices; address class imbalance, annotation bias, and subgroup performance.
- **e) External validation:** test on a different dataset/domain to demonstrate generalization. If not possible, state why.

**If you run a user study:** include sampling method, instrument/metrics, basic statistics (e.g., t-tests), and limitations (Hawthorne effect, self-selection).

---

## 6) Data Ethics, Security & Integrity

- State how you handle consent, privacy, security, and data retention (especially for sensitive/health or platform data).
- Disclose any synthetic data usage (why needed, how generated), and set clear boundaries on what conclusions it supports.
- Include an Ethics/Fairness note: known dataset biases (e.g., demographic skew), risks (false positives/negatives), and mitigations.

---

## 7) Reproducibility & Traceability

- Fix random seeds, export config files, and record library/framework versions.
- Keep code in version control; provide a README to reproduce training/evaluation/implementation.
- Track data lineage (a "dataset source" column is recommended when merging sources).
- Save best model checkpoints and link results to the exact configuration that produced them.

---

## Final Reminders

- Keep the chapter APA-compliant and ensure your methodology flows from the Literature Review.
- Every decision (data, features, models, metrics, and architecture) must be justified and traceable.
- Explain how your work fits your research question.
- Prioritize clarity and reproducibility. This will make your Results, Discussion, and Conclusions significantly stronger.
