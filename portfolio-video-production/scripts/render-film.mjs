// Renders a planned film: Remotion → ProRes intermediate (+ transparent captions layer
// and a poster still), then the delivery encodes with the mastered mix.
// Usage: node scripts/render-film.mjs <slug> [--draft] [--frames a-b] [--patch a-b] [--skip-video] [--skip-captions]
//   --patch a-b  re-render only frames a–b and splice them into the existing ProRes master
//   --draft      half-resolution JPEG-quality preview, no captions layer, no delivery encodes
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { browserExecutable } from "./lib/browser.mjs";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const args = process.argv.slice(2);
const slug = args[0];
const has = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const draft = has("draft");
const frames = value("frames")?.split("-").map(Number);
const patch = value("patch")?.split("-").map(Number);
const plan = JSON.parse(readFileSync(path.join(root, "projects", slug, "edit", "plan.json"), "utf8"));
const outDir = path.join(root, "renders", slug);
mkdirSync(outDir, { recursive: true });

const ffmpeg = (argv) => {
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-v", "error", "-y", ...argv], { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${argv.join(" ")}`);
};

console.log(`Bundling ${slug}…`);
const serveUrl = await bundle({ entryPoint: path.join(root, "remotion", "index.ts"), publicDir: path.join(root, "public"), symlinkPublicDir: true });
const concurrency = Math.max(2, Math.min(4, os.cpus().length - 4));
const common = {
  serveUrl,
  concurrency,
  offthreadVideoCacheSizeInBytes: 600 * 1024 * 1024,
  offthreadVideoThreads: 2,
  browserExecutable: browserExecutable(),
  timeoutInMilliseconds: 120000,
  logLevel: "warn",
};
const progress = (label) => {
  let last = -1;
  const t0 = Date.now();
  return ({ progress: p, renderedFrames }) => {
    const pct = Math.floor(p * 100);
    if (pct >= last + 5) {
      last = pct;
      const rate = renderedFrames / ((Date.now() - t0) / 1000);
      console.log(`  ${label}: ${pct}% (${renderedFrames} frames, ${rate.toFixed(1)} fps)`);
    }
  };
};

const videoFile = path.join(outDir, draft ? "draft.mp4" : "video.mov");
if (patch) {
  // ProRes is intra-frame: render the range, then rebuild the master around it.
  const composition = await selectComposition({ ...common, id: slug });
  const patchFile = path.join(outDir, "patch.mov");
  await renderMedia({ ...common, composition, outputLocation: patchFile, muted: true, colorSpace: "bt709", frameRange: [patch[0], patch[1]], codec: "prores", proResProfile: "hq", imageFormat: "png", onProgress: progress("patch") });
  const spliced = path.join(outDir, "video-spliced.mov");
  const [a, b] = patch;
  ffmpeg([
    "-i", videoFile, "-i", patchFile,
    "-filter_complex", `[0:v]trim=end_frame=${a},setpts=PTS-STARTPTS[x];[1:v]setpts=PTS-STARTPTS[y];[0:v]trim=start_frame=${b + 1},setpts=PTS-STARTPTS[z];[x][y][z]concat=n=3:v=1:a=0[v]`,
    "-map", "[v]", "-c:v", "prores_ks", "-profile:v", "3", "-vendor", "apl0", "-pix_fmt", "yuv422p10le",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", String(plan.fps), spliced,
  ]);
  const { renameSync } = await import("node:fs");
  renameSync(spliced, videoFile);
  console.log(`Patched frames ${a}–${b} into ${path.relative(root, videoFile)}`);
}
if (!has("skip-video") && !patch) {
  const composition = await selectComposition({ ...common, id: slug });
  await renderMedia({
    ...common,
    composition,
    outputLocation: videoFile,
    muted: true,
    colorSpace: "bt709",
    frameRange: frames ? [frames[0], frames[1]] : undefined,
    ...(draft
      ? { codec: "h264", crf: 20, scale: 0.5, imageFormat: "jpeg", jpegQuality: 85, x264Preset: "veryfast" }
      : { codec: "prores", proResProfile: "hq", imageFormat: "png" }),
    onProgress: progress(draft ? "draft" : "video"),
  });
}
if (draft) {
  const audio = path.join(root, "projects", slug, "edit", "audio", "master.wav");
  if (existsSync(audio) && !frames) {
    const withAudio = path.join(outDir, "draft-audio.mp4");
    ffmpeg(["-i", videoFile, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", withAudio]);
    console.log(withAudio);
  } else console.log(videoFile);
  process.exit(0);
}

// Transparent captions layer for the burned-in version.
const captionsFile = path.join(outDir, "captions.mov");
if (!has("skip-captions")) {
  const composition = await selectComposition({ ...common, id: `${slug}-captions` });
  await renderMedia({
    ...common,
    composition,
    outputLocation: captionsFile,
    muted: true,
    codec: "prores",
    proResProfile: "4444",
    imageFormat: "png",
    pixelFormat: "yuva444p10le",
    onProgress: progress("captions"),
  });
}

// Designed poster.
const posterFile = path.join(outDir, `${slug}-poster.png`);
const posterComp = await selectComposition({ ...common, id: `${slug}-poster` });
await renderStill({ ...common, composition: posterComp, output: posterFile, frame: 0, imageFormat: "png" });

// WebVTT from the plan's caption cues.
const stamp = (frame) => {
  const ms = Math.round((frame / plan.fps) * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}.${String(ms % 1000).padStart(3, "0")}`;
};
const vtt = ["WEBVTT", "", ...plan.captions.flatMap((c, i) => [String(i + 1), `${stamp(c.start)} --> ${stamp(c.end)}`, c.text, ""])].join("\n");
writeFileSync(path.join(outDir, `${slug}.vtt`), vtt);

// Delivery encodes: H.264 High, CRF 15, yuv420p, BT.709, AAC 48 kHz 320 kbps, faststart.
const audio = path.join(root, "projects", slug, "edit", "audio", "master.wav");
const seconds = (plan.durationInFrames / plan.fps).toFixed(3);
const encode = [
  "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-r", String(plan.fps), "-g", String(plan.fps * 2),
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
  "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", "-t", seconds,
];
const toYuv = "scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=tv,format=yuv420p";
ffmpeg(["-i", videoFile, "-i", audio, "-map", "0:v", "-map", "1:a", "-vf", toYuv, ...encode, path.join(outDir, `${slug}.mp4`)]);
ffmpeg([
  "-i", videoFile, "-i", audio, "-i", captionsFile,
  "-filter_complex", `[0:v][2:v]overlay=format=auto,${toYuv}[v]`,
  "-map", "[v]", "-map", "1:a", ...encode, path.join(outDir, `${slug}-captioned.mp4`),
]);
console.log(`Rendered ${slug} → ${path.relative(root, outDir)}`);
