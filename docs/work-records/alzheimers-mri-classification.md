# Four-class Alzheimer MRI classification: CNN experimentation and probability ensembles

## Record scope and evidence basis

This record describes the public repository [`neerav-git/Alzheimer-s-Disease-Detection-Ensemble-Learning`](https://github.com/neerav-git/Alzheimer-s-Disease-Detection-Ensemble-Learning), inspected on October 12, 2026 at `main` commit `2bae1dd`. The repository contains one 100-cell Google Colab notebook, `AZclassification5(wide).ipynb`, and a README that explains how to supply the external image data and rerun the workflow. The notebook was created in April 2024; the README was expanded in May 2026. The full public commit history contains six commits, all attributed to Neerav identities.

The evidence review covered every markdown and code cell, every retained text output and image output, all notebook revisions in Git history, the current README, and the portfolio's source ledger. No model training was rerun: the image dataset and saved Keras models live in Google Drive and are not committed, and recreating a 50- or 300-epoch GPU experiment would not be a proportionate documentation step. This record therefore distinguishes three kinds of evidence. Retained notebook outputs establish the data count, class names, batch partitions, model summaries, and visible MRI examples. Code establishes the implemented preprocessing, modeling, inference, and ensemble procedures. Performance statements are reported results whose provenance is named explicitly.

This is a separate project from *Analyzing Brain Atrophy in Dementia Using Computer Vision*, the five-page IEEE ICRITO 2022 paper by Neerav Chaudhary and Sourabh Singh Verma. The paper studies longitudinal atrophy measurement with image processing; this repository studies four-class single-image classification with TensorFlow CNNs and prediction-level ensembles. Neither project's evidence should be used to fill gaps in the other.

## The problem: make multi-stage MRI classification experimentation inspectable

The practical machine-learning problem is to distinguish four folder-defined stages from brain MRI images: `NonDemented`, `VeryMildDemented`, `MildDemented`, and `ModerateDemented`. This is more demanding than a binary normal-versus-dementia demonstration because the model must learn boundaries between adjacent severity categories whose images can appear structurally similar. It also creates an evaluation question beyond “can a CNN fit these images?”: can independently saved models be combined so that one model's uncertain or idiosyncratic prediction is moderated by the others?

The repository addresses that question as an end-to-end experimental notebook rather than as an isolated architecture snippet. It begins with data access and visual inspection, turns a directory tree into TensorFlow batches, partitions those batches, adds training-only augmentation, defines and inspects a CNN, supports single-image and grid inference, reloads independently saved models, and compares single-model evaluation with two-model, three-model, and draft weighted ensembles. The contribution is the experimental progression. A reader can see how the input data becomes tensors, how the tensors become class probabilities, and how those probabilities become an ensemble decision.

This work is useful first to applied ML researchers and students who need a concrete, modifiable four-class imaging workflow. It is also useful to research teams deciding whether model diversity merits further controlled study: the notebook provides the full scaffolding needed to compare variants on a common task. Patients and clinicians are the motivating population, but they are not users of a deployed system here. The work is a retrospective classification experiment, not a clinical diagnostic service.

## What was built: a complete notebook workflow over 6,400 images

The saved directory-loader output reports exactly **6,400 files belonging to four classes**. With a batch size of 64, the dataset contains 100 batches. The class-name output records the alphabetical folder order as `MildDemented`, `ModerateDemented`, `NonDemented`, and `VeryMildDemented`. A retained batch inspection confirms tensors shaped `(64, 256, 256, 3)` and integer class labels. The notebook then displays a 12-image labeled montage so the investigator can inspect actual inputs before training rather than treating the folder tree as an abstract table.

There is also a small but thoughtful image-content check. Two OpenCV/NumPy approaches measure black background pixels in sampled scans. Saved outputs show a black-area fraction of `0.480087...` for one `VeryMildDemented` sample and `46.47%` for one `NonDemented` sample. These are not dataset-wide quality statistics, but they demonstrate attention to a characteristic of MRI slices that can dominate pixels while carrying no anatomy. This kind of exploratory inspection is important when choosing resizing, convolution, and augmentation behavior.

The declared partition is 80% training, 10% validation, and 10% test. The retained outputs show 80, 10, and 10 batches respectively—corresponding to 5,120 training images, 640 validation images, and 640 test images for this 6,400-file, full-batch run. The pipeline caches each partition, shuffles it, and prefetches with `tf.data.AUTOTUNE`, so data preparation can overlap model execution instead of becoming a serial input bottleneck.

Images are resized to 256×256 and rescaled by `1/255`. Training data is augmented with horizontal and vertical flips, rotation with factor `0.2`, width and height variation with factor `0.2`, and zoom with factor `0.1`. The augmentation is mapped onto `train_ds`; validation and test datasets are not sent through that augmentation map. This automates the generation of varied training views without manually creating and storing duplicate images.

The main CNN recorded in the current notebook contains six convolutional blocks with 64, 64, 128, 256, 256, and 256 filters. Every convolution is followed by 2×2 max pooling. The classifier head uses 30% dropout, flattening, a 512-unit ReLU dense layer, and a four-unit softmax output. The saved Keras summary reports **2,114,756 trainable parameters**. The intended training configuration is Adam optimization, sparse categorical cross-entropy, and accuracy tracking. The notebook includes history plots for training/validation accuracy and loss, a sample prediction cell, and a reusable inference function that returns both the predicted class and maximum softmax confidence for a 3×3 review grid.

The workflow also preserves an architectural contrast. A previously saved model loaded from the `model3.0` Drive directory has six convolutional layers with 32, 64, 64, 128, 128, and 128 filters, followed by dropout and a 128-unit dense layer. Its retained summary reports **491,524 trainable parameters**, less than one quarter of the 2.11-million-parameter model. Two other saved models are loaded as `modelv1` and `modelv2`. Although their summaries are not preserved in the public file, the use of separately saved variants makes the ensemble experiment materially different from duplicating one prediction three times.

The notebook's error-review method is qualitative and image-level. For both a single saved model and the three-model ensemble, it defines 3×3 grids whose titles place the actual folder label, predicted label, and maximum softmax confidence directly above each scan. This gives the investigator a fast way to inspect *what kind* of image produced a correct or incorrect decision and whether an error was made with high or low confidence. Those grid outputs are not retained in the public notebook, and the code does not aggregate them into a confusion matrix or class-wise rates. It is therefore accurate to describe implemented sample-level prediction review, not a completed statistical error analysis.

## The ensemble contribution: combine model judgments at the probability level

The strongest implemented research idea is late fusion of class probabilities. The two-model ensemble feeds a common 256×256×3 input through `new_model` and `modelv2`, then applies Keras `Average` to the two four-class output vectors. The three-model ensemble repeats the procedure with `new_model`, `modelv1`, and `modelv2`. Because softmax vectors encode each model's relative support for all four classes, averaging uses more information than majority voting over final labels. A confident wrong prediction can be counterbalanced by two models assigning probability mass elsewhere, while agreement is reinforced.

This approach improves the experimental workflow as well as the model result. Without it, comparing trained variants is often a manual sequence of loading a checkpoint, running evaluation, writing down a score, and mentally deciding which model to keep. Here, saved models become composable Keras graph components evaluated through the same test pipeline. The ensemble is itself compiled and evaluated with the same sparse cross-entropy and accuracy metric, and it can be passed into the same visual inference function as a single model. That makes model combination a reproducible operation within the notebook rather than an after-the-fact claim.

The final section explores weighting rather than equal averaging. It defines a custom Keras layer with proposed weights `0.3`, `0.6`, and `0.1`. The current `call` implementation combines only the first two inputs and does not apply the third weight, so the defensible description is a **draft weighted-ensemble experiment**, not a completed three-model weighted result. Its presence still shows the next methodological question the work was testing: whether the stronger constituent should have more influence than its peers.

## Methodology and evaluation provenance

The notebook follows a sensible iterative methodology: inspect the inputs; standardize their dimensions and numeric range; introduce controlled variation only in the training stream; establish a convolutional baseline; preserve trained variants; then compare output fusion strategies on a held-out partition. Keeping the model summaries, sample images, architecture rendering, inference views, and evaluation calls in one document makes the reasoning inspectable. The Git history reinforces that this was an active experimental record: an initial notebook commit was followed minutes later by corrections to an indentation failure and expanded dataset framing, rather than a polished result being uploaded without its working context.

The result record has two distinct sources that should remain distinct:

- In the public notebook, immediately after `ensemble_model3.evaluate(test_ds)`, a markdown cell says: **“A jump in accuracy of 13% has been observed when comparing the ensembled model with the original.”** The cell does not say whether 13% means percentage points or relative percent. The corresponding `model.evaluate` output is not saved, so the public repository preserves the result statement and matching evaluation code, but not the numeric score pair or run log behind it.
- The portfolio source ledger records an **author-confirmed companion experiment result of 78% baseline accuracy and 85% ensemble accuracy**. That is a seven-percentage-point increase, or about 9% relative to the 78% baseline. The current public repository does not contain or link the companion notebook's output cells, so 78%→85% should be attributed to the companion record rather than described as reproduced from the public notebook.

These statements may refer to different baseline/ensemble comparisons or different ways of calculating improvement; the available evidence does not justify treating them as interchangeable. The positive, exact account is therefore: the public artifact implements and evaluates equal-averaging ensembles and records a 13% improvement statement; a separate author-confirmed companion experiment reports a 78% to 85% held-out accuracy improvement. Neither result was rerun during this documentation pass.

The retained public outputs independently verify several important experimental facts: 6,400 files, four classes, 100 total batches, an 80/10/10 batch partition, 256×256 RGB-shaped tensors, a 2,114,756-parameter main CNN, and a 491,524-parameter saved CNN. The notebook also directly records visual data inspection and architecture rendering. What it does not preserve is a confusion matrix, per-class precision/recall, repeated-seed statistics, or the numeric outputs of its `evaluate` cells. Accordingly, the result is evidence of a successful research iteration, not a claim of validated diagnostic performance.

One evaluation detail matters for future interpretation. Partitioning is performed over a shuffled TensorFlow dataset of images/batches, and the repository does not include patient identifiers or a subject-level split manifest. Multiple slices from one person could therefore be split across partitions if the source folder contains them; the public code cannot establish otherwise. This does not erase the experiment's value, but it defines what the accuracy numbers measure: performance on the notebook's held-out image pipeline, not proven generalization to unseen patients, scanners, or clinical settings.

## Why the work is notable

Within a compact Colab artifact, the author assembled the major stages of a real computer-vision study instead of stopping at a tutorial classifier. The notebook handles external storage, GPU-aware TensorFlow setup, directory-based labels, visual quality inspection, performant input pipelines, augmentation, a deep CNN, checkpoint loading, architecture visualization, reusable inference, and prediction-level fusion. It compares a 2.11M-parameter network with a saved 491K-parameter design and treats model variation as a resource for ensemble construction. That breadth is especially valuable in notebook-first research, where the hardest work is often connecting many individually familiar operations into an experiment another person can follow.

The ensemble design is also appropriately simple for the evidence available. Rather than introducing a complex meta-learner that would require another training protocol, equal averaging uses existing model probabilities and can be evaluated immediately on the same held-out stream. It creates a clear experimental contrast: single model versus two-model consensus versus three-model consensus. The reported improvements suggest that the constituent models captured complementary decision boundaries, which is the core reason ensembling can outperform an individual network. That complementarity is an interpretation of the observed comparison, not a separately measured diversity statistic.

For an applied research team, the workflow reduces repeated image handling and comparison work. TensorFlow automatically discovers the files, batches and prefetches them; the augmentation layer generates variations during training; the inference helper converts raw predictions into class/confidence labels; and the Keras functional API fuses checkpoints into a single evaluable graph. For a reviewer, the notebook makes the sequence legible through retained examples, summaries, and code. For a future medical-imaging study, it supplies a practical starting point for subject-level splitting, class-wise error analysis, external validation, and calibration—without claiming those later steps are already complete.

## Author role and attribution

The public history supports describing Neerav as the sole repository author and builder of the recorded experiment. Four April 2024 commits under the `Neerav21` identity created and corrected the Colab notebook. Two May 2026 commits under `neerav-git`/`Neerav` expanded and then tightened the README. There are no other commit authors in the repository.

The defensible role statement is: Neerav designed and implemented the notebook's data-loading, image-inspection, preprocessing, augmentation, CNN, inference, checkpoint-loading, and ensemble-comparison workflow, and later documented how to run it. The repository does not establish authorship of the underlying MRI dataset or clinical labels, and it does not identify a clinical collaborator. The separate IEEE atrophy paper has a second human author, Sourabh Singh Verma, but that team attribution belongs to the publication, not to this four-class repository.

## Concise claim ledger

### Measured or recorded results

- The committed loader output reports 6,400 image files in four classes; the dataset produces 100 batches of 64 at 256×256×3.
- Retained partition outputs show 80 training, 10 validation, and 10 test batches, corresponding to 5,120/640/640 images in this run.
- The main CNN summary reports 2,114,756 trainable parameters; the loaded `model3.0` summary reports 491,524.
- The public notebook records a “13%” accuracy jump for the three-model ensemble versus the original, without saved score outputs or a stated percentage-point/relative-percent convention.
- The author-confirmed companion experiment record reports 78% baseline accuracy and 85% ensemble accuracy on its held-out split: +7 percentage points, approximately +9% relative. This result is not reproduced in the public notebook's retained outputs.

### Directly verified capabilities

- Directory ingestion, four-class label discovery, MRI montage inspection, 256×256 resizing, `1/255` rescaling, and training-only augmentation are implemented.
- An 80/10/10 dataset-partition function, cache/shuffle/prefetch pipeline, six-block CNN, softmax inference, confidence display, and architecture visualization are implemented.
- The notebook loads three saved Keras models, constructs equal-average two- and three-model ensembles, compiles them, and calls evaluation on the test dataset.
- A weighted-ensemble layer is prototyped; its current forward pass uses two of the three model outputs, so it is not evidence of a completed three-model weighted ensemble.

### Interpretation supported by the evidence

- The work's strongest contribution is the connected experimental progression from raw folder data to reusable probability ensembles, not a novel convolution operator.
- The reported ensemble gains are consistent with separately trained CNN variants contributing complementary errors, although diversity was not measured directly.
- The workflow automates data preparation, variation generation, checkpoint reuse, prediction display, and probability fusion, reducing manual experiment assembly.
- The study demonstrates a promising retrospective classification method. It does not establish unseen-patient generalization, external-dataset performance, or clinical diagnostic readiness.

## Source map

- Current public repository and run instructions: [`README.md`](https://github.com/neerav-git/Alzheimer-s-Disease-Detection-Ensemble-Learning/blob/main/README.md), inspected at commit `2bae1dd0b56d92acdff9f3e0969f680fe5b8c8a5`.
- Primary experiment artifact: [`AZclassification5(wide).ipynb`](https://github.com/neerav-git/Alzheimer-s-Disease-Detection-Ensemble-Learning/blob/main/AZclassification5%28wide%29.ipynb), especially cells 12–18 (configuration, loader, classes, batch shape), 20–24 (image and background inspection), 26–41 (partitioning, caching, resizing, augmentation), 44–70 (CNN, summaries, evaluation/inference, architecture view), and 72–99 (model persistence, saved variants, equal and weighted ensembles).
- Exact retained notebook outputs: cell 16 (6,400 files/four classes); cell 17 (class order); cell 18 (64×256×256×3 batch); cells 26–33 (100 total and 80/10/10 partition batches); cell 47 (2,114,756 parameters); cell 76 (491,524 parameters).
- Public result statement: notebook cell 93, following the three-model evaluation call in cell 92, records the 13% improvement wording. Evaluation cells 52, 77, 83, 87, 92, and 99 have no saved output in the current public file.
- Companion-result provenance: `docs/CONTENT_SOURCE_LEDGER.md`, “Four-class Alzheimer MRI classification,” records the author-confirmed 78% baseline and 85% ensemble result and the public-output boundary.
- Repository history: `7795f1e` (initial README), `f1556e9` (initial notebook), `9f70dc0` (remove retained indentation failure/correct compile cell), `32e5471` (expand four-class dataset framing), `d194441` (detailed README), and `2bae1dd` (tighten README).
- Separate publication, not evidence for this classification experiment: Neerav Chaudhary and Sourabh Singh Verma, *Analyzing Brain Atrophy in Dementia Using Computer Vision*, IEEE ICRITO 2022, DOI [`10.1109/ICRITO56286.2022.9964994`](https://doi.org/10.1109/ICRITO56286.2022.9964994).
