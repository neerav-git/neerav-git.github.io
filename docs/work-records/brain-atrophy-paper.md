# Analyzing Brain Atrophy in Dementia Using Computer Vision

## Record status and publication identity

This is a full-paper work record based on a complete reading and visual inspection of all five pages of the IEEE conference paper, including its two tables, seven figures, four equations, and fourteen references. It is evidence for a later portfolio copy pass, not public-site copy.

Neerav Chaudhary and Sourabh Singh Verma authored "Analyzing Brain Atrophy in Dementia Using Computer Vision" while affiliated with the Department of Computer and Communication Engineering at Manipal University Jaipur. The paper was presented in the 2022 10th International Conference on Reliability, Infocom Technologies and Optimization (Trends and Future Directions), held at Amity University in Noida, India, on October 13-14, 2022. IEEE added the record to Xplore on December 8, 2022. Its DOI is [10.1109/ICRITO56286.2022.9964994](https://doi.org/10.1109/ICRITO56286.2022.9964994). The downloaded paper is five pages long and numbers those pages 1-5 internally; the conference table of contents places it at proceedings pages 1234-1238.

The work is best described as an interpretable medical-image analysis experiment. It converts intensity information from T1-weighted brain MRI images into a simple quantitative score, called `dem`, that is intended to represent visible tissue loss relative to dark regions associated with cerebrospinal fluid, sulcal widening, and ventricular expansion. The study then derives lower and upper reference bounds from labeled image groups, tests the score as a dementia classification signal, and compares a whole-brain/default crop with a hippocampal crop. The reported result is a five-percentage-point accuracy improvement, from 66% with the default crop to 71% with the hippocampal crop.

## The human and research problem

Dementia is not a single visual event. It is a progressive condition whose effects can appear as structural changes in the brain alongside declining memory, motor function, language, reasoning, and other cognitive abilities. The paper focuses on a concrete imaging problem inside that larger clinical context: researchers need a way to track and quantify atrophy, but established manual tracing and segmentation workflows require expert labor, take substantial time, and can be difficult to reproduce consistently across large image sets.

The paper identifies several structural patterns associated with dementia research: thinning of the cerebral cortex, reductions in subcortical volume, widening of the sulci, shrinkage of the gyri, ventricular expansion, hippocampal tissue loss, and white-matter lesions. Some structural change is expected in normal aging, so the research challenge is not merely to find any atrophy. It is to create consistent measurements that can help compare cognitively normal and cognitively impaired images and, eventually, measure change over time.

That framing matters because it turns a broad aspiration such as "use AI for dementia" into an operational question: can a repeatable computer-vision pipeline extract a transparent, image-level measurement from MRI scans without requiring an expert to trace every region by hand? The study's target is the expensive measurement step. It is not presented as a complete clinical diagnostic system.

## The implemented research contribution

The main contribution is a Python/OpenCV-style image-processing method that reduces each MRI image to interpretable pixel-density measurements and combines them into a ratio. Instead of training an opaque end-to-end neural network, the method uses explicit color thresholds and an explicit equation. A reader can follow the transformation from image to binary masks, from masks to pixel percentages, from percentages to the `dem` score, and from scores to classification regions.

The system uses three intensity categories:

- black, represented as `[0, 0, 0]` and denoted `b`;
- white, represented as `[255, 255, 255]` and denoted `w`;
- grey, represented by a channel-wise interval bounded by `[70, 70, 70]` and `[190, 190, 190]`, denoted `g`.

For each color interval, the algorithm creates a binary mask. Pixels within the interval are marked as 1 and pixels outside it as 0. Counting the selected pixels and dividing by the relevant image area yields the percentage assigned to each category. The first measurement equation is:

```text
dem = b / (w + g)
```

The numerator treats dark area as a proxy for the cerebrospinal-fluid and open-space patterns that increase with ventricular expansion and sulcal widening. The denominator treats white and grey pixels as a proxy for retained brain tissue. A higher `dem` value therefore means more dark area relative to visible tissue and, under the paper's model, a greater likelihood or extent of atrophy associated with dementia.

The score is deliberately simple. That simplicity is useful: every output can be traced back to pixel counts and a published equation. It also makes image preparation and cropping consequential. Black background outside the brain can influence the numerator unless the image is consistently framed; focusing the analysis on a clinically relevant area can reduce irrelevant pixels and make the signal more specific. The study's whole-brain versus hippocampal-crop result is evidence that region selection materially affects this handcrafted measure.

## Dataset and study design

The study uses T1-weighted MRI images from the Alzheimer's Disease Neuroimaging Initiative (ADNI). In T1-weighted scans, the paper describes outer grey matter as darker than inner white matter, while cerebrospinal fluid appears dark. Those contrast properties are what make the color-mask approach possible.

Table I reports 2,198 images divided into two analysis groups:

- 1,172 images with Clinical Dementia Rating (CDR) score 0, labeled cognitively normal or non-demented;
- 1,026 images with CDR scores 0.5-2, grouped as cognitive impairment or dementia.

The unit reported by the paper is images, not unique people. The paper does not state how many subjects produced those images, whether multiple slices or visits from the same subject appear in both development and evaluation data, or how the images were split for model development and accuracy calculation. Therefore, 2,198 is a verified image count, not a verified patient count.

Figures 1-3 visually establish the spectrum the method is meant to analyze: an axial MRI labeled cognitively normal, an image labeled mild cognitive impairment, and an image labeled Alzheimer's disease/dementia. Figure 4 adds a schematic comparison showing wider sulci, smaller gyri, and enlarged ventricles in a demented brain. The figures do more than decorate the paper: they connect the pixel-ratio design to a specific anatomical story. More dark space and less visible tissue should increase `b / (w + g)`.

The study combines two related experiments. First, it evaluates the `dem` score as an image-level signal for separating labeled groups. Second, it tests whether narrowing the analysis to a hippocampal crop improves classification accuracy compared with the default crop. It also defines a longitudinal atrophy-rate equation for multiple scans of the same subject, but it does not report a paired longitudinal cohort or a measured longitudinal result in the Results section. The longitudinal calculation is therefore an implemented methodological extension described by the paper, while the published accuracy results are image-classification results.

## End-to-end workflow

The research workflow can be reconstructed as seven stages.

1. **Select and label MRI images.** T1-weighted ADNI images are organized using their diagnostic/CDR grouping: CDR 0 for cognitively normal and CDR 0.5-2 for cognitive impairment/dementia.

2. **Choose the analysis region.** The study evaluates a default crop and a crop around the hippocampus. This is a meaningful design decision because hippocampal shrinkage is associated with memory impairment and dementia progression, and a tighter crop changes the balance between anatomical pixels and irrelevant background.

3. **Generate binary masks.** OpenCV color detection is applied separately for black, white, and grey intensity ranges. The masks transform continuous image appearance into countable pixel sets.

4. **Calculate pixel densities.** The pipeline counts pixels selected by each mask and expresses them as percentages `b`, `w`, and `g`.

5. **Calculate the image-level atrophy proxy.** The pipeline computes `dem = b / (w + g)`. The output is a continuous score rather than only a class label. Figure 6 shows a mildly demented scan with a calculated `dem` value of 0.60.

6. **Derive group bounds and classify.** The mean `dem` for the labeled dementia images becomes the upper reference bound:

```text
dem_high = sum(dem for demented images) / total demented images
```

The mean `dem` for the non-demented images becomes the lower reference bound:

```text
dem_low = sum(dem for non-demented images) / total non-demented images
```

The methodology defines three regions: below `dem_low` is non-demented; at or above `dem_high` is dementia; and values between the two bounds are intermediate or undetermined, with likelihood interpreted by proximity to the bounds. This third region is notable because the system does not force every image into a confident binary answer.

7. **Optionally calculate change over time.** For repeated scans of the same subject, the paper defines:

```text
atrophy rate = (dem_final - dem_initial) / time interval
```

This final equation turns the image-level score into a longitudinal rate. It supplies a direct route from consistent scan processing to temporal measurement, although the paper's Results section does not present longitudinal rate statistics.

Figure 5 summarizes the computational pipeline as image input, binary-mask generation for black/white/grey ranges, pixel-density extraction, and atrophy-rate calculation. It is a compact, reproducible architecture with few moving parts: MRI image, region crop, threshold masks, counts, ratio, cohort bounds, and optional time normalization.

## Results and strongest evidence

The results section reports that the model correctly classified some images as demented or non-demented and left others undetermined. That behavior is consistent with the three-region decision rule rather than a forced binary classifier. The authors observed a correlation between higher `dem` values and dementia labels.

Three quantitative results anchor the paper:

- A worked mildly demented MRI example produced `dem = 0.60`.
- The group-derived lower bound `dem_low` was 0.41, and the upper bound `dem_high` was 0.83.
- Accuracy was 66% with the default crop and 71% with the hippocampal crop, a five-percentage-point absolute improvement.

Figure 7 plots image-level `dem` values against the two horizontal bounds. The plot makes the decision logic inspectable: low scores fall below the green lower line, high scores exceed the brown upper line, and intermediate cases occupy the area between them. The Results prose contains one imprecise sentence saying images "above the lower bound" are classified as demented; the formal methodology directly above it says dementia begins at or above the upper bound, with the region between bounds treated as varying likelihood. The formal three-region definition is the coherent rule and should be used when describing the system.

Table II reports the 66% and 71% crop comparison. Its leftmost column is titled "CDR Score" and contains 1 and 2, while the accompanying prose describes the rows as a comparison between default and hippocampal crops. The defensible result is the crop/accuracy pairing. The table does not provide enough information to claim class-specific accuracy by CDR stage.

The paper also concludes that the process is time-efficient relative to manual tracing, but it does not report elapsed time, expert-hours saved, or a controlled timing comparison. A strong portfolio statement can say that the pipeline automates pixel measurement and avoids manual tracing inside this analysis; it should not attach a percentage or number of hours to the efficiency gain.

## Why the work is technically notable

The project is notable first for turning an anatomical hypothesis into an auditable computation. The research narrative is not "a model found a pattern." It specifies which visual changes matter, how those changes map to intensity categories, how the categories become a numerical feature, and how the feature becomes a decision region. That chain makes the system easier to explain, debug, and challenge than an end-to-end prediction with no explicit measurement model.

Second, the work tests spatial focus rather than assuming that more image area is always better. The hippocampal crop improved reported accuracy from 66% to 71%. This supports the practical insight that clinically motivated region selection can improve a simple vision pipeline by reducing irrelevant image content and concentrating measurement on anatomy associated with memory and dementia. The experiment also exposes an important engineering truth: preprocessing is part of the model. A different crop changes the pixel distribution, which changes `dem`, which changes classification.

Third, the system provides a continuous, reusable intermediate representation. The `dem` score can be plotted, averaged by group, bounded into classes, or compared across time. That is more useful for research iteration than a single terminal label because it lets an investigator inspect how far an image lies from group references and see how a processing change affects the measurement.

Fourth, the pipeline is computationally modest. Binary masks, pixel counts, ratios, and cropping can run without a large learned model. That makes the approach suitable as a transparent baseline, a teaching tool, or a quick screening experiment before investing in heavier segmentation and deep-learning systems. The paper does not establish deployment performance, but it does demonstrate a complete research loop from clinical observation to engineered feature to empirical comparison.

## Who benefits and what effort it reduces

The immediate beneficiaries are medical-imaging researchers and students working with large collections of MRI images. The pipeline converts a visual review task into repeatable operations, allowing the same thresholds and equations to be applied across images rather than asking an expert to redraw every boundary. It can accelerate hypothesis testing about which regions, crops, or intensity rules carry useful signal.

Researchers studying longitudinal imaging could also benefit from the defined rate equation. Once scans are consistently aligned, cropped, and processed, the same score can be compared across time points. The contribution is the measurement mechanism and its temporal extension, not proof that the resulting rate is a validated clinical biomarker.

Clinical and radiology teams are potential downstream beneficiaries only after substantially stronger validation. A transparent quantitative feature might eventually support review by highlighting change or prioritizing cases, but the paper does not establish safety, sensitivity, specificity, external generalization, or patient-care outcomes. The current work should be framed as retrospective imaging research that reduces analysis friction, not as an autonomous diagnosis or treatment recommendation.

Software and ML practitioners also benefit from the methodology as an example of interpretable feature engineering. It shows how domain knowledge can guide region selection and how an uncertain middle region can be preserved instead of forcing confidence. These ideas transfer to other image-analysis tasks even when the exact thresholds and `dem` equation do not.

## Authorship and role attribution

Neerav Chaudhary is the paper's first author; Dr. Sourabh Singh Verma is the second author. Both are credited by IEEE and listed with the same Manipal University Jaipur department affiliation. The publication itself does not include a contributor-role taxonomy, so it supports co-authorship but not a detailed division of writing, study design, coding, or supervision.

Neerav's portfolio source ledger and resume provide narrower role corroboration: he built a repeatable Python/OpenCV pipeline for MRI preprocessing and brain-atrophy quantification, converting scans into consistent structural measurements and supporting the published IEEE study. That is a strong, concrete individual contribution. The paper's overall research design, interpretation, and publication outcome should continue to be attributed to both authors unless additional contributor records establish a more specific split.

## Research lineage

The fourteen references show that the work was situated at the intersection of dementia research, neuroanatomy, segmentation practice, and image-processing implementation. References 1-7 establish neurochemical and structural change, the value of early intervention, treatment context, cortical/subcortical atrophy, white-matter dementia, and language/cognitive impact. References 8-13 ground the hippocampus, manual hippocampal segmentation, semi- and fully automated segmentation, reproducibility of atrophy-rate algorithms, ADNI clinical characterization, and sulcal-span changes. Reference 14 supports the use of Python/OpenCV color detection.

This reference structure is important to the work's credibility. The authors did not choose a color ratio arbitrarily: the ratio is motivated by visible structural features described in the literature, and the hippocampal crop is connected to an anatomical region already central to dementia research.

## Claim ledger

### Measured and directly reported

- The analyzed dataset contained 2,198 ADNI T1-weighted MRI images: 1,172 CDR 0 images and 1,026 CDR 0.5-2 images.
- The system generated black, white, and grey binary masks, calculated pixel percentages, and computed `dem = b / (w + g)`.
- The reported lower and upper group bounds were 0.41 and 0.83.
- A displayed mildly demented scan produced a `dem` value of 0.60.
- The reported accuracy was 66% for the default crop and 71% for the hippocampal crop.
- The paper is a five-page, two-author IEEE ICRITO 2022 conference publication with DOI `10.1109/ICRITO56286.2022.9964994`.

### Directly verified capability or contribution

- The workflow automates mask generation, pixel-density measurement, score calculation, and bound-based classification for MRI images.
- The method preserves an intermediate/undetermined region between the group means rather than forcing every score into one of two confident classes.
- The paper defines a longitudinal atrophy-rate calculation based on change in `dem` divided by elapsed time.
- Neerav co-authored the paper and, according to his resume and the portfolio evidence ledger, built the repeatable Python/OpenCV preprocessing and quantification pipeline.

### Supported interpretation

- The method is interpretable because its prediction signal is an explicit ratio of observable pixel categories.
- The crop experiment indicates that anatomically targeted preprocessing can improve this particular handcrafted signal.
- The system can reduce repeated manual measurement effort in a research workflow, although the size of the time saving was not measured.
- The `dem` score is useful as a research feature or baseline, not established as a clinical biomarker.

### Not established by the paper

- A unique patient count, subject-level train/test split, external validation cohort, or prospective clinical study.
- Sensitivity, specificity, precision, recall, F1, confidence intervals, statistical significance, or a confusion matrix.
- Accuracy against expert manual segmentations or a timing benchmark against expert tracing.
- A reported longitudinal experiment with paired scans and observed atrophy-rate outcomes.
- Generalization across scanners, acquisition protocols, institutions, demographic groups, or MRI modalities.
- Safety or effectiveness for clinical diagnosis, prognosis, triage, or treatment selection.

These boundaries do not erase the contribution. They define it accurately: a published, interpretable computer-vision study that operationalized MRI atrophy cues, evaluated crop-dependent classification, and produced a reusable quantitative framework for further research.

## Exact source map

- **Full paper, local copy:** `/Users/neeravch/Downloads/Analyzing_Brain_Atrophy_in_Dementia_Using_Computer_Vision.pdf` (SHA-256 `b487524b46b0a681c85709f795f106653ef9ba5ec111cf0d868af62619f2a71b`).
  - Page 1: title, authors and affiliation; abstract; keywords; clinical and anatomical motivation; manual-segmentation problem; OpenCV research question; literature context.
  - Page 2: Methodology overview; ADNI and T1-weighted image description; Table I image counts and CDR grouping; Figures 1-3; implementation rationale; black, white, and grey pixel interpretation.
  - Page 3: Figure 4 anatomical comparison; Figure 5 pipeline; RGB thresholds; Equation 1 (`dem`); Equations 2-3 (group means/bounds); three-region classification rule.
  - Page 4: Equation 4 (atrophy rate); Results and Analysis; Figure 6 (`dem = 0.60` example); Figure 7 bounds and score plot; Table II crop accuracies; Conclusion; references 1-7.
  - Page 5: references 8-14.
- **Canonical publication record:** [IEEE DOI landing page](https://doi.org/10.1109/ICRITO56286.2022.9964994), used for DOI, conference identity, authorship, conference dates/location, and Xplore publication date.
- **Proceedings table of contents:** [ICRITO 2022 table of contents](https://www.proceedings.com/content/066/066730webtoc.pdf), used for proceedings pagination 1234-1238 and neighboring-paper sequence.
- **Portfolio evidence ledger:** `docs/CONTENT_SOURCE_LEDGER.md`, Brain atrophy publication section, used to corroborate the intended portfolio boundary and resume source.
- **Resume corroboration:** `public/uploads/references/Resume_Neerav_Chaudhary.pdf`, used only for Neerav's individual implementation role: the repeatable Python/OpenCV MRI preprocessing and brain-atrophy quantification pipeline.
- **Existing project record:** `content/projects/brain-atrophy-computer-vision.json`, used to identify current portfolio framing and to ensure the paper remains distinct from the later four-class TensorFlow/CNN ensemble notebook.
- **Existing publication archive record:** `content/archive/alzheimers-disease-ieee-record.json`, used to cross-check the public citation and separation from the later classification study.
