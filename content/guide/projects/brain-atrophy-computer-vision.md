---
slug: brain-atrophy-computer-vision
approvedTargets:
  - project.brain-atrophy-computer-vision
  - project.brain-atrophy-computer-vision.methodology
  - project.brain-atrophy-computer-vision.2-make-cerebral-atrophy
  - project.brain-atrophy-computer-vision.4-seven-stages-connect
  - project.brain-atrophy-computer-vision.5-three-visible-image
  - project.brain-atrophy-computer-vision.7-cohort-averages-define
  - project.brain-atrophy-computer-vision.8-anatomical-focus-improved
  - project.brain-atrophy-computer-vision.11-the-work-provides
  - project.brain-atrophy-computer-vision.12-i-built-the
  - project.brain-atrophy-computer-vision.13-the-method-and
  - project.brain-atrophy-computer-vision.links
approvedLinks:
  - link.brain-atrophy-computer-vision.ieee-doi
  - link.brain-atrophy-computer-vision.publication-record
  - link.brain-atrophy-computer-vision.separate-mri-classification
metricIds:
  - atrophy-crop-66-to-71
---

# Brain Atrophy Analysis in Dementia

## In plain terms

This peer-reviewed IEEE computer vision study gives researchers a simple, transparent way to measure brain tissue loss in dementia from MRI scans. Neerav built the Python and OpenCV computer vision pipeline that separates each scan into dark open space and visible brain tissue, turns those areas into one score, and compares it against reference ranges drawn from 2,198 ADNI scans of people with and without dementia. Anyone can recompute the score from the scan, so it is easy to check, teach, and reproduce.

The study also showed where to look: focusing the analysis on the hippocampus, a region strongly affected in dementia, raised classification accuracy from 66 to 71 percent. Neerav co-authored the paper with Sourabh Singh Verma, and the measurement pipeline and analysis are his work.

## Outcome

This peer-reviewed computer-vision study converts T1-weighted MRI images into an interpretable tissue-loss ratio. The method measures dark, white, and grey intensity regions, derives cohort reference bounds, classifies an image relative to those bounds, and tests whether focusing the crop on the hippocampal region improves the reported classification result.

The outcome is a five-page IEEE conference paper, a repeatable Python and OpenCV measurement pipeline, a transparent equation, cohort-derived decision regions, a worked example, a longitudinal atrophy-rate formulation, and a controlled crop comparison. It addresses the time and reproducibility burden of manual tracing by making every score traceable to visible pixel counts.

## Neerav's contribution

Neerav co-authored the paper and built the repeatable Python and OpenCV pipeline that transforms MRI intensity regions into quantitative tissue-loss measurements, reference bounds, crop comparisons, and an atrophy-rate method. His individual contribution joins implementation and research design: mask construction, density calculation, the measurement equation, cohort aggregation, region interpretation, and controlled crop evaluation.

The paper is co-authored with Sourabh Singh Verma; the measurement pipeline and the analysis built on it are Neerav's individual work.

## User journey

A researcher supplies a T1-weighted MRI image and applies the defined crop. The pipeline converts the image into masks for dark, white, and grey intensity regions, counts the relevant pixels, and computes their densities. It then calculates the dementia estimation metric and compares it with lower and upper reference bounds derived from cohort means.

Every output is explainable: a reviewer can inspect the crop, the three masks, the pixel densities, the equation, the resulting score, and the region in which it falls. The paper also shows how repeated scores could be compared over time through an atrophy-rate equation. A second crop centered on the hippocampal area is evaluated against the default crop to test whether anatomical focus improves the reported classification result.

## Architecture and tools

Python coordinates the analysis and OpenCV performs image loading, thresholding, mask construction, cropping, pixel counting, and visualization. The data comes from ADNI T1-weighted MRI images with Clinical Dementia Rating labels.

The central measurement, called dem, is b divided by the sum of w and g. Here, b is dark-region density, used as a proxy for cerebrospinal-fluid and open-space patterns; w and g are white- and grey-region densities, used to represent visible tissue. Because the equation is simple and the inputs are visible, a reviewer can recompute a score and understand how tissue and open-space changes affect it.

Group means establish a lower bound of 0.41 and an upper bound of 0.83. Scores below, between, or above those values form the paper's interpretation regions. A worked mildly demented example produces a score of 0.60, showing how a single image is scored against the cohort bounds.

## Methodology

The study analyzes 2,198 ADNI images: 1,172 from the CDR 0 group and 1,026 spanning CDR 0.5 through 2. It defines the preprocessing, masks, equation, reference bounds, and crop conditions before reporting the comparison. The hippocampal experiment changes the anatomical crop while retaining the measurement logic, allowing the study to ask whether a more relevant region improves separation.

This is an interpretable classical computer-vision method rather than a deep neural classifier. That choice makes the features and decision rule auditable. It also gives the study a different purpose from Neerav's later four-class CNN work: this paper focuses on a tissue-loss measure and crop sensitivity, while the later study focuses on learned classification and probability ensembles.

## Results

The paper reports the cohort bounds, the worked score, and the crop comparison. Classification accuracy improved from 66 percent with the default crop to 71 percent with the hippocampal crop, a five-percentage-point gain. The result supports the claim that anatomical focus mattered within this retrospective image-level setup.

The supporting evidence includes explicit cohort sizes, visible masks, a reproducible ratio, and a controlled change in crop region. Those elements make it possible to explain what changed and why the measured result may have improved.

## Iterative improvement

The default crop included tissue outside the region most closely associated with the study's dementia question. The observed problem was that broad framing diluted the signal used by the simple density ratio. Neerav applied the same measurement pipeline to a hippocampal crop, keeping the equation constant while changing anatomical focus. The reported comparison then rose by five percentage points.

That sequence—visible limitation, controlled processing change, measured comparison—is the study's clearest iteration. It demonstrates that preprocessing and region selection can matter as much as the downstream rule, especially in an interpretable computer-vision pipeline.

## Impact

The study offers researchers an inexpensive, auditable way to quantify visible tissue-loss patterns across a large image collection. Every result connects to masks and pixel densities, which makes the method easier to teach, review, and reproduce than a black-box score. The publication also shows Neerav's early ability to connect a medical question, image-processing implementation, formal measurement, cohort evaluation, and peer-reviewed communication.

## Scope

The evidence is retrospective and image-level. Clinical validation would add patient-level cohort design, scanner-diverse external data, diagnostic operating characteristics, and clinical review.

## Approved page targets and links

Use the approved target and link metadata in this record's front matter for page actions; it is not narrative content.
