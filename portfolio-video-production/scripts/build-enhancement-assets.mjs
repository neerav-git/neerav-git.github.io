import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const W = 1600;
const H = 900;
const SANS = "Avenir Next, Helvetica Neue, Arial";
const MONO = "Menlo, SF Mono, Courier New";

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function svg(body, accent) {
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111b26"/><stop offset="1" stop-color="#080d14"/></linearGradient>
      <linearGradient id="accent" x1="0" x2="1"><stop stop-color="${accent}" stop-opacity=".95"/><stop offset="1" stop-color="${accent}" stop-opacity=".25"/></linearGradient>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${accent}"/></marker>
    </defs>
    <rect width="${W}" height="${H}" rx="30" fill="url(#bg)"/>
    <rect x="0" y="0" width="${W}" height="8" rx="4" fill="url(#accent)"/>
    ${body}
  </svg>`);
}

function text(x, y, value, size = 34, color = "#f4f6f8", weight = 600, anchor = "start", family = SANS) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`;
}

function panel(x, y, width, height, fill = "#111923") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="24" fill="${fill}" stroke="#314154" stroke-width="2"/>`;
}

function paperCard(x, y, width, height) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="24" fill="#f7f5f1"/>`;
}

function card(x, y, width, height, label, value, accent, valueSize = 50) {
  return `${panel(x, y, width, height, "#172331")}
    ${text(x + 28, y + 42, label.toUpperCase(), 18, accent, 700)}
    ${text(x + 28, y + 42 + valueSize + 18, value, valueSize, "#f7f4ee", 700)}`;
}

// Builds a plate from an SVG layout plus raster crops placed at fixed positions.
async function plate(file, body, accent, layers = []) {
  const composite = await Promise.all(layers.map(async (layer) => ({
    input: await layer.image,
    left: layer.left,
    top: layer.top,
  })));
  await sharp(svg(body, accent)).composite(composite).png().toFile(file);
}

// Crops a source region and fits it into a box, centered on a matching background.
async function fit(source, region, width, height, background = "#f7f5f1") {
  const image = await sharp(source).extract(region).resize(width, height, { fit: "inside" }).png().toBuffer();
  const meta = await sharp(image).metadata();
  return sharp({ create: { width, height, channels: 4, background } })
    .composite([{ input: image, left: Math.round((width - meta.width) / 2), top: Math.round((height - meta.height) / 2) }])
    .png()
    .toBuffer();
}

/* Brain atrophy: every raster below is an exact crop of the published IEEE paper. */
const brainAccent = "#83c5be";
const brainDir = path.join(root, "projects", "brain-atrophy-computer-vision", "captures", "designed");
const paper = (page) => path.join(root, "projects", "brain-atrophy-computer-vision", "captures", "repository", `paper-page-${page}.png`);
await mkdir(brainDir, { recursive: true });

const mriFigures = [
  { label: "COGNITIVELY NORMAL", caption: "Fig. 1", region: { left: 291, top: 1002, width: 293, height: 346 } },
  { label: "MILD COGNITIVE IMPAIRMENT", caption: "Fig. 2", region: { left: 292, top: 1414, width: 291, height: 345 } },
  { label: "DEMENTIA", caption: "Fig. 3", region: { left: 943, top: 136, width: 295, height: 349 } },
];
await plate(path.join(brainDir, "anatomical-problem-plate.png"), `
  ${text(70, 88, "ADNI T1-WEIGHTED MRI", 20, brainAccent, 700)}
  ${text(70, 142, "Atrophy is visible, yet hard to measure at scale", 42)}
  ${text(70, 184, "Representative axial slices from the published study.", 24, "#aeb8c5", 400)}
  ${mriFigures.map((figure, i) => `${panel(70 + i * 505, 230, 450, 560, "#05070a")}
    ${text(295 + i * 505, 755, figure.label, 19, "#dce4eb", 700, "middle")}`).join("")}
  ${text(70, 850, "Source: Chaudhary & Verma, IEEE ICRITO 2022, Figs. 1–3", 18, "#7f8b99", 500)}
`, brainAccent, mriFigures.map((figure, i) => ({
  image: fit(paper(2), figure.region, 380, 450, "#000000"),
  left: 105 + i * 505,
  top: 262,
})));

await plate(path.join(brainDir, "hypothesis-plate.png"), `
  ${text(70, 88, "ANATOMICAL HYPOTHESIS", 20, brainAccent, 700)}
  ${paperCard(60, 130, 760, 690)}
  ${panel(880, 130, 660, 690)}
  ${text(940, 215, "Tissue loss changes the image", 32)}
  ${[
    ["Widened sulci", "More dark space between tissue folds"],
    ["Ventricular expansion", "Larger dark CSF regions at the centre"],
    ["Gyral shrinkage", "Less white and grey brain tissue"],
  ].map(([title, body], i) => `<circle cx="958" cy="${300 + i * 130}" r="9" fill="${brainAccent}"/>
    ${text(990, 310 + i * 130, title, 29, "#f7f4ee", 650)}
    ${text(990, 350 + i * 130, body, 23, "#aeb8c5", 400)}`).join("")}
  <path d="M940 670 H1480" stroke="#314154" stroke-width="2"/>
  ${text(940, 728, "Black pixels track CSF and widened space;", 23, "#d8dee7", 500)}
  ${text(940, 764, "white and grey pixels track remaining tissue.", 23, "#d8dee7", 500)}
  ${text(70, 860, "Source: IEEE ICRITO 2022, Fig. 4 · Structural comparison of normal and demented brain", 18, "#7f8b99", 500)}
`, brainAccent, [{ image: fit(paper(3), { left: 160, top: 150, width: 600, height: 440 }, 700, 630), left: 90, top: 160 }]);

await plate(path.join(brainDir, "method-plate.png"), `
  ${text(70, 84, "THE OPENCV MODEL", 20, brainAccent, 700)}
  ${paperCard(60, 120, 470, 720)}
  ${panel(600, 120, 940, 720)}
  ${text(660, 205, "Binary masks for three RGB intensity regions", 30)}
  <circle cx="680" cy="275" r="20" fill="#0b0b0d" stroke="#657184" stroke-width="2"/><circle cx="680" cy="345" r="20" fill="#f4f4ef"/><circle cx="680" cy="415" r="20" fill="#7d858e"/>
  ${text(725, 285, "Black  b", 26, "#f7f4ee", 650)}${text(960, 285, "[0, 0, 0]", 25, "#aeb8c5", 500, "start", MONO)}
  ${text(725, 355, "White  w", 26, "#f7f4ee", 650)}${text(960, 355, "[255, 255, 255]", 25, "#aeb8c5", 500, "start", MONO)}
  ${text(725, 425, "Grey  g", 26, "#f7f4ee", 650)}${text(960, 425, "[70, 70, 70] – [190, 190, 190]", 25, "#aeb8c5", 500, "start", MONO)}
  <path d="M660 490 H1480" stroke="#314154" stroke-width="2"/>
  ${text(660, 560, "ATROPHY RATIO", 18, brainAccent, 700)}
  ${text(660, 660, "dem", 64, brainAccent, 700)}
  ${text(845, 660, "=", 58, "#d8dee7", 500)}
  ${text(1060, 620, "b", 54, "#f7f4ee", 650, "middle")}
  <path d="M900 645 H1220" stroke="${brainAccent}" stroke-width="4"/>
  ${text(1060, 705, "w + g", 50, "#f7f4ee", 650, "middle")}
  ${text(660, 790, "A higher dem value indicates more visible atrophy.", 24, "#aeb8c5", 400)}
`, brainAccent, [{ image: fit(paper(3), { left: 290, top: 948, width: 290, height: 695 }, 400, 680), left: 95, top: 140 }]);

await plate(path.join(brainDir, "cohort-plate.png"), `
  ${text(70, 84, "REFERENCE COHORT", 20, brainAccent, 700)}
  ${card(70, 125, 400, 160, "ADNI T1-weighted images", "2,198", brainAccent)}
  ${card(70, 315, 400, 160, "CDR 0 · non-demented", "1,172", brainAccent)}
  ${card(70, 505, 400, 160, "CDR 0.5–2 · impaired", "1,026", brainAccent)}
  ${text(70, 735, "Average dem per group sets", 24, "#d8dee7", 500)}
  ${text(70, 770, "the lower and upper bounds.", 24, "#d8dee7", 500)}
  ${paperCard(530, 125, 1010, 620)}
  <rect x="560" y="770" width="34" height="8" rx="4" fill="#a1553b"/>${text(608, 781, "dem_high = 0.83 · upper bound", 23, "#f7f4ee", 600)}
  <rect x="1020" y="770" width="34" height="8" rx="4" fill="#4caf50"/>${text(1068, 781, "dem_low = 0.41 · lower bound", 23, "#f7f4ee", 600)}
  ${text(70, 860, "Source: IEEE ICRITO 2022, Table I and Fig. 7 · dem values plotted against both bounds", 18, "#7f8b99", 500)}
`, brainAccent, [{ image: fit(paper(4), { left: 108, top: 1452, width: 625, height: 380 }, 960, 580), left: 555, top: 145 }]);

await plate(path.join(brainDir, "result-plate.png"), `
  ${text(70, 86, "ANATOMICAL CROP COMPARISON", 20, brainAccent, 700)}
  <rect x="60" y="125" width="560" height="620" rx="24" fill="#333333"/>
  ${panel(680, 125, 860, 620)}
  ${text(750, 280, "66%", 104, "#aeb8c5", 700)}
  ${text(1075, 272, "→", 80, brainAccent, 600)}
  ${text(1220, 280, "71%", 104, "#f7f4ee", 700)}
  ${text(750, 335, "DEFAULT CROP", 19, "#aeb8c5", 700)}
  ${text(1220, 335, "HIPPOCAMPAL CROP", 19, brainAccent, 700)}
  ${paperCard(740, 400, 740, 200)}
  ${text(750, 680, "Same dem measurement; anatomical focus raised accuracy.", 24, "#d8dee7", 500)}
  ${text(70, 800, "A mildly demented scan scores dem 0.60, between the cohort bounds.", 24, "#d8dee7", 500)}
  ${text(70, 860, "Source: IEEE ICRITO 2022, Fig. 6 and Table II", 18, "#7f8b99", 500)}
`, brainAccent, [
  { image: fit(paper(4), { left: 213, top: 699, width: 447, height: 462 }, 520, 580, "#333333"), left: 80, top: 145 },
  { image: fit(paper(4), { left: 762, top: 362, width: 620, height: 142 }, 700, 170), left: 760, top: 415 },
]);

const pipeline = [
  { label: "Hypothesis", region: { page: 3, left: 160, top: 150, width: 600, height: 440 } },
  { label: "Pixel masks", region: { page: 3, left: 295, top: 1190, width: 280, height: 185 } },
  { label: "Cohort bounds", region: { page: 4, left: 108, top: 1452, width: 625, height: 380 } },
  { label: "Crop comparison", region: { page: 4, left: 213, top: 699, width: 447, height: 462 } },
];
await plate(path.join(brainDir, "pipeline-plate.png"), `
  ${text(70, 84, "PUBLISHED, INTERPRETABLE PIPELINE", 20, brainAccent, 700)}
  ${paperCard(60, 115, 1480, 260)}
  ${pipeline.map((step, i) => `${paperCard(60 + i * 375, 430, 355, 300)}
    ${text(237 + i * 375, 775, step.label.toUpperCase(), 19, "#dce4eb", 700, "middle")}
    ${i < pipeline.length - 1 ? `<path d="M${420 + i * 375} 580 H${430 + i * 375}" stroke="${brainAccent}" stroke-width="4" marker-end="url(#arrow)"/>` : ""}`).join("")}
  ${text(70, 850, "IEEE ICRITO 2022 · DOI 10.1109/ICRITO56286.2022.9964994", 22, brainAccent, 600)}
`, brainAccent, [
  { image: fit(paper(1), { left: 80, top: 30, width: 1330, height: 250 }, 1420, 230), left: 90, top: 130 },
  ...pipeline.map((step, i) => ({
    image: fit(paper(step.region.page), step.region, 325, 270, step.label === "Crop comparison" ? "#333333" : "#f7f5f1"),
    left: 75 + i * 375,
    top: 445,
  })),
]);

/* Alzheimer classification: values and code below are taken from the retained notebook outputs. */
const alzAccent = "#c3a6ff";
const alzDir = path.join(root, "projects", "alzheimers-disease-research", "captures", "designed");
const alzSource = path.join(root, "projects", "alzheimers-disease-research", "captures", "repository");
await mkdir(alzDir, { recursive: true });

function consoleLines(x, y, lines) {
  return lines.map(([kind, value], i) => text(x, y + i * 44, value, 23,
    kind === "in" ? "#f7f4ee" : kind === "out" ? alzAccent : "#6f7c8d", kind === "in" ? 600 : 500, "start", MONO)).join("");
}

await plate(path.join(alzDir, "dataset-plate.png"), `
  ${text(70, 84, "DATASET AND SPLIT · NOTEBOOK OUTPUT", 20, alzAccent, 700)}
  ${panel(55, 125, 805, 720, "#0b1118")}
  <circle cx="95" cy="160" r="7" fill="#ff6b6b"/><circle cx="120" cy="160" r="7" fill="#f6c453"/><circle cx="145" cy="160" r="7" fill="#5ad17a"/>
  ${consoleLines(95, 225, [
    ["comment", "# image_dataset_from_directory(...)"],
    ["out", "Found 6400 files belonging to 4 classes."],
    ["in", "class_names"],
    ["out", "['MildDemented', 'ModerateDemented',"],
    ["out", " 'NonDemented', 'VeryMildDemented']"],
    ["in", "image_batch.shape"],
    ["out", "(64, 256, 256, 3)"],
    ["in", "len(train_ds), len(val_ds), len(test_ds)"],
    ["out", "(80, 10, 10)   # batches of 64"],
    ["comment", "# augmentation maps over train_ds only"],
  ])}
  ${card(930, 145, 570, 150, "Folder-labelled MRI images", "6,400", alzAccent)}
  ${card(930, 340, 260, 150, "Training", "80%", alzAccent)}
  ${card(1240, 340, 260, 150, "Validation", "10%", alzAccent)}
  ${card(930, 535, 260, 150, "Test", "10%", alzAccent)}
  ${card(1240, 535, 260, 150, "Input", "256²", alzAccent)}
  ${text(930, 760, "Flips, rotation, width, zoom, and height", 23, "#aeb8c5", 400)}
  ${text(930, 795, "augmentation apply to training batches.", 23, "#aeb8c5", 400)}
`, alzAccent);

const layers = [
  ["Conv2D 64 · MaxPool", "254² → 127²"],
  ["Conv2D 64 · MaxPool", "125² → 62²"],
  ["Conv2D 128 · MaxPool", "60² → 30²"],
  ["Conv2D 256 · MaxPool", "28² → 14²"],
  ["Conv2D 256 · MaxPool", "12² → 6²"],
  ["Conv2D 256 · MaxPool", "4² → 2²"],
  ["Dropout 0.3 · Flatten", "1,024"],
  ["Dense 512", "ReLU"],
  ["Dense 4", "softmax"],
];
await plate(path.join(alzDir, "model-plate.png"), `
  ${text(70, 84, "PRIMARY CNN · model.summary()", 20, alzAccent, 700)}
  ${paperCard(60, 120, 470, 720)}
  ${panel(590, 120, 950, 720)}
  ${layers.map(([name, shape], i) => {
    const y = 160 + i * 62;
    const head = i >= 6;
    return `<rect x="630" y="${y}" width="560" height="48" rx="12" fill="${head ? "#201b31" : "#172331"}" stroke="${head ? alzAccent : "#314154"}" stroke-width="${head ? 2 : 1.5}"/>
      ${text(655, y + 32, name, 22, "#f7f4ee", 600)}
      ${text(1170, y + 32, shape, 20, "#aeb8c5", 500, "end", MONO)}`;
  }).join("")}
  ${text(1230, 230, "6", 96, "#f7f4ee", 700)}
  ${text(1230, 270, "CONVOLUTION BLOCKS", 17, alzAccent, 700)}
  ${text(1230, 420, "2.11M", 72, "#f7f4ee", 700)}
  ${text(1230, 458, "TRAINABLE PARAMETERS", 17, alzAccent, 700)}
  ${text(1230, 492, "2,114,756", 20, "#aeb8c5", 500, "start", MONO)}
  ${text(1230, 640, "4", 96, "#f7f4ee", 700)}
  ${text(1230, 680, "CLASS SOFTMAX", 17, alzAccent, 700)}
`, alzAccent, [{ image: fit(path.join(alzSource, "notebook-output-4.png"), { left: 0, top: 0, width: 847, height: 1366 }, 420, 680, "#ffffff"), left: 85, top: 140 }]);

const classes = ["Mild", "Moderate", "Non", "VeryMild"];
const members = [
  ["new_model", "model3.0 · 491,524 params"],
  ["modelv1", "Models/1"],
  ["modelv2", "Models/2"],
];
await plate(path.join(alzDir, "ensemble-plate.png"), `
  ${text(70, 84, "PROBABILITY-LEVEL ENSEMBLE", 20, alzAccent, 700)}
  ${text(70, 140, "Three saved CNNs each return a full four-class softmax", 38)}
  ${members.map(([name, detail], i) => {
    const y = 200 + i * 170;
    return `${panel(70, y, 760, 140, "#172331")}
      ${text(100, y + 52, name, 26, "#f7f4ee", 700, "start", MONO)}
      ${text(100, y + 90, detail, 20, "#aeb8c5", 500)}
      ${classes.map((label, j) => `<rect x="${430 + j * 98}" y="${y + 30}" width="86" height="80" rx="10" fill="#0f1620" stroke="#3a4a5e"/>
        ${text(473 + j * 98, y + 64, "p", 22, alzAccent, 700, "middle", MONO)}
        ${text(473 + j * 98, y + 94, label, 15, "#aeb8c5", 600, "middle")}`).join("")}
      <path d="M830 ${y + 70} H930" stroke="${alzAccent}" stroke-width="4"/>`;
  }).join("")}
  <path d="M930 270 V610 M930 440 H1000" stroke="${alzAccent}" stroke-width="4" fill="none" marker-end="url(#arrow)"/>
  <rect x="1010" y="355" width="520" height="170" rx="26" fill="#201b31" stroke="${alzAccent}" stroke-width="3"/>
  ${text(1270, 425, "Average()", 44, "#f7f4ee", 700, "middle", MONO)}
  ${text(1270, 475, "mean of the three probability vectors", 21, "#d8dee7", 400, "middle")}
  <path d="M1270 525 V585" stroke="${alzAccent}" stroke-width="4" marker-end="url(#arrow)"/>
  ${text(1270, 640, "argmax → final class", 30, "#f7f4ee", 650, "middle")}
  ${panel(70, 715, 1460, 120, "#0b1118")}
  ${text(100, 765, "models3 = [new_model, modelv1, modelv2]", 22, "#d8dee7", 500, "start", MONO)}
  ${text(100, 805, "ensemble_output3 = tf.keras.layers.Average()(model_outputs3)", 22, alzAccent, 500, "start", MONO)}
`, alzAccent);

await plate(path.join(alzDir, "result-plate.png"), `
  ${text(70, 84, "HELD-OUT COMPANION EXPERIMENT", 20, alzAccent, 700)}
  ${panel(70, 150, 1460, 600, "#151e2b")}
  ${text(340, 385, "78%", 130, "#aeb8c5", 700, "middle")}
  ${text(800, 385, "→", 110, alzAccent, 600, "middle")}
  ${text(1260, 385, "85%", 130, "#f7f4ee", 700, "middle")}
  ${text(340, 455, "SINGLE MODEL", 22, "#aeb8c5", 700, "middle")}
  ${text(1260, 455, "PROBABILITY ENSEMBLE", 22, alzAccent, 700, "middle")}
  <path d="M220 545 H1380" stroke="#314154" stroke-width="2"/>
  ${text(800, 625, "+7 percentage points in held-out accuracy", 38, alzAccent, 700, "middle")}
  ${text(800, 685, "Full probability vectors are combined before the class decision.", 25, "#d8dee7", 400, "middle")}
`, alzAccent);

const progression = [
  { label: "Data", file: "notebook-output-1.png", background: "#ffffff" },
  { label: "Tensors", tensor: true },
  { label: "Architecture", file: "notebook-output-4.png", background: "#ffffff" },
  { label: "Prediction", file: "notebook-output-3.png", background: "#ffffff" },
  { label: "Ensemble", ensemble: true },
];
await plate(path.join(alzDir, "progression-plate.png"), `
  ${text(70, 84, "ONE REPRODUCIBLE NOTEBOOK", 20, alzAccent, 700)}
  ${text(70, 140, "Each stage of the experiment remains inspectable", 40)}
  ${progression.map((step, i) => {
    const x = 70 + i * 296;
    return `${step.tensor || step.ensemble ? panel(x, 220, 268, 420, "#0b1118") : paperCard(x, 220, 268, 420)}
      ${step.tensor ? `${text(x + 134, 400, "(64, 256,", 26, alzAccent, 600, "middle", MONO)}${text(x + 134, 440, "256, 3)", 26, alzAccent, 600, "middle", MONO)}${text(x + 134, 500, "batch tensor", 19, "#aeb8c5", 500, "middle")}` : ""}
      ${step.ensemble ? `${text(x + 134, 400, "Average()", 30, alzAccent, 600, "middle", MONO)}${text(x + 134, 450, "3 CNNs · 4 classes", 19, "#aeb8c5", 500, "middle")}` : ""}
      ${text(x + 134, 690, step.label.toUpperCase(), 19, "#dce4eb", 700, "middle")}
      ${i < progression.length - 1 ? `<path d="M${x + 272} 430 H${x + 290}" stroke="${alzAccent}" stroke-width="3" marker-end="url(#arrow)"/>` : ""}`;
  }).join("")}
  ${text(800, 790, "Data, tensors, architecture, predictions, model diversity, and ensemble probabilities.", 25, "#d8dee7", 400, "middle")}
`, alzAccent, await Promise.all(progression.filter((step) => step.file).map(async (step) => {
  const index = progression.indexOf(step);
  const meta = await sharp(path.join(alzSource, step.file)).metadata();
  return {
    image: fit(path.join(alzSource, step.file), { left: 0, top: 0, width: meta.width, height: meta.height }, 248, 400, step.background),
    left: 80 + index * 296,
    top: 230,
  };
})));

/* Refract */
const refractAccent = "#91a7ff";
const refractDir = path.join(root, "projects", "refract-ai", "captures", "designed");
await mkdir(refractDir, { recursive: true });

const tools = [
  ["PDF reader", 150, 250], ["Notes", 610, 205], ["AI chat", 1080, 250],
  ["Comparison doc", 150, 560], ["Notebook", 610, 610], ["Spreadsheet", 1080, 560],
];
await plate(path.join(refractDir, "fragmentation-plate.png"), `
  ${text(70, 88, "A RESEARCH ARGUMENT TODAY", 20, refractAccent, 700)}
  <path d="M520 300 L600 270 M990 270 L1070 300 M330 380 L330 540 M1260 380 L1260 540 M520 630 L600 660 M990 660 L1070 630"
    stroke="#56647a" stroke-width="3" stroke-dasharray="10 12" fill="none"/>
  ${tools.map(([name, x, y]) => `${panel(x, y, 370, 110, "#172331")}${text(x + 185, y + 68, name, 32, "#f7f4ee", 650, "middle")}`).join("")}
  <rect x="560" y="400" width="480" height="130" rx="24" fill="#1c2033" stroke="${refractAccent}" stroke-width="2" stroke-dasharray="8 8"/>
  ${text(800, 452, "claim ⟷ source page", 26, "#d8dee7", 600, "middle")}
  ${text(800, 497, "result ⟷ analytical decision", 26, "#d8dee7", 600, "middle")}
  ${text(800, 820, "Each hand-off between tools can detach evidence from the conclusion it supports.", 26, "#aeb8c5", 400, "middle")}
`, refractAccent);

await plate(path.join(refractDir, "evaluation-plate.png"), `
  ${text(70, 90, "STORED WORKFLOW VERIFICATION", 20, refractAccent, 700)}
  ${card(70, 165, 690, 240, "Reader and workspace UI checks", "9 / 9", refractAccent, 96)}
  ${card(840, 165, 690, 240, "Recall-first workflow checks", "8 / 8", refractAccent, 96)}
  ${text(70, 535, "Verified interactions", 26, "#dce4eb", 600)}
  ${text(70, 600, "PDF loading · passage selection · grounded answers · source badges", 25, "#aeb8c5", 400)}
  ${text(70, 650, "Index navigation · answer-before-reveal · stored recall state", 25, "#aeb8c5", 400)}
  ${text(70, 700, "Responsive layout checks at 1440 and 1024 pixels", 25, "#aeb8c5", 400)}
  <rect x="70" y="775" width="1460" height="4" fill="${refractAccent}" opacity=".55"/>
`, refractAccent);

console.log("Built scientific and product plates.");
