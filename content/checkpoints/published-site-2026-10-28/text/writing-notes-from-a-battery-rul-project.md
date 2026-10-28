# Neerav Chaudhary

Source: https://neerav-git.github.io/writing/notes-from-a-battery-rul-project
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

METHODS NOTE
Evaluating a battery remaining-useful-life model

A practical evaluation sequence for temporal splits, predictor timing, leakage checks, baselines, and maintenance-facing error measures.

PUBLICATION DETAILS

January 15, 2026

Methods note

REFERENCES AND FILES
Refract case study
IMPLEMENTED STATS WORKFLOW AND RUN-LEVEL RECORDS.
Refract repository
PROFILING, AUDIT, BASELINE, AND REGRESSION IMPLEMENTATION.
Battery degradation modeling survey
TECHNICAL SURVEY OF LITHIUM-ION DEGRADATION MODELING.
ON THIS PAGE
MODEL EVALUATION
Predict remaining life using information available at prediction time

A battery model needs chronological testing, deployable predictors, leakage screening, a simple baseline, and error measures tied to maintenance decisions.

Refract's Stats workflow implements this sequence for its primary battery remaining-useful-life demonstration.

EVALUATION SEQUENCE
Five checks precede model selection
PROFILE
Profile each column

Measure missingness, ranges, distributions, and relationships before assigning predictors or targets.

AUDIT
Audit predictor timing

Identify when each signal becomes available and remove variables that contain future-cycle or target-derived information.

SPLIT
Respect chronology

Train on earlier observations and evaluate on later observations that resemble the deployment decision.

BASELINE
Establish a mean baseline

Measure how much error a constant prediction produces before adding model complexity.

COMPARE
Compare models

Evaluate Linear Regression and Random Forest with the same split, predictors, and MAE, RMSE, and R² calculations.

LEAKAGE AUDIT
Every predictor needs a deployment-time explanation
AVAILABILITY
When is the value known?

A maintenance model can use signals observed before the prediction timestamp.

DERIVATION
How was it calculated?

Target-derived summaries and transformations using future cycles leak answer information into training.

SEQUENCE
Which records precede the test case?

Random row splits can place later-cycle information in the training set for an earlier prediction.

PHYSICAL MEANING
Why should the signal matter?

Capacity, resistance, current, time, and cycle variables need a coherent link to degradation behavior.

METRICS
MAE, RMSE, and R² answer different questions

The model comparison stores all three measures for each run.

MAE gives the average absolute prediction error in the target unit. RMSE gives larger misses more weight, which matters when a late maintenance prediction carries higher cost. R² describes variance explained relative to a constant baseline.

The score table must retain the split, target, predictors, and model settings. A metric without those fields cannot be reproduced or interpreted operationally.

DECISION RULE
Select the model only after the audit passes

A lower error is actionable when the split matches deployment, predictors exist at prediction time, and the comparison beats a declared baseline.

Refract records the audit findings with the run so a result can be rejected for leakage or predictor timing even when its headline score is strong. Production maintenance performance still requires prospective data from the target equipment and operating conditions.
