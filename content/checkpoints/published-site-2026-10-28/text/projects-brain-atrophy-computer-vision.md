# Neerav Chaudhary

Source: https://neerav-git.github.io/projects/brain-atrophy-computer-vision
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

INTERPRETABLE MRI ATROPHY MEASUREMENT · IEEE ICRITO · 2022
Brain Atrophy Analysis in Dementia

A peer-reviewed computer-vision study that converts T1-weighted MRI scans into an interpretable tissue-loss ratio, derives cohort reference bounds, and improves crop-based classification accuracy from 66% to 71% by focusing the analysis on the hippocampal region.

ROLE
I co-authored the paper and built the repeatable Python/OpenCV pipeline that converts MRI intensity regions into quantitative tissue-loss measurements, reference bounds, crop comparisons, and an atrophy-rate method.

SUMMARY

Peer-reviewed paper. The research method and findings were published in peer-reviewed conference proceedings.

Build, evidence, and scope ↓
SKILLS APPLIED
Python
OpenCV
Medical Imaging
Interpretable CV
Statistical Validation
BUILD, EVIDENCE, AND SCOPE
ON THIS PAGE
RESEARCH OUTCOME
An anatomical hypothesis becomes an explicit, inspectable computer-vision measurement

The study reduces each T1-weighted MRI image to three visible intensity regions, combines their pixel densities into a tissue-loss ratio, and tests that score against reference bounds derived from 2,198 ADNI images.

Published in the IEEE ICRITO 2022 proceedings, the paper reports a five-percentage-point accuracy improvement when the analysis is focused on the hippocampal region.

RESEARCH PROBLEM
Make cerebral atrophy measurable without repeated expert tracing

Dementia can appear in MRI as tissue loss, widened sulci, shrunken gyri, ventricular expansion, and hippocampal change.

These patterns are clinically meaningful, yet large image collections make repeated manual tracing and segmentation expensive and difficult to standardize. The research therefore narrows a broad diagnostic challenge into a concrete measurement question: can visible tissue and open-space patterns be converted into a repeatable score for comparing MRI images?

The resulting method is deliberately transparent. It uses observable intensity regions, fixed thresholds, binary masks, pixel counts, and a published equation. Every score can be traced back through the calculation to the pixels that produced it, giving researchers an interpretable baseline for studying how anatomical focus and image preparation influence the signal.

STUDY AT A GLANCE
The paper connects cohort scale, interpretable bounds, and a measured crop improvement
2,198
ADNI MRI images
T1-weighted images used to derive and examine the proposed atrophy score.
1,172
CDR 0 images
Cognitively normal or non-demented reference group reported in Table I.
1,026
CDR 0.5–2 images
Cognitive-impairment and dementia group reported in Table I.
0.41 / 0.83
Lower and upper dem bounds
Group-average reference values used to interpret new image scores.
66% → 71%
Crop comparison accuracy
A five-percentage-point gain when the hippocampal crop replaces the default crop.
END-TO-END METHOD
Seven stages connect a labeled scan to an interpretable result
GROUP
Organize images by clinical rating

Use ADNI T1-weighted MRI images grouped as CDR 0 and CDR 0.5–2 to establish the study cohorts.

FRAME
Select the anatomical view

Run the measurement on the default crop and on a hippocampal crop so spatial focus becomes a controlled experimental variable.

MASK
Segment three intensity regions

Create binary masks for black, white, and the defined grey interval using fixed RGB values and ranges.

COUNT
Calculate region densities

Count selected pixels in each mask and convert those counts into percentages for the analyzed image area.

SCORE
Compute the dem ratio

Divide dark-region density by the combined white- and grey-region density to quantify open space relative to visible tissue.

BOUND
Derive group reference values

Average scores within the labeled cohorts to establish lower and upper bounds for image-level interpretation.

COMPARE
Evaluate crop performance

Compare default and hippocampal crops through the same scoring workflow and record the classification accuracy of each.

MEASUREMENT MODEL
Three visible image regions produce one auditable atrophy score
BLACK · B
Dark space at RGB [0, 0, 0]

The numerator represents dark regions associated in the paper with cerebrospinal fluid, sulcal space, and ventricular expansion.

WHITE · W
Bright tissue at RGB [255, 255, 255]

White pixels contribute to the visible-tissue denominator used to contextualize dark area.

GREY · G
Mid-range tissue from [70, 70, 70] to [190, 190, 190]

The thresholded grey interval captures additional visible tissue and joins white pixels in the denominator.

DEM = B / (W + G)
Open space relative to visible tissue

A higher ratio indicates more dark area for the measured tissue area and therefore a higher atrophy likelihood under the study model.

INTERPRETABILITY
The score keeps the anatomical reasoning and computation connected

The method treats dark area as a proxy for cerebrospinal-fluid and open-space patterns that increase with ventricular expansion and sulcal widening. White and grey regions represent visible brain tissue. Dividing the first by the second creates a continuous value that can be plotted, averaged across a cohort, compared with reference bounds, or tracked across imaging sessions.

Its simplicity is a technical advantage. A researcher can inspect the crop, review each mask, reproduce the pixel counts, recompute the ratio, and see how a change in framing affects the result. This makes preprocessing part of the scientific question and creates an explainable baseline against which more complex segmentation or learning systems can be compared.

DECISION FRAMEWORK
Cohort averages define three regions of interpretation

The paper derives a lower bound of 0.41 from the non-demented image group and an upper bound of 0.83 from the dementia image group.

BELOW 0.41
Non-demented region

Scores below the lower cohort mean are assigned to the paper's non-demented region.

0.41–0.83
Intermediate region

Scores between the reference values represent varying likelihood based on proximity to either bound.

AT OR ABOVE 0.83
Dementia region

Scores reaching the upper cohort mean enter the paper's dementia region.

WORKED EXAMPLE · 0.60
A result remains visible in context

The mildly demented example shown in the paper falls inside the intermediate interval, illustrating how the score and bounds are interpreted together.

CONTROLLED RESULT
Anatomical focus improved reported accuracy from 66% to 71%

The same OpenCV measurement was evaluated with two image framings. The default crop achieved 66% classification accuracy; focusing the analysis on the hippocampal region achieved 71%. The five-percentage-point gain shows that spatial selection materially affects a handcrafted signal and that anatomically informed preprocessing can improve the usefulness of a simple, transparent measurement.

LONGITUDINAL EXTENSION
The same score supports measurement of change across imaging sessions

The paper extends the image-level score with an atrophy-rate equation: subtract the initial dem value from the final dem value and divide by the time interval. This turns the static measurement into a method for comparing repeated MRI observations using a common unit.

That extension matters because dementia is progressive. A continuous, reproducible score creates a practical bridge from cross-sectional image analysis to future longitudinal studies that can ask how quickly structural change is occurring and how the rate differs across cohorts or interventions.

RESEARCH RIGOR
The study makes its assumptions, measurements, and comparison points visible
DOMAIN GROUNDING
The image features follow known structural signs

The method is motivated by cortical thinning, sulcal widening, ventricular expansion, hippocampal loss, and related imaging literature.

EXPLICIT COMPUTATION
Thresholds and equations are published

The three color definitions, binary-mask procedure, dem equation, group-bound equations, and atrophy-rate equation are all stated in the paper.

COHORT ANCHORING
Interpretation uses observed group means

Lower and upper regions come from average scores in the labeled image groups, giving the rule a dataset-derived reference point.

ABLATION-LIKE COMPARISON
The crop changes while the core method stays fixed

Default and hippocampal crops isolate the contribution of anatomical focus to reported classification performance.

IMPACT
The work provides a useful baseline for research, teaching, and reproducible imaging analysis
MEDICAL-IMAGING RESEARCHERS
A transparent quantitative baseline

The score offers a fast, inspectable reference for comparing crops, segmentation choices, and more complex methods.

LONGITUDINAL STUDIES
A common measurement across time points

The atrophy-rate extension provides a simple structure for studying the direction and pace of image-level change.

STUDENTS AND PRACTITIONERS
An end-to-end example of interpretable feature engineering

The paper shows how clinical knowledge can guide thresholds, ratios, decision regions, and focused evaluation.

RESEARCH OPERATIONS
Repeatable pixel measurement at collection scale

Automated masks and counts reduce repeated manual measurement work and make the same calculation available across thousands of images.

MY CONTRIBUTION
I built the measurement pipeline and co-authored the published study

I translated the research question into a repeatable Python/OpenCV workflow: defining the intensity regions, generating masks, calculating pixel densities, formalizing the dem score, deriving cohort reference bounds, comparing default and hippocampal crops, and extending the measurement to change over time. I also co-authored the paper that explains the methodology, results, and research context.

PUBLICATION RECORD
The method and findings appear in the IEEE ICRITO 2022 proceedings
2022
Publication year
10th International Conference on Reliability, Infocom Technologies and Optimization.
1234–1238
Proceedings pages
Five-page peer-reviewed conference paper.
14
References
Research grounding across dementia, neuroanatomy, MRI segmentation, ADNI, and computer vision.
10.1109/ICRITO56286.2022.9964994
DOI
Persistent IEEE identifier for the publication.
EVALUATED SCOPE
A peer-reviewed retrospective image-level measurement and crop study

The paper establishes the method on 2,198 labeled ADNI MRI images and reports the score bounds, worked example, and default-versus-hippocampal crop result. The reported unit is images, and the published accuracy comparison is crop-based.

A clinical validation program would extend the research with patient-level cohort design, scanner-diverse external data, sensitivity and specificity, calibration, prospective evaluation, and clinical review. The separate four-class TensorFlow notebook is documented on its own page so each study retains a clear method and evidence record.

PROJECT LINKS
IEEE DOI
PUBLICATION RECORD FOR ANALYZING BRAIN ATROPHY IN DEMENTIA USING COMPUTER VISION.
Publication record
CITATION, CONTRIBUTION, METHOD, RESULTS, AND EVIDENCE SCOPE FOR THE PEER-REVIEWED PAPER.
Separate MRI classification study
A DISTINCT FOUR-CLASS TENSORFLOW NOTEBOOK AND ENSEMBLE-LEARNING EXPERIMENT.
