---
slug: alzheimers-disease-research
approvedTargets:
  - project.alzheimers-disease-research
  - project.alzheimers-disease-research.methodology
  - project.alzheimers-disease-research.3-every-stage-produces
  - project.alzheimers-disease-research.4-the-study-inspects
  - project.alzheimers-disease-research.7-model-diversity-is
  - project.alzheimers-disease-research.8-the-notebook-combines
  - project.alzheimers-disease-research.10-probability-ensembling-improved
  - project.alzheimers-disease-research.12-the-work-turns
  - project.alzheimers-disease-research.links
approvedLinks:
  - link.alzheimers-disease-research.repository
  - link.alzheimers-disease-research.open-in-colab
  - link.alzheimers-disease-research.notebook-evidence-record
  - link.alzheimers-disease-research.published-mri-research
metricIds:
  - mri-ensemble-78-to-85
---

# Four-Class Alzheimer MRI Classification

## In plain terms

This deep learning research teaches convolutional neural networks (CNNs) to sort brain MRI scans into four stages of dementia, from none through very mild and mild to moderate. Neerav preprocessed 6,400 ADNI MRI images, standardizing their size and intensity and adding controlled variation to the training images so the networks learn real patterns instead of memorizing scans. He then tuned the networks extensively, comparing depth, width, normalization, and dropout: the main network uses six convolutional blocks growing from 64 to 256 filters with 30 percent dropout and a 512-unit classifier, while a lighter variant uses 32 to 128 filters and a 128-unit classifier.

The key result came from combining independently trained convolutional neural networks. Instead of trusting one model, the ensemble averages their full confidence across all four stages, which helps most where neighboring stages look alike. On scans held back from training, accuracy rose from 78 to 85 percent, seven more correct classifications for every hundred scans. The work shows Neerav can carry a medical imaging question from raw data through a rigorous, inspectable experiment to a measurable improvement.

## Outcome

This is a complete TensorFlow experiment for classifying MRI images into NonDemented, VeryMildDemented, MildDemented, and ModerateDemented categories. It turns 6,400 folder-labeled images into an inspectable training and evaluation pipeline, compares independently saved convolutional neural networks, and tests whether their full class-probability vectors provide complementary judgments when combined.

The visible outcome is a 100-cell Colab notebook with retained evidence for data discovery, preprocessing, augmentation, architecture, training, checkpoint loading, single-image and grid inference, error review, and two- and three-model fusion. It supports both reproducibility and close inspection of where a model is confident or confused.

## Neerav's contribution

Neerav designed and built the complete notebook experiment. He implemented data discovery and visual inspection, TensorFlow preprocessing and training-only augmentation, convolutional architectures, training and checkpoint persistence, reusable inference helpers, sample-level review grids, two- and three-model probability ensembles, weighted-fusion exploration, evaluation calls, visualizations, and run documentation.

The methodological contribution is the composition of independently trained checkpoints into a common evaluation graph without reducing their outputs to majority votes. By retaining the full probability distribution, the ensemble can use differences in confidence between adjacent dementia-stage categories.

## User journey

A reviewer can begin with the discovered folder structure and class counts, inspect representative scans, and follow the exact image transformations into cached and prefetched TensorFlow datasets. The notebook partitions the images into training, validation, and held-out streams; applies augmentation only to training; and exposes tensor shapes and labels before model fitting.

The reviewer can then inspect the deep and compact CNN variants, train or reload checkpoints, run one image or a review grid through a model, compare predicted confidence with the class label, and evaluate a shared held-out stream. Ensemble cells load multiple saved networks, collect their probability vectors, average or weight those vectors, and apply the final class decision. Plots and retained outputs make the workflow inspectable without requiring the reader to infer what happened between cells.

## Architecture and tools

TensorFlow and Keras provide dataset pipelines, augmentation, CNN layers, training, persistence, and inference. Google Colab makes the experiment executable with visible cell-level outputs. Images are standardized to 256 by 256 RGB tensors and passed through cached, batched, and prefetched datasets.

The recorded split is 5,120 training images, 640 validation images, and 640 held-out images. The primary six-block CNN contains 2,114,756 parameters; a separately saved compact variant contains 491,524 parameters. Reloading checkpoints rather than deriving variants from one active model preserves the possibility of complementary errors. Probability-level fusion averages the class vectors before argmax, and the weighted exploration keeps the combination rule explicit and inspectable.

## Methodology

The experiment begins with data inspection because file discovery and label mapping are part of the result. It records four labels, 6,400 files, 100 batches, tensor dimensions, and the 80/10/10 partition. Training-only augmentation protects validation and held-out streams from artificial transformations. Each model can be inspected separately before fusion, and reusable inference functions connect aggregate evaluation to recognizable sample-level outcomes.

The central research question is comparative: do independently trained models make sufficiently different errors for probability fusion to improve the held-out result? The notebook therefore preserves architecture size, checkpoint identity, evaluation calls, sample predictions, and fusion code. A companion experiment supplies the stated baseline and ensemble figures, and the public notebook carries its own note about a three-model comparison; the two are reported separately because they describe different comparisons.

## Results

The companion experiment reports that probability ensembling improved held-out accuracy from 78 percent for the single-model baseline to 85 percent for the ensemble, a seven-percentage-point gain. The public notebook also includes a written note of a 13 percent gain for its three-model ensemble. That note describes a different comparison and does not state its baseline, so the seven-point result is the one to cite.

The retained outputs also verify the complete data volume, four-class label set, partition sizes, input shape, model parameter counts, and executable fusion path. Together they show the full experimental system behind the accuracy result.

## Iterative improvement

A single CNN provided a useful baseline but retained uncertainty between visually adjacent categories. Instead of only increasing one model's capacity, Neerav trained and saved architecturally different variants, then inspected their probability distributions. The engineering response was a reusable fusion path that loads independent checkpoints into one evaluable graph. On the companion held-out comparison, that change produced the recorded seven-point gain.

The notebook also evolved from aggregate accuracy toward sample-level error review. Class-and-confidence grids make failure patterns visible and support later questions about class imbalance, calibration, or scanner differences. Weighted fusion is retained as an explicit exploration for a future matched evaluation.

## Impact

The work shows Neerav's ability to build a complete machine-learning experiment, from data discovery to evaluated fusion. Researchers and reviewers can trace the result through data discovery, preprocessing, architecture, checkpoints, inference, and fusion. The probability-level approach also demonstrates a practical way to use model diversity when neighboring categories are difficult to separate. Its strongest value is the combination of executable evidence, interpretable comparison, and disciplined separation between recorded results and further hypotheses.

## Scope

This is retrospective research on existing scans, the standard first stage before clinical studies. A clinical validation program would add subject-level partition manifests, repeated-seed and class-wise statistics, external scanner data, calibration, and clinical review.

## Approved page targets and links

Use the approved target and link metadata in this record's front matter for page actions; it is not narrative content.
