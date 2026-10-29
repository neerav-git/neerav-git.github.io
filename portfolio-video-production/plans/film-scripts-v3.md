# Film scripts v3: Homeward, TraceLens, Alzheimer's, Birb, Refract

Written 2026-10-28 to the standard the user set for Relay v3. The spine is need → idea (the whole product, full frame) → breadth → depth (one journey) → trust and proof → payoff. Every line has a reason, each film names the industry it serves and its workflow types, and the hero capability gets room.

Status: **revision 2** (2026-10-28), after the user's notes on Birb, Alzheimer's and TraceLens. Homeward and TraceLens were approved in principle (TraceLens with the new opening). Refract is unchanged apart from the detail pass and still awaiting comments.

**Detail pass (revision 3):** lines that explain how something is built, but not why it matters to the user, were cut from every film (the user's note on the Birb sync line). Nothing is captured or rendered until each script is approved.

External facts are shown on screen with a source chip. Everything else comes from the user's own repos, papers, thesis and runs.

## External sources (verified 2026-10-28)

| Fact | Source |
|---|---|
| 54 of 123 older patients (43.9%) with a scheduled follow-up could accurately recall its details after discharge | Horwitz et al., "Quality of Discharge Practices and Patient Understanding at an Academic Medical Center", *JAMA Internal Medicine* 2013 |
| 19.6% of Medicare patients were rehospitalized within 30 days | Jencks, Williams & Coleman, *NEJM* 2009;360:1418–28 |
| ChatGPT Health under-triaged 52% of physician-confirmed emergencies; explanatory text often recognized the danger while the recommendation delayed care | Ramaswamy et al., *Nature Medicine* 2026 (doi 10.1038/s41591-026-04297-7), cited in TraceLens's manuscript. Contested by a preprint (Fraile Navarro et al.) on test format. |
| 57 million people living with dementia (2021); Alzheimer's may contribute to 60–70% of cases | WHO dementia fact sheet |
| Birb's hearth inspiration from Stephen Fry's *Mythos* | The Birb Hangout about site, "Why I made it" |

---

## Homeward (~2:25)

**Industry:** hospital care transitions. **Users:** patients, caregivers and care teams. **Workflows:** follow-up visits, paperwork, recovery check-ins, lab instructions, clarification requests, reminders, record import and review.
**Hero capability:** a recovery plan where every step links to its source sentence, gaps stay marked as gaps, and the care team closes them.

| # | Picture | Narration | Why it's there |
|---|---|---|---|
| 0 | Alex's real discharge note, full page; each section lights as it's named | When patients leave hospital, their recovery arrives as a page of instructions: follow-up visits, paperwork, lab tests, warning signs and dates. | Names the industry and the workflow types in the first breath. |
| 1 | Kinetic stat over the note · source chip *JAMA Intern Med 2013* | In one study of older patients, fewer than half could recall the details of their scheduled follow-up visit. | Evidence that the instructions don't survive the trip home. |
| 2 | Stat · chip *NEJM 2009* | Almost one in five Medicare patients was back in hospital within 30 days. | The stakes, stated once. Homeward makes no readmission claim. |
| 3 | **Full-frame Homeward workspace** (plan, next step, assistant); wordmark | Homeward turns the discharge record into a recovery plan for patients, caregivers and the care team, with every step linked to the sentence it came from. | The idea in one line, over the whole product. |
| 4 | Tour: next-step card → task list with owners and dates → discharge summary → assistant → care-team queue | It shows the next step with its owner and date, keeps open questions apart from ready tasks, answers from the patient's own records, and gives the care team a queue of what needs clarifying. | Breadth: the four jobs it does. |
| 5 | Alex's four tasks; the lab item ringed, chips "No test named" / "No date given" | Alex has four tasks: a follow-up visit, paperwork, a recovery check-in, and a lab instruction that names no test and no date. | Starts the journey and plants the gap that drives it. |
| 6 | Click View source; the source passage opens | View source opens the exact sentence behind each step. | Hero capability, shown on the first click. |
| 7 | Ask "What paperwork should I bring?"; the cited answer lands | Alex asks what paperwork to bring, and the answer quotes the passage it came from. | Answers come from the record. |
| 8 | Need help on the lab item | The missing lab details stay marked as missing, and Alex asks the care team. | Uncertainty stays visible, and a person resolves it. |
| 9 | Care-team workspace: question beside the original instruction; reply saved; task still open | The care team sees the question next to the original instruction and replies, and the task stays open until the details are confirmed. | The care-team side of the product, and why it's safe. |
| 10 | Import review: new passage labelled Unreviewed → confirmed | New records arrive marked unreviewed, and become tasks only once the care team confirms them. | A second workflow: new information can't silently become an order. |
| 11 | Bell on the dated follow-up → approval dialog → Approve | The follow-up has a date, so a reminder is proposed and waits for Alex's approval. | Patient control over every action. |
| 12 | Diagram (schematic): router → four specialists, each with its tool list | Behind the assistant are four AI specialists, a coordinator, a summarizer, a questions guide and a reminder assistant, each given only the tools its job needs. | The agent architecture, named plainly. |
| 13 | Diagram continues: specialist returns references → Homeward rebuilds the text from the record | The specialists choose which records to cite, and Homeward rebuilds the wording from the record itself, so clinical instructions always appear in the record's own words. | Trust: the model never writes the clinical text. |
| 14 | Locked tiles: approve instruction · change medication · book appointment · send message | No agent can approve an instruction, change a medication or book an appointment; those decisions stay with people. | Trust: the limits on agent authority. |
| 15 | `npm run eval` terminal → in-app guardrail report | All 32 guardrail cases pass, from missing details and cross-patient requests to prompt injection. | Proof. |
| 16 | Alex's plan: next step, sources, open question, saved reminder → end card | After discharge, Alex knows what to do next, where each instruction came from, and what is still being clarified. | Payoff that answers line 1. |

**Capture:** a new `00-tour` chapter (workspace, discharge summary, care-team queue) and an import-review chapter on the seeded demo. Lines 6–12 reuse the existing journey chapters. The diagrams are labelled "Schematic". Live agent runs aren't claimed; the cited answer shown is source search.

---

## TraceLens (~2:35)

**Industry:** consumer health AI, and the teams that build and evaluate health chatbots. **Workflows:** emergency detection, disclosed reconsideration, preregistered studies on cloud GPUs, blinded review, detector training.
**Hero capability:** Vega, an independent model that reads only the person's message, catches emergencies the chatbot under-calls, and makes the disagreement visible.
**Spine:** the published failure → the project's question → one case → the answer (the product) → proof → the question answered.

| # | Picture | Narration | Why it's there |
|---|---|---|---|
| 0 | Kinetic type · chip *Nature Medicine 2026* | In a 2026 Nature Medicine study, ChatGPT Health under-triaged about half of the emergencies physicians agreed on, often describing the danger and still advising the person to wait. | Opens on the published failure (approved opener). |
| 1 | The question types on, word for word from the portfolio | General-purpose chatbots miss emergencies, or don't state them clearly to the patient. Can a supporting model both reduce under-triage and make failures transparent to the end user? | The project's research question, stated up front. |
| 2 | D1 chat (labelled "Illustrative interface · real model output"): the message types in | Here's one case: a friend spent an hour in a hot tub and is now slurring words and drifting in and out of consciousness. | One concrete case. |
| 3 | The real Gemma answer streams; highlights land as each phrase is said | The chatbot calls it heat exhaustion, suggests care within one to two hours, and starts with hydrating them. | Shows the hedge in the model's own output. |
| 4 | D2: "Physician label · Emergency" vs "Advice read as · Self-care" | A physician labelled this an emergency. That gap between the danger and the advice is under-triage. | Names the problem precisely. |
| 5 | **Full-frame TraceLens workspace** (Observability); wordmark | TraceLens is a safety and evaluation workspace that pairs a health chatbot with Vega, an independent model that reads only the person's message and checks for an emergency. | The idea, over the whole product. |
| 6 | D3 fork: the message to the chatbot and to Vega, each with its measured cost | The chatbot took a median of 67 seconds to write an answer; Vega decides in 0.36 seconds, without writing a word. | Why it's practical: cheap enough for every message. |
| 7 | Vega's gauge fills to 0.98 past the 0.876 tick | Here, Vega scores the message 0.98, above its threshold, so the two disagree. | The hero mechanism at work. |
| 8 | D4: banner → the chatbot's reconsideration types in | The person is told a safety check flagged the answer, and the chatbot reconsiders: call emergency services immediately. | Transparency to the end user, the question's second half. |
| 9 | First answer kept above; evidence-receipt chip slides out | The first answer stays visible, and every step, from first answer to final action, is stored for review. | Audit trail. |
| 10 | Live capture: Training Lab plan → bundle export → Baseline Lab runs and receipts | The same workspace runs the research behind these results: every study is planned in advance, run on cloud GPUs, and checked by blinded human review. | Breadth, and why the numbers can be trusted. |
| 11 | `safeguards.png` figure, bars draw on | Prompting alone traded misses for false alarms: a cautious prompt reached 35 of 39 emergencies but sent 18 of 77 non-emergencies to emergency care. | Why a separate model is needed. |
| 12 | Counter to 0.966 over `detectors.png` | On held-out cases, Vega ranked a true emergency above a non-emergency 97 percent of the time. | Vega's flags are accurate enough to act on. |
| 13 | `support-loop.png`: 31 → 18 → 8; 39 → 47 of 70; 4 → 5 of 134 | Across 277 saved cases, Vega flagged 18 of the chatbot's 31 missed emergencies, and emergency advice rose from 39 to 47 of 70, with one added false alarm in 134. | Reduced under-triage, the question's first half, with its cost. |
| 14 | `care-trajectory.png`, dumbbells draw on | Scoring released conversations from 11 models, a care-seeking protocol raised turn-by-turn accuracy for every one. | Reach beyond one chatbot. |
| 15 | The question returns with both halves checked → D4 → end card | A supporting model can do both: catch the emergencies a chatbot under-calls, and show the person when it does, for about a third of a second per message. | Answers the opening question. |

**Capture:** a live workspace capture (Observability, Training Lab, Baseline Lab). Everything else is boards D1–D4 and real figures.

---

---

## Alzheimer's research (~2:10)

**Industry:** neuroimaging and dementia research. **Workflows:** stage classification from MRI, atrophy measurement, tracking change across scans.
**Hero capability:** an expert ensemble of deliberately varied CNNs, then a published, transparent measure of atrophy.
**Spine:** why dementia research matters → the research question → the ensemble that answers it → the follow-up question and the published method → payoff.

| # | Picture | Narration | Why it's there |
|---|---|---|---|
| 0 | Slow drift across the real 12-scan notebook montage · chip *WHO* | Dementia affects 57 million people worldwide, Alzheimer's disease accounts for most cases, and detecting it early is one of medicine's most important research goals. | Why the area matters. |
| 1 | Paper Fig. 4 (normal vs dementia); callouts on ventricles, folds, hippocampus | On MRI, it shows as wider ventricles, deeper folds and a shrinking hippocampus, and reading those signs still takes expert time, scan by scan. | What doctors look for, and the workload to automate. |
| 2 | Kinetic type, first half of the question | How can we detect the disease early, and help doctors automate image analysis? | The research question, part one. |
| 3 | Kinetic type over the CNN diagram, three towers appearing | Can several deep-learning models, each carefully chosen and altered in architecture, depth, width and hyperparameters, be combined into an expert ensemble that consults each model's strengths and is more accurate than any one alone? | The research question, part two: the hypothesis the film tests. |
| 4 | Montage builds tile by tile; counter to 6,400; four class chips | The study trained on 6,400 ADNI brain scans across four stages, from non-demented to moderate dementia. | Data scale and task. |
| 5 | Two neighbouring-stage scans side by side | The hard part is telling neighbouring stages apart, because their scans can look structurally alike. | Why one model isn't enough. |
| 6 | Real CNN diagram splits into A1 towers; hyperparameter chips flick across them; strength tags | Each custom CNN was built differently, and each learned different strengths. | The experts. |
| 7 | A2 probability average (schematic bars) → 78% → 85% bar | Averaging their full class probabilities lets one model's confidence cover another's doubt: accuracy rose from 78 to 85 percent, with fewer crucial cases missed. | The answer: yes, the ensemble beats the single model. |
| 8 | Kinetic type over a scan as its tissue begins to glow | The next question was where the disease shows itself most, and whether that can be measured directly. | Bridges to the second study. |
| 9 | Paper page 1 slides in (ICRITO 2022 header) | The answer was published at IEEE ICRITO 2022: a computer-vision method that measures atrophy itself. | The published work. |
| 10 | A3 colour mask on the Fig. 6 scan; dem = b / (w + g) writes on | Each scan is separated into dark fluid and white and grey tissue, and the ratio of fluid to tissue becomes one atrophy score. | The method, in plain terms. |
| 11 | A4 scale 0–1, ticks at 0.41 and 0.83, marker slides to 0.60 → real Fig. 7 | Across 2,198 labelled scans, healthy brains averaged 0.41 and brains with dementia 0.83, so every new scan has a place on that scale. | Reference bounds and how a score is read. |
| 12 | Default crop vs hippocampal crop; Table II counts 66 → 71 | Focusing on the hippocampus, one of the first regions Alzheimer's affects, raised accuracy from 66 to 71 percent. | Where the disease shows, measured. |
| 13 | Equation 4 writes on; two scans of the same subject with an arrow (schematic) | Measured again on later scans, the change in that score gives an automated rate of atrophy. | Tracking progression, toward early detection. |
| 14 | Both studies together → end card | Together, the two studies give doctors a stage for each scan, and a transparent measure of how far, and how fast, the brain is changing. | Answers the opening question. |

**Capture:** none. Real notebook outputs and paper figures, plus designed A1–A4 (labelled "Schematic" where values aren't real).

---

---

## Birb Hangout (~2:45)

**Industry:** social and realtime 3D software, an online third space for friends and family who live apart. **Workflows:** private rooms, music, a shared bookshelf, reading, television, trivia, hugs and emotes, napping, the Dream (breathing entry, flight, islands, valley), and the AI-collaboration tooling used to build it.
**Hero capability:** a warm shared room where people can see what each other are doing and join in, and an annotation tool that lets an AI find a defect in 3D space.
**Primary source:** the Birb Hangout about site (birb-hangout-about.onrender.com): its wording, its eleven activities in order, and its clip selections.
**Spine:** online third spaces → the hearth from *Mythos* → the Birb fireplace → the idea → the room as interface → all eleven activities → collaborating with AI → payoff.

| # | Picture | Narration | Why it's there |
|---|---|---|---|
| 0 | Warm dark frame; soft kinetic type | Friendships have always had third places: somewhere besides home and work to gather with no agenda. For friends who live far apart, that place has to be online. | The need, framed warmly: online third spaces. |
| 1 | Typographic card *Stephen Fry · Mythos*; a flame grows beneath the words | In Mythos, Stephen Fry writes about the hearth: the fire at the centre of the home, where people told stories, sat quietly, and kept each other company. | The inspiration, in the about site's own terms. |
| 2 | The flame match-cuts into the **Birb fireplace**, slow push-in (nap clip, fire audible) | Birb Hangout began as a small hearth across distance. | The concept made real, with the fireplace on screen. |
| 3 | Pull back to the **full lounge, both birds, whole room visible**; wordmark | It became a 3D social world where friends and family spend time together as birds, with each other's company as the only goal. | The idea, over the whole product. |
| 4 | **New capture:** create a room → share the code → a friend joins | A friend joins with a short room code. | Private and easy to join. |
| 5 | Wide: one bird reading, the other at the record cabinet | Everything happens inside the room itself: books, records and the television are real objects, so you can look up, see what a friend is doing, and join in. | The design philosophy (diegetic interaction). |
| 6 | `records` (00:00–00:12), its music audible under the voice | Choose a record, carry it across the lounge, and the music starts when it reaches the turntable. | Activity 1. |
| 7 | `bookshelf-selection` | Friends choose which books stay on the shelf, | Activity 2. |
| 8 | `reading` (*Dracula* opens) | and read in two rocking chairs that face each other, quiet without being solitary. | Activity 3. |
| 9 | `watching` (choosing, then the sofa view) | One bird holds the remote, and everyone watches together from the sofa. | Activity 4, and its sync. |
| 10 | `trivia`, cut on the ejection | In trivia, a wrong answer launches the losing bird, seat and all, while everyone watches. | Activity 5: the room event. |
| 11 | `hug` | Birds greet each other with hugs and quick emotes. | Activity 6. |
| 12 | `nap` | By the fire, they can nap side by side, making room for doing almost nothing. | Activity 7: back at the hearth. |
| 13 | `dream-entry`: the breathing ring and stars | Three slow breaths carry them into a shared Dream. | Activity 8. |
| 14 | `flight` | There, they learn to fly by feel: dive for speed, pull up to climb, bank to turn. | Activity 9. |
| 15 | `islands` | Floating islands give every flight somewhere to go, | Activity 10. |
| 16 | `exploration` (river, low pass) | across a valley almost nine kilometres long, shaped from real elevation data. | Activity 11, and the scale of the world. |
| 17 | Kinetic type over a paused landscape frame | Building a world like this raised a new question: how do you point an AI coding assistant at something that only looks wrong from one camera angle? | Sets up the AI-collaboration story. |
| 18 | `annotation-workflow`: pause → orbit → zoom → mark → describe | An annotation tool inside the game's studios pauses the scene, so you can orbit to the defect, draw over it, and describe it. | The interface used to collaborate with AI. |
| 19 | The mark's area lights the hit geometry; packet card: image, camera, object, coordinates | The mark is traced into the 3D scene itself, so the AI receives the image, the camera position, and the exact object or patch of terrain to fix. | How defects are traced in the 3D environment. |
| 20 | `flight-studio.png` → before/after pair from the same camera | After each fix, the same view is recaptured beside the original, so every change is checked exactly where the problem was found. | Closes the loop: verified fixes. |
| 21 | Back at the fireplace, both birds asleep → end card | Wherever the people you love are, the hearth is one room code away. | Payoff, tied back to the hearth. |

**Capture:** one new shot (create a room, then join by code with a second browser), which needs Birb running locally. The about site's clips (`projects/birb-hangout/captures/about-site/`, 960 px) set which moments to use. Each is re-cut from the full-resolution `.mov` master where one exists, and the 960 px clip is used only where there is no master (e.g. bookshelf selection, islands, exploration, if they aren't in the masters).
**Fact sources:** the about site (the hearth and *Mythos*, the eleven activities, the 3.8 × 8.8 km USGS valley, the annotation workflow) and `content/projects/birb-hangout.json` (room codes, identity on refresh, sync model).

---

---

## Refract (~2:00)

**Industry:** academic and engineering research. The worked example is Industrial and Systems Engineering: predicting the remaining useful life of lithium-ion batteries for predictive maintenance. **Workflows:** paper Q&A, note-taking, literature review and gap finding, code-free statistics with leakage checks, multi-model comparison.
**Hero capability:** one session carries a study from the first highlighted sentence to a tested model, with every decision kept.

| # | Picture | Narration | Why it's there |
|---|---|---|---|
| 0 | F1 (schematic): generic PDF, chat, notes, notebook and sheet windows; a claim card loses its source tag at each hand-off | A research study moves between PDF readers, AI chats, notes, notebooks and spreadsheets, and every hand-off can separate a claim from its source. | The need, at domain level. |
| 1 | F1 continues: the notebook window fills with code; a too-good chart | For engineering researchers, the analysis also demands code, and a model can look accurate while leaning on a variable it shouldn't use. | The second need, which the hero feature answers. |
| 2 | **Full-frame session reader (03)**, all five tabs visible; wordmark | Refract is one research workspace that carries a study from the first paper to a tested model, in a single session. | The idea, over the whole product. |
| 3 | Tabs light in turn: Reader, Index, Compare, Review, Stats | It joins five workspaces: a reader, an evidence index, a cross-paper comparison, recall practice, and a code-free statistics notebook. | Breadth. |
| 4 | Session sidebar: battery papers | Here, a study of battery ageing: predicting how many charge cycles a lithium-ion cell has left. | Names the industry case. |
| 5 | 01 Reader actions on a highlighted passage | In the Reader, any highlighted passage can be explained, summarised, quizzed, or questioned by voice. | Paper Q&A. |
| 6 | 02 grounded answer; ring on the page reference | Answers draw on that passage, and keep its page. | Grounding. |
| 7 | 04 Index by concept | Each explanation is saved as a note and filed by concept in the Index. | Notes from explanations. |
| 8 | 05 → 06 compare cards and literature matrix | Compare reads four papers side by side, by method, findings and contribution. | Literature review. |
| 9 | 07 → 08 coverage map; the gap panel rings | Then it maps coverage against the study's goal, and shows where the research gaps are. | Gap finding. |
| 10 | 09 Stats notebook | The same session takes a battery-cycling dataset of 15,064 rows into Stats. | The bridge from reading to analysis. |
| 11 | 10 → 11 profile and variable roles | Stats profiles every variable, and explains its role in plain language. | Code-free analysis. |
| 12 | 12 → 14 → 18: Cycle_Index flagged, ρ ≈ −0.9996 | Its audit flags cycle index: cycle count tracks remaining life so closely that a model using it would score well without learning anything about battery health. | The hero catch: leakage prevention. |
| 13 | 19 saved exclusion | The researcher accepts the exclusion, and the decision is saved with its reason. | Human decision, recorded. |
| 14 | 20 → 23 → 24: three models on one split | Three models then run on the same held-out data, a mean baseline, linear regression and a random forest, and are compared side by side. | Several models at once. |
| 15 | F2 session chain from real thumbnails → end card | From the first highlighted sentence to the tested model, the whole study stays in one place, with its reasoning attached. | Payoff tied to the need. |

**Capture:** none (option B: the 25 thesis screenshots, plus designed F1 and F2). The end card carries the San José State ISE master's project credit.
