# Neerav Chaudhary

Source: https://neerav-git.github.io/projects/alzheimers-disease-research
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

FOUR-CLASS MRI CLASSIFICATION AND ENSEMBLE LEARNING · BUILT AND EVALUATED · 2024
Four-Class Alzheimer MRI Classification

A complete TensorFlow MRI experiment that turns 6,400 ADNI brain MRI images into a four-class training pipeline, compares independently saved CNNs, and raises held-out accuracy from 78% to 85% through probability-level ensembling.

ROLE
I designed and built the complete notebook experiment: ADNI data discovery and inspection, TensorFlow preprocessing and augmentation, CNN architecture design and hyperparameter tuning (depth, width, normalization, dropout), training, checkpoint loading, reusable inference, sample-level error review, two- and three-model probability ensembles, weighted-fusion exploration, evaluation calls, visualizations, and run documentation.

SUMMARY

Notebook research study. The repository implements the complete classification and ensemble workflow; linked experiment records supply the reported held-out result.

Build, evidence, and scope ↓
SKILLS APPLIED
Python
TensorFlow
Keras
Deep Learning
CNN Ensembles
Medical Imaging
BUILD, EVIDENCE, AND SCOPE
ON THIS PAGE
RESEARCH OUTCOME
A complete four-class MRI experiment connects raw images to reusable probability ensembles

The notebook makes the full path inspectable: 6,400 folder-labeled scans become performant TensorFlow datasets, trained CNN variants, class-probability vectors, visual error-review grids, and two- and three-model ensemble decisions.

The companion experiment reports a held-out accuracy increase from 78% for the single-model baseline to 85% for the ensemble.

EXPERIMENT AT A GLANCE
The recorded workflow spans data scale, architecture scale, and measured improvement
6,400
MRI image files
The committed loader output discovers 100 full batches of 64 across four folder-defined classes.
4
Severity categories
NonDemented, VeryMildDemented, MildDemented, and ModerateDemented.
5,120 / 640 / 640
Recorded image partition
Eighty training batches, ten validation batches, and ten held-out test batches in the saved run.
2.11M / 491K
Compared model scales
Trainable-parameter counts retained for the main six-block CNN and a compact saved variant.
78% → 85%
Companion experiment accuracy
A seven-percentage-point improvement after combining CNN probability outputs.
END-TO-END EXPERIMENT
Every stage produces an inspectable artifact for the next decision
INSPECT
Verify labels, shapes, and visible image characteristics

Discover the folder hierarchy, print the four-class order and tensor shape, render a labeled 12-scan montage, and sample the proportion of black background pixels.

PARTITION
Create repeatable training, validation, and test streams

Split the 100 batches into an 80/10/10 workflow and apply cache, shuffle, and AUTOTUNE prefetching so input preparation overlaps model execution.

TRANSFORM
Standardize scans and generate training variation

Resize to 256×256, rescale values by 1/255, and apply flips, rotation, width and height shifts, and zoom only to the training stream.

MODEL
Train and reload independently saved CNNs

Build the primary six-block network, inspect its architecture, save checkpoints, and load compact and alternative variants for a common classification task.

COMBINE
Fuse full probability vectors

Compose two- and three-model Keras graphs that average four-class softmax outputs before the final class selection.

REVIEW
Compare outcomes at dataset and image level

Evaluate the graphs on the held-out stream and use 3×3 grids to place actual class, predicted class, and confidence directly above each MRI.

DATA UNDERSTANDING
The study inspects the images before asking a network to classify them

The loader reports exactly 6,400 files belonging to four classes and retains their alphabetical class-index order. A saved batch confirms tensors shaped 64 × 256 × 256 × 3 with integer labels, while the 12-image montage lets the researcher inspect representative scans and category labels before training begins.

The notebook also measures the black-background fraction in sampled scans using two OpenCV and NumPy approaches. Recorded examples contain approximately 48.0% and 46.47% black pixels. These samples are exploratory checks, and they surface a central imaging consideration: a large share of each slice may carry no anatomy while still influencing resizing, convolution, and augmentation.

The pipeline converts the 100 batches into 80 training, ten validation, and ten test batches. Each stream is cached, shuffled, and prefetched with tf.data.AUTOTUNE. Training images receive horizontal and vertical flips, 0.2 rotation, 0.2 width and height variation, and 0.1 zoom. Validation and test scans keep their unaugmented evaluation path. The resulting workflow automates input standardization and varied training views while keeping the held-out streams comparable.

SAMPLE-LEVEL INSPECTION
Individual scans remain visible throughout inference and error review

The notebook moves repeatedly between tensors, probability outputs, and the underlying MRI so aggregate accuracy stays connected to the images producing each decision.

A retained notebook output showing one of the MRI slices used during visual inspection.

MODEL STRUCTURE
The architecture rendering exposes the entire convolutional decision path

The retained diagram makes augmentation, convolution, pooling, dropout, dense representation, and four-class softmax output visible as one connected model.

The primary CNN contains six convolution-and-pooling blocks followed by dropout, flattening, a 512-unit ReLU layer, and a four-unit softmax classifier.

ARCHITECTURE COMPARISON
Model diversity is made concrete through scale, checkpoints, and shared evaluation
PRIMARY CNN
2,114,756 trainable parameters

Six convolutional blocks progress through 64, 64, 128, 256, 256, and 256 filters, each followed by 2×2 max pooling, then 30% dropout and a 512-unit dense representation.

COMPACT CHECKPOINT
491,524 trainable parameters

A separately saved six-block network uses 32, 64, 64, 128, 128, and 128 filters with a 128-unit dense layer, providing a materially different scale for comparison and fusion.

COMMON TASK
One four-class input and evaluation contract

Each model receives the same 256×256×3 input shape, produces a four-value softmax vector, and can be evaluated through the same sparse-cross-entropy and accuracy workflow.

REUSABLE INFERENCE
Class and confidence remain inspectable

A shared helper converts raw predictions into the class name and maximum softmax confidence used by both individual models and ensembles.

ENSEMBLE CONTRIBUTION
The notebook combines model judgments before information is discarded

The two-model graph sends one MRI through the primary network and a saved variant, then averages their complete four-class softmax vectors. The three-model graph repeats the operation across three independently saved checkpoints. Final class selection happens only after fusion.

This late-fusion design retains each model's relative support for every category. Agreement strengthens a decision; disagreement lets one network's uncertain or idiosyncratic output be moderated by the others. It uses more information than voting over final labels and avoids the additional training protocol required by a learned meta-classifier.

The implementation also improves the research workflow. Saved checkpoints become composable Keras graph components that share an input, evaluation stream, loss, accuracy metric, and inference helper. Single-model, two-model, and three-model behavior can therefore be compared inside the same notebook instead of through disconnected manual runs. A custom weighted layer begins the next experiment by assigning proposed weights of 0.3, 0.6, and 0.1.

ERROR ANALYSIS
Predictions remain tied to the scans that produced them

The analysis supplements aggregate accuracy with image-level review of the model's decision and confidence.

ACTUAL
Folder label above each scan

Each 3×3 review grid starts with the recorded category so the investigator can see the target alongside the anatomy.

PREDICTED
Model or ensemble decision

The same grid shows the selected category for an individual checkpoint or the three-model ensemble.

CONFIDENCE
Maximum softmax probability

The displayed score distinguishes tentative errors from confidently incorrect decisions and helps prioritize qualitative review.

SHARED TOOL
One helper across model variants

The inference function accepts a single model or ensemble graph, keeping the review procedure consistent as the experiment changes.

RECORDED RESULT
Probability ensembling improved held-out accuracy from 78% to 85%

The companion experiment records a 78% single-model baseline and an 85% ensemble result: a seven-percentage-point gain, approximately 9% relative to the baseline. The public notebook independently contains the matching four-class pipeline, saved-model loading, equal-average two- and three-model graphs, compilation, test evaluation calls, and a separate markdown statement describing a 13% improvement for its three-model comparison. These are two recorded comparisons, so the portfolio assigns each result to its own experiment record.

RESEARCH METHODOLOGY
The experiment grows in controlled steps from data inspection to model consensus
OBSERVE
Begin with the data distribution and image content

Count files, verify class order and batch shape, view real samples, and inspect background occupancy before selecting transformations.

CONTROL
Keep training variation separate from evaluation

Apply augmentation to the training stream and retain dedicated validation and test partitions for comparison.

ESTABLISH
Train and inspect a convolutional baseline

Record architecture, parameter count, learning curves, evaluation calls, and sample predictions in the same executable document.

DIVERSIFY
Reload models with meaningfully different capacities

Use separately trained saved variants as independent probability estimators with distinct capacities and decision boundaries.

FUSE
Compare equal and weighted probability combinations

Evaluate two-model and three-model averages, then prototype a weighted layer for the next controlled comparison.

INTERPRET
Return aggregate results to individual images

Review actual label, predicted label, and confidence together to identify the scans behind correct and incorrect decisions.

IMPACT
The work turns a collection of familiar ML operations into a coherent, reusable research system
APPLIED ML RESEARCHERS
A modifiable four-class imaging workflow

The notebook connects storage, labels, batching, augmentation, deep CNNs, checkpoints, inference, evaluation, and ensembling in executable order.

RESEARCH TEAMS
Faster comparison of trained variants

Common input and evaluation contracts make checkpoints composable and reduce repeated loading, scoring, and manual result assembly.

REVIEWERS AND STUDENTS
Visible reasoning across the experiment

Retained examples, tensor shapes, summaries, architecture rendering, prediction helpers, and fusion graphs show how each result is produced.

FUTURE MEDICAL-IMAGING STUDIES
A concrete foundation for deeper validation

The workflow supplies the experimental scaffolding needed to add subject-aware splits, class-wise metrics, calibration, scanner-diverse data, and external validation.

MY CONTRIBUTION
I designed and built the full classification and ensemble experiment

I implemented the notebook's data discovery, labeled image inspection, black-background exploration, TensorFlow partitioning and performance pipeline, resizing and rescaling, training-only augmentation, six-block CNN, architecture visualization, checkpoint persistence and loading, reusable class-and-confidence inference, image-level error-review grids, two- and three-model probability ensembles, weighted-fusion exploration, test evaluation calls, and documentation for reproducing the workflow.

EVALUATED SCOPE
A rigorous retrospective MRI classification study and ensemble result

The repository implements the complete image-level experiment and retains evidence for its data scale, partitions, tensor shape, model structures, and inference workflow. The companion experiment supplies the 78% to 85% held-out comparison.

A clinical validation program would extend this work with subject-level separation, repeated runs, confusion matrices and class-wise statistics, scanner-diverse external data, calibration, and clinical review.

PROJECT LINKS
Repository
PUBLIC README AND COMMITTED NOTEBOOK.
Open in Colab
OPEN THE NOTEBOOK IN GOOGLE COLAB.
Notebook evidence record
REPOSITORY AUDIT OF THE DATA PIPELINE, MODEL VARIANTS, AND SAVED OUTPUTS.
Published MRI research
SEPARATE IEEE PAPER ON LONGITUDINAL BRAIN-ATROPHY MEASUREMENT.
