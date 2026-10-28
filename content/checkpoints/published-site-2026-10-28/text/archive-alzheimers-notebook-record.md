# Neerav Chaudhary

Source: https://neerav-git.github.io/archive/alzheimers-notebook-record
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

EXPERIMENT NOTEBOOK
Alzheimer MRI experiment notebook

The executable record for the 6,400-image TensorFlow study: four-class ingestion, training-only augmentation, 2.11-million- and 491,524-parameter CNNs, reusable inference, image-level error review, checkpoint fusion, and the reported improvement from 78% to 85% accuracy.

RELATED WORK
Project page
STUDY DESIGN, MEASURED RESULT, AND EVALUATION SCOPE.
Open in Colab
RUN AND INSPECT THE EXPERIMENT IN GOOGLE COLAB.
Repository
NOTEBOOK SOURCE AND REPOSITORY DOCUMENTATION.
ON THIS PAGE
EXECUTABLE STUDY
One notebook contains the complete experiment path

The Colab file contains data access, MRI inspection, preprocessing, augmentation, CNN training, prediction review, and ensemble comparison.

Images, code, intermediate outputs, and evaluation cells appear in execution order.

EXPERIMENT SEQUENCE
The notebook captures the experiment in sequence

Each stage exposes the inputs and decisions used by the next stage.

SETUP
Data access and setup

The notebook mounts Google Drive, locates the image folders, and constructs the dataset pipeline.

PREPARE
Image inspection and preprocessing

The notebook shows representative MRI slices, resizing decisions, and augmentation logic.

TRAIN
Model construction and training

The model cells show the convolutional architecture, training configuration, and learning curves.

EVALUATE
Evaluation and comparison

Later ensemble and comparison work uses the preprocessing and baseline pipeline recorded earlier.

TECHNICAL REVIEW
The notebook exposes data, model, and evaluation decisions

The companion notebook reports a 78% single-model baseline and an 85% ensemble result; the public notebook retains the matching pipeline and ensemble code.

The linked research record documents 256×256 image resizing, rescaling, augmentation, an 80/10/10 partition, a four-class CNN baseline, error analysis, and averaging ensembles built from saved models. The companion notebook carries the 78% and 85% evaluation outputs.

A broader validation would add subject-level split verification, repeated runs, class-wise metrics, external data, and scanner-diversity analysis.
