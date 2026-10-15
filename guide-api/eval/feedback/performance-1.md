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

1. **Tape-like stutter (not yet investigated).** Neerav hears the voice freeze and repeat a fragment "like a tape recorder" before it recovers. That is an audio-output underrun: the Web Audio render thread missed its deadline and the device replayed its last buffer. It is not the silence between sentences or stops (that was a separate issue, fixed above), and splitting sentences would not address it. Candidates to measure before changing anything: CPU/GPU contention while the worker generates speech on WebGPU and the page renders or scrolls; the cost of the 1.6 s stereo `ConvolverNode` reverb on the audio thread; the default `latencyHint: 'interactive'` buffer size (a larger `'playback'` buffer is a likely no-quality-cost fix for spoken audio). Chrome exposes audio glitch counters on the AudioContext (`playbackStats` in recent versions) that can confirm underruns and when they happen.
2. Opening the guide still costs one ~0.2 s pause (the AudioContext creation).
3. Tour page changes still drop one frame of about 0.5 s while the project page renders; prefetching each stop's route could shorten it.
