# Alzheimer's MRI research: film plan (one film for both case studies)

Slug `alzheimers-research`. It replaces the two separate films (`alzheimers-disease-research`, `brain-atrophy-computer-vision`) and is embedded on both case-study pages. Runtime target 75–85 s · palette: deep navy, MRI greys, one warm accent for measured tissue.

## Story

1. **What the disease does to an image.** Atrophy shows on MRI as wider ventricles, deeper sulci, and a smaller hippocampus.
2. **The ensemble classifier (first study).**
   - Custom CNNs are built at different depths and widths and tuned across batch normalisation, dropout, ReLU and leaky ReLU, and dense heads of 256, 512 and 1,024 units.
   - The variants develop different strengths: some lead on accuracy, others keep false positives low.
   - Averaging their class probabilities combines those strengths. Accuracy rises from 78% to 85%, and fewer crucial cases are missed.
3. **The computer-vision study goes a step further.** It asks where in the brain dementia shows itself most, and measures that directly. An OpenCV colour mask counts dark fluid (b) against white and grey tissue (w + g), giving dem = b / (w + g).
   - Group averages set the bounds: 0.41 for non-demented, 0.83 for demented.
   - Hippocampal cross-sections raise accuracy from 66% to 71%.
   - The change across repeat scans gives an automated atrophy rate.
4. **Why the pair matters.** The classifier says which stage. The published method shows where, and how much.

## Draft narration (≈180 words)

1. Alzheimer's disease leaves a visible trace on MRI: wider ventricles, deeper folds and a shrinking hippocampus.
2. The research began with a classifier for 6,400 ADNI brain scans across four stages of dementia.
3. Custom CNNs were built at different depths and widths, and tuned across batch normalisation, dropout, and ReLU and leaky-ReLU activations.
4. The variants learned different strengths: some led on accuracy, others on keeping false positives low.
5. An ensemble averages their class probabilities, so one model's strength covers another's misses, and accuracy rose from 78 to 85 percent.
6. The next study asked where the disease shows itself most, and measured it directly.
7. With OpenCV, each scan is separated by colour into dark fluid and white and grey tissue.
8. The ratio of fluid to tissue becomes one atrophy score, dem.
9. Across 2,198 labelled scans, it averaged 0.41 in healthy brains and 0.83 in dementia; this mildly demented scan scores 0.60.
10. Focusing on hippocampal cross-sections raised accuracy from 66 to 71 percent.
11. Repeated on later scans, the change in the score becomes an automated rate of atrophy.
12. Published at IEEE ICRITO, the method shows where the disease is advancing and by how much.

## Shot list

| Time (s) | Beat | Picture | Source |
|---|---|---|---|
| 0–3 | Sting | Title over a slow MRI slice | real notebook scan |
| 3–10 | The trace | Paper Fig. 4 (normal vs dementia) with callouts on ventricles, sulci and hippocampus as each is named | real paper figure |
| 10–17 | Dataset | Notebook 12-scan labelled montage builds tile by tile; counter to 6,400; four class chips | real notebook output 1 |
| 17–27 | Specialists | The real visualkeras CNN diagram (notebook output 4) splits into **A1 Specialist CNNs**: three towers at different depths and widths (two labelled with their real counts, 2,114,756 and 491,524 parameters). Hyperparameter chips (BatchNorm · Dropout 0.3 · ReLU · LeakyReLU · Dense 256/512/1,024) flicker across them as they are tuned. Each tower gets a strength tag: "accuracy" or "fewer false positives" | real diagram, real counts and settings; strength tags from the owner's account |
| 27–35 | Ensemble | **A2 Probability average**: one real scan feeds every tower. Their probability bars (marked "schematic") average into one confident bar. A bar chart then draws 78% → 85% | numbers real; bars schematic |
| 35–41 | The question | The class chip on the scan fades and the tissue starts to glow; the question appears as kinetic type | designed |
| 41–45 | The paper | The paper's first page slides in (title, ICRITO 2022 header) | real paper page 1 |
| 45–56 | Method | **A3 Colour mask**: the paper's Fig. 6 scan, with the paper's black, white and grey ranges applied as an animated mask (fluid in accent, tissue in grey). The equation dem = b/(w+g) writes on from the paper crop | real image, real ranges; animation labelled "method illustration" |
| 56–64 | Scores | **A4 dem scale**: a 0–1 line with ticks at 0.41 and 0.83 and a marker sliding to 0.60, which hands over to the real Fig. 7 scatter with its bounds | real numbers; real figure |
| 64–70 | Crop | Default crop vs hippocampal crop side by side on the same scan; the Table II accuracies count up from 66 to 71 | real table; crops cut from the paper figure |
| 70–75 | Rate | The atrophy-rate equation writes on (paper eq. 4) | real paper crop |
| 75–83 | Close | Both studies side by side (notebook montage + paper page), then the end card | real |

## Visual inventory

**Sourced:**
- notebook outputs 1–4 (`public/uploads/alzheimers/notebook-output-*.png`);
- paper pages 1–4 (`projects/brain-atrophy-computer-vision/captures/repository/paper-page-*.png`), which are crops of Fig. 1–7, Table I, Table II, and eq. 1–4;
- the notebook (`AZclassification5(wide).ipynb`) for parameter counts and the class order.

**Designed:**
- A1 specialist CNNs (towers, hyperparameter chips, strength tags);
- A2 probability average (schematic bars with no numbers);
- A3 colour-mask animation on the paper's own scan, using the paper's colour ranges (no new score is shown);
- A4 dem scale.

## Fact ledger

| Fact | Source |
|---|---|
| 6,400 images, 4 classes, 5,120/640/640, 256×256 | notebook |
| 2,114,756 and 491,524 parameters | notebook model summaries |
| 78% → 85% companion ensemble experiment | portfolio case study (`content/projects/alzheimers-disease-research.json`) |
| 2,198 images (1,172 CDR 0 / 1,026 CDR 0.5–2) | paper Table I |
| dem = b/(w+g); bounds 0.41 / 0.83; Fig. 6 scan 0.60 | paper eq. 1–3, Fig. 6, Fig. 7 |
| 66% → 71% hippocampal crop | paper Table II |
| atrophy rate = (dem_final − dem_initial) / time | paper eq. 4 |

## Open questions

1. **Per-model strengths.** This notebook copy keeps the evaluation calls but not their outputs, so it has no per-model accuracy or false-positive numbers. The film states the specialisation in words. Do you have the saved evaluations or confusion matrices (e.g. on Drive)? If so, A1 can show each model's real figure, and the "fewer misses" claim can carry its number.
2. **Wording.** The narration says "an ensemble of specialist CNNs" and avoids "mixture of experts". To ML reviewers, mixture of experts implies a learned gate that routes each input; this notebook averages, with a fixed-weight variant. The idea of combining expertise comes through either way.
