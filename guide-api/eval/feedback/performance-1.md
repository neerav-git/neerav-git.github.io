# Performance 1 (2026-10-14): page hangs and voice stutter

Neerav reported that the site sometimes hangs and the voice stutters. Measured with `scripts/guide-perf-probe.mjs` (fresh Chrome on his Mac, WebGPU voice): open the guide, let the voice download, turn it on, play a spoken portfolio tour.

## Causes found

| Symptom | Cause | Evidence |
| --- | --- | --- |
| Page freezes when the voice turns on | Creating the `AudioContext` blocks the main thread while it waits on the browser's audio service. It happened inside the click, right after the model finished loading on the GPU, and the guide created a second context for the earcons | Live: click 495 ms, one first-visit freeze of 3.4 s; `ensureAudio` 421 ms self time in a CPU profile; isolated context creation 134 ms cold, 7 ms warm |
| Small hitches while the voice downloads | The worker posted a progress message per download chunk; each one re-rendered the guide panel | 5,917 progress messages per download |
| Silence at each tour stop | A stop's narration started generating only after the page moved there; a long sentence takes about 3 s to generate | 3 to 4 s gaps live (up to 10.9 s on the dev server, which compiles each page on first visit) |
| Page freezes during tour page changes | Rendering each project page | Worst frame 0.5 to 0.7 s |

## Fixes shipped (commit 9d350e8)

- One shared `AudioContext`, created in `GuideVoice.preload()` when the guide opens, before the model loads; earcons use it through `shareEarconContext`. Turning the voice on only resumes it.
- The voice worker sends download progress at most ten times a second.
- `GuideVoice.prepare()` generates the next tour stop's sentences while the current stop plays (`sentencesOf` keeps the split identical); `stop()` discards prepared audio.

## Measured after (live site, fresh profile)

| Measure | Before | After |
| --- | --- | --- |
| Voice-on click | 495 ms (3.4 s worst) | 53 ms |
| AudioContext creations | 2 | 1 (187 ms, when the guide opens) |
| Progress messages | 5,917 | 89 |
| Silence at a tour stop | 3 to 4 s | 0.4 to 0.7 s (includes the intended 500 ms pause and the scroll) |
| Long tasks during the spoken tour | 8 | 1 |

Playwright suite: 7/7 after the change.

## Still open

1. Opening the guide still costs one ~0.2 s pause (the AudioContext creation).
2. Tour page changes still drop one frame of about 0.5 s while the project page renders; prefetching each stop's route could shorten it.

## Round 2: tape-like stutter (local fix, not committed or published)

Chrome 155's live `AudioContext.playbackStats` counters reproduced the stutter as actual output underruns. The extended probe correlates those counters with WebGPU synthesis jobs, route and scroll events, long tasks, frozen frames, and each scheduled voice buffer.

### What caused it

The strongest failure was GPU/renderer contention while Kokoro generated fp32 speech on the M3 MacBook Air's shared GPU and memory. In the unchanged local build, one run logged 4 underruns / 143.1 ms. The unchanged live site logged 18 underruns / 4.096 s. Under heavier contention, Chrome recorded multi-second main-thread and frame stalls at the same time; that is why the whole Mac can appear frozen as the voice repeats. Navigation had usually completed seconds before an underrun, so page rendering was not the primary trigger.

The stereo 1.6 s convolver reduced the audio thread's remaining headroom: bypassing it produced 0 underruns in two matched runs. A mono impulse preserved the approved 6% room amount and decay while halving that convolution workload, but did not prevent the worst GPU stalls by itself. `latencyHint: 'playback'` also failed by itself while WebGPU generation still overlapped audio.

### Local fix

- Generate the complete spoken answer and all tour-stop narration before the first voice buffer starts.
- Suspend the shared `AudioContext` during that WebGPU batch, then resume it only when every buffer is ready. This prevents Chrome's audio service from competing with inference or counting silent-output underruns during a preparation freeze.
- Use `latencyHint: 'playback'`, which increased measured base latency from 5.3 ms to 21.3 ms and provided more output headroom without changing the voice.
- Use one room-impulse channel instead of two independently convolved channels. The room remains 6%, 1.6 s, decay 3.2; EQ, compression, Kokoro `af_heart` WebGPU fp32, and the 180 ms sentence pause are unchanged.

### Confirmation

Three final source-level spoken-tour runs, including two with multi-second preparation stalls, each logged **0 underrun events / 0.000 s**. Once playback began, tour-stop gaps stayed about 0.4 to 0.9 s including the intentional 500 ms stop pause and page move; within-stop sentence gaps remained 180 ms. The Playwright suite passed 7/7.

The remaining issue is the preparation-phase computer freeze itself. The audio fix prevents that freeze from corrupting playback, but eliminating the system stall would require reducing or changing the WebGPU inference workload/backend and is outside the current constraint to keep Kokoro `af_heart` WebGPU fp32 unchanged.
