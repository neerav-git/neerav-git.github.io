# Neerav Chaudhary

Source: https://neerav-git.github.io/writing/notebook-first-medical-ml-is-still-real-research
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

METHODS NOTE
Inside the four-class Alzheimer MRI study

How 6,400 MRI files move through resizing, augmentation, CNN training, error analysis, and ensemble evaluation.

PUBLICATION DETAILS

June 8, 2026

Methods note

REFERENCES AND FILES
MRI classification project
COMPLETE CASE STUDY AND EVIDENCE BOUNDARY.
Repository
PUBLIC NOTEBOOK, README, AND SAVED IMAGE OUTPUTS.
Open in Colab
RUN THE CURRENT PUBLIC NOTEBOOK IN GOOGLE COLAB.
ON THIS PAGE
EXPERIMENT
Four MRI folders define one multiclass prediction task

The study predicts NonDemented, VeryMildDemented, MildDemented, or ModerateDemented from a brain MRI image.

Linked Colab experiments report a gain from 78% baseline accuracy to 85% after ensemble comparison and error analysis.

PIPELINE
The notebook executes five concrete stages
DISCOVER
Discover 6,400 files

Mount Google Drive, enumerate MRI images, and map each parent folder to a class label.

BATCH
Create 256×256 batches

Resize and rescale each image, then allocate training, validation, and test partitions using the declared 80/10/10 split.

AUGMENT
Augment training images

Apply randomized image transformations inside the training pipeline to increase input variation.

TRAIN
Train CNN variants

Run convolution, pooling, dropout, and dense classification layers against the same four labels.

ENSEMBLE
Average model probabilities

Compare single-model predictions with two-model, three-model, and draft weighted ensembles.

REPORTED RESULT
Ensemble comparison produced a seven-point gain
78%
Baseline accuracy
Single-model result recorded in the linked companion experiment.
85%
Ensemble accuracy
Best reported result after model comparison and error analysis.
+7 pts
Absolute improvement
Difference between the recorded baseline and ensemble accuracy.
4
Predicted classes
Folder labels spanning non-demented through moderate dementia.
ARCHITECTURE
The saved graph shows the model path from input to class probabilities

The exported Keras graph identifies augmentation, convolution, pooling, dropout, and final classification layers.

CNN architecture exported from the experiment notebook.

VALIDATION REQUIREMENTS
Four additions would strengthen the next study
PARTITIONING
Split by patient identity

Document subject identifiers and keep every scan from one person in a single partition.

CLASS PERFORMANCE
Report each stage separately

Add per-class precision, recall, F1, and a confusion matrix alongside overall accuracy.

STABILITY
Repeat the training runs

Report variation across seeds and model initializations for the baseline and ensemble.

GENERALIZATION
Evaluate an external cohort

Test images from another scanner, site, or dataset and document the resulting performance change.

SOURCE NOTE
The research record spans linked Colab files

The companion notebook carries the 78% and 85% results; the public repository carries the matching preprocessing, CNN, and ensemble implementation.

The current public notebook has incomplete saved outputs for its model.evaluate cells. The linked companion experiment retains the reported baseline and ensemble scores. The case study cites the result with that storage history attached.
