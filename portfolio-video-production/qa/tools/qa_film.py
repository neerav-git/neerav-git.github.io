"""Strict QA for a rendered film. Writes images and a JSON report to qa/<slug>/.

Usage: python3 -I qa/tools/qa_film.py <root> <slug> [video]

Checks
  contact sheet     one frame per second, timestamped
  transitions       5 frames across every scene transition
  jitter            camera moves: direction reversals and stalls (wobble / stair-stepping)
                    camera holds: residual motion (should be ~0)
  holds             longest span with no visual change (must be <= 3 s)
  loudness          integrated LUFS and true peak of the delivered file
  runtime           the film's meta.runtime range (default 40-90 s)
  sync              every pinned action vs its narration word (must be within 150 ms)
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

root, slug = sys.argv[1], sys.argv[2]
sys.path.insert(0, os.path.join(root, "qa", "tools"))
from jitter import analyse  # noqa: E402

FF = os.path.join(root, "node_modules", "ffmpeg-static", "ffmpeg")
plan = json.load(open(os.path.join(root, "projects", slug, "edit", "plan.json")))
video = sys.argv[3] if len(sys.argv) > 3 else os.path.join(root, "renders", slug, f"{slug}.mp4")
out = os.path.join(root, "qa", slug)
os.makedirs(out, exist_ok=True)
fps = plan["fps"]
try:
    FONT = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
except OSError:
    FONT = ImageFont.load_default()


def grab(t, w=384, h=216):
    raw = subprocess.run([FF, "-v", "error", "-ss", f"{t:.4f}", "-i", video, "-frames:v", "1", "-vf", f"scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return Image.frombytes("RGB", (w, h), raw)


def probe_duration():
    r = subprocess.run([FF, "-i", video], capture_output=True, text=True).stderr
    hms = r.split("Duration: ")[1].split(",")[0]
    h, m, s = hms.split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


report = {"slug": slug, "video": os.path.relpath(video, root)}
duration = probe_duration()
# The film's own approved runtime (meta.runtime) when it has one; 40-90 s otherwise.
lo, hi = plan.get("meta", {}).get("runtime") or (40, 90)
report["runtime"] = {"seconds": round(duration, 2), "range": [lo, hi], "pass": lo <= duration <= hi}

# ---------- contact sheet ----------
cols, w, h = 8, 384, 216
times = [t + 0.5 for t in range(int(duration))]
rows = (len(times) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols + 1) * 8, rows * (h + 34) + 8), (14, 16, 22))
d = ImageDraw.Draw(sheet)
for i, t in enumerate(times):
    x, y = 8 + (i % cols) * (w + 8), 8 + (i // cols) * (h + 34)
    sheet.paste(grab(t, w, h), (x, y))
    d.text((x + 4, y + h + 5), f"{t:5.1f} s", fill=(220, 225, 235), font=FONT)
sheet.save(os.path.join(out, "contact.png"))
report["contact_sheet"] = f"qa/{slug}/contact.png"

# ---------- transition strips ----------
strips = []
for s in plan["scenes"]:
    tr = s.get("in")
    if not tr or tr["type"] == "cut":
        continue
    a, b = s["from"], s["from"] + tr["dur"]
    frames = [a + round((b - a) * k / 4) for k in range(5)]
    strips.append((s["id"], tr["type"], [grab((f + 0.5) / fps, 320, 180) for f in frames]))
sw, sh = 320, 180
img = Image.new("RGB", (220 + 5 * (sw + 6), len(strips) * (sh + 10) + 10), (14, 16, 22))
d = ImageDraw.Draw(img)
for i, (sid, kind, frames) in enumerate(strips):
    y = 10 + i * (sh + 10)
    d.text((10, y + 60), f"{sid}\n{kind}", fill=(220, 225, 235), font=FONT)
    for k, fr in enumerate(frames):
        img.paste(fr, (220 + k * (sw + 6), y))
img.save(os.path.join(out, "transitions.png"))
report["transitions"] = {"count": len(strips), "types": sorted({k for _, k, _ in strips}), "image": f"qa/{slug}/transitions.png"}

# ---------- jitter: camera moves and holds inside capture scenes ----------
# Global motion between consecutive frames is fitted as zoom + pan from phase correlation on
# a 5x3 grid of tiles, rejecting tiles that disagree (cursor, dialogs, overlays). A smooth
# camera gives a fitted pan/zoom series that changes gradually and never reverses.
GRID = [(x, y) for y in (190, 420, 650) for x in (230, 560, 890, 1220, 1550)]
T = 192


def tile_frames(a, b):
    raw = subprocess.run([FF, "-v", "error", "-ss", f"{(a + 0.5) / fps:.4f}", "-i", video, "-frames:v", str(b - a + 1), "-vf", "format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    n = len(raw) // (1920 * 1080)
    return np.frombuffer(raw[: n * 1920 * 1080], np.uint8).reshape(n, 1080, 1920).astype(np.float32)


WIN = np.outer(np.hanning(T), np.hanning(T))


def corr(p, q):
    A = np.fft.fft2((p - p.mean()) * WIN)
    B = np.fft.fft2((q - q.mean()) * WIN)
    R = A * np.conj(B)
    R /= np.abs(R) + 1e-9
    r = np.fft.ifft2(R).real
    py, px = np.unravel_index(np.argmax(r), r.shape)
    peak = r[py, px]

    def sub(c, m, n):
        return 0.0 if m == n else 0.5 * (m - n) / (m - 2 * c + n)

    dy = py + sub(r[py, px], r[(py - 1) % T, px], r[(py + 1) % T, px])
    dx = px + sub(r[py, px], r[py, (px - 1) % T], r[py, (px + 1) % T])
    if dy > T / 2: dy -= T
    if dx > T / 2: dx -= T
    return -dx, -dy, peak


def fit(f0, f1, masks=()):
    pts = []
    for x, y in GRID:
        if any(x < m[2] and x + T > m[0] and y < m[3] and y + T > m[1] for m in masks):
            continue  # an overlay, the cursor or a ripple covers this tile
        p, q = f0[y:y + T, x:x + T], f1[y:y + T, x:x + T]
        if p.std() < 4:  # flat tile: nothing to track
            continue
        dx, dy, peak = corr(p, q)
        if peak > 0.15:
            pts.append((x + T / 2 - 960, y + T / 2 - 540, dx, dy))
    if len(pts) < 5:
        return None
    P = np.array(pts)
    keep = np.ones(len(P), bool)
    for _ in range(3):
        X = np.concatenate([np.stack([P[keep, 0], np.ones(keep.sum()), np.zeros(keep.sum())], 1), np.stack([P[keep, 1], np.zeros(keep.sum()), np.ones(keep.sum())], 1)])
        Y = np.concatenate([P[keep, 2], P[keep, 3]])
        (k, tx, ty), *_ = np.linalg.lstsq(X, Y, rcond=None)
        res = np.hypot(P[:, 2] - (k * P[:, 0] + tx), P[:, 3] - (k * P[:, 1] + ty))
        keep = res < max(0.6, np.median(res) * 2.5)
        if keep.sum() < 5:
            return None
    return k, tx, ty, float(res[keep].max())


moves, holds = [], []
for s in plan["scenes"]:
    if s["kind"] != "capture":
        continue
    cam = np.array(s["frames"]["cam"], dtype=float)
    src = np.array(s["frames"]["src"])
    speed = np.abs(np.diff(cam[:, 1])) + np.abs(np.diff(cam[:, 2])) + np.abs(np.diff(np.log(cam[:, 0]))) * 800
    still_src = np.concatenate([[True], np.diff(src) == 0])
    lo = (s.get("in") or {}).get("dur", 0) + 2
    hi = s["duration"] - (s.get("out") or {}).get("dur", 0) - 2
    run = None
    for i in range(lo, hi):
        moving = speed[i - 1] > 0.02
        if moving and run is None:
            run = i
        if (not moving or i == hi - 1) and run is not None:
            if i - run >= 12:
                moves.append((s["id"], s["from"] + run, s["from"] + i))
            run = None
    run = None
    for i in range(lo, hi):
        quiet = speed[i - 1] < 1e-4 and still_src[i]
        if quiet and run is None:
            run = i
        if (not quiet or i == hi - 1) and run is not None:
            if i - run >= 20:
                holds.append((s["id"], s["from"] + run, s["from"] + i))
            run = None


# Moves are measured only on capture pixels: tiles under an overlay (callout, chip, lower
# third, tracker), the cursor or a click ripple are dropped, and frame pairs where the captured
# page itself changed (per the capture's activity log) are skipped, because both move
# independently of the camera and would read as camera wobble.
CHAPTERS = os.path.join(root, "projects", slug, "captures", "journey", f"take-{int(plan.get('take', 0)):02d}")
_activity = {}


def activity(s):
    name = os.path.basename(s["video"])
    if name not in _activity:
        f = os.path.join(CHAPTERS, f"{name}.activity.json")
        _activity[name] = json.load(open(f)) if os.path.exists(f) else None
    return _activity[name]


def to_screen(p, cam):
    return screen(p, cam)


def rect_of(box, cam0, cam1, pad):
    pts = [to_screen((bx, by), c) for c in (cam0, cam1) for bx in (box["x"], box["x"] + box["width"]) for by in (box["y"], box["y"] + box["height"])]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return (min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad)


def frame_masks(s, i):
    cams, masks = s["frames"]["cam"], []
    c0, c1 = cams[i], cams[min(i + 1, len(cams) - 1)]
    for o in s.get("overlays", []):
        if not (o["from"] - 4 <= i <= o["to"] + 20):
            continue
        if o["type"] == "lowerThird":
            masks.append((40, 700, 1150, 1000))
        elif "box" in o:
            x0, y0, x1, y1 = rect_of(o["box"], c0, c1, 36)
            side = o.get("side", "top")
            # Label and leader line: up to ~150 px beyond the box on its side, ~560 px wide.
            if side in ("top", "above"): y0 -= 150
            if side in ("bottom", "below"): y1 += 150
            if side == "left": x0 -= 600
            if side == "right": x1 += 600
            masks.append((x0, y0, max(x1, x0 + 560), y1))
    tr = plan.get("tracker")
    if tr and tr["from"] - 4 <= s["from"] + i <= tr["to"] + 20:
        masks.append((0, 0, 1920, 150))
    cur = s["frames"].get("cursor")
    if cur:
        for c, cam in ((cur[i], c0), (cur[min(i + 1, len(cur) - 1)], c1)):
            if c and (len(c) < 3 or c[2]):
                x, y = to_screen((c[0], c[1]), cam)
                masks.append((x - 70, y - 70, x + 70, y + 70))
    for k in s.get("clicks", []):
        if k["frame"] - 2 <= i <= k["frame"] + 45:
            x, y = to_screen((k["x"], k["y"]), c0)
            masks.append((x - 170, y - 170, x + 170, y + 170))
    return masks


def content_changed(s, i):
    act = activity(s)
    src = s["frames"]["src"]
    if act is None or i + 1 >= len(src):
        return False
    a, b = sorted((src[i], src[i + 1]))
    return any(act[j] > 0 for j in range(a + 1, min(b, len(act) - 1) + 1))


def planned_motion(s, i):
    """Planned zoom ratio and screen-centre displacement between frames i and i + 1."""
    cams = s["frames"]["cam"]
    c0, c1 = cams[i], cams[min(i + 1, len(cams) - 1)]
    a0, b0 = to_screen((0, 0), c0), to_screen((1000, 1000), c0)
    # screen() is affine in the capture point, so invert it at the screen centre.
    q = ((960 - a0[0]) * 1000 / (b0[0] - a0[0]), (540 - a0[1]) * 1000 / (b0[1] - a0[1]))
    p1 = to_screen(q, c1)
    return c1[0] / c0[0] - 1, p1[0] - 960, p1[1] - 540


def series(a, b, s=None):
    fr = tile_frames(a, b)
    out = []
    for i in range(len(fr) - 1):
        if s is not None and content_changed(s, a + i - s["from"]):
            out.append(None)
            continue
        out.append(fit(fr[i], fr[i + 1], frame_masks(s, a + i - s["from"]) if s is not None else ()))
    return out


def bounces(v, t, speed=None):
    """Direction flips between adjacent frames that are both clearly moving: a bounce.
    A move that eases to rest and sets off the other way is not counted, nor is a minor
    axis crossing zero on a curved path (it must carry >= 25% of the motion both sides)."""
    v = list(v)
    sp = list(speed) if speed is not None else [0] * len(v)
    big = lambda i: v[i] is not None and abs(v[i]) > max(t, 0.25 * (sp[i] or 0))
    return sum(1 for i in range(1, len(v)) if big(i) and big(i - 1) and np.sign(v[i]) != np.sign(v[i - 1]))


# Plan level: the planned camera, as screen motion of three reference points.
L = plan["layout"]


def screen(p, cam):
    z, fx, fy = cam[0], cam[1], cam[2]
    u = min(1, max(0, (z - 1) / 0.6))
    t = u * u * (3 - 2 * u)
    rest_y = L["content"]["top"] + L["content"]["height"] / 2
    ax, ay = 960, rest_y + (548 - rest_y) * t
    bx = L["content"]["left"] + p[0] * L["scale"]
    by = L["content"]["top"] + p[1] * L["scale"]
    gx = L["content"]["left"] + fx * L["scale"]
    gy = L["content"]["top"] + fy * L["scale"]
    return ax + z * (bx - gx), ay + z * (by - gy)


plan_bounces = []
for s in plan["scenes"]:
    if s["kind"] != "capture":
        continue
    cams = s["frames"]["cam"]
    count = 0
    for ref in ((960, 540), (200, 150), (1720, 930)):
        pts = np.array([screen(ref, c) for c in cams])
        d = np.diff(pts, axis=0)
        sp = np.hypot(d[:, 0], d[:, 1])
        count += bounces(d[:, 0], 0.05, sp) + bounces(d[:, 1], 0.05, sp)
    zoom = np.diff(np.log([c[0] for c in cams]))
    count += bounces(zoom, 1e-5)
    if count:
        plan_bounces.append({"scene": s["id"], "bounces": int(count)})

move_results = []
scene_by_id = {s["id"]: s for s in plan["scenes"]}
for sid, a, b in moves:
    sc = scene_by_id[sid]
    ser = series(a, b, sc)
    track = [np.hypot(r[1] - pm[1], r[2] - pm[2]) for i, r in enumerate(ser) if r is not None for pm in [planned_motion(sc, a + i - sc["from"])]]
    ok = [r for r in ser if r is not None]
    pan = np.array([[r[1], r[2]] if r is not None else [np.nan, np.nan] for r in ser]) if ser else np.zeros((0, 2))
    zoom = [r[0] if r is not None else None for r in ser]
    sp = [None if np.isnan(x) else x for x in np.hypot(pan[:, 0], pan[:, 1])] if len(pan) else []
    rev = sum(bounces([None if np.isnan(x) else x for x in pan[:, axis]], 0.15, sp) for axis in (0, 1)) + bounces(zoom, 4e-4)
    pan = pan[~np.isnan(pan).any(axis=1)]
    jerk = np.diff(pan, n=2, axis=0) if len(pan) > 2 else np.zeros((0, 2))
    move_results.append({
        "scene": sid, "from": round(a / fps, 2), "to": round(b / fps, 2), "fitted": f"{len(ok)}/{len(ser)}",
        "measurable": len(ok) >= 0.7 * max(1, len(ser)), "reversals": int(rev), "jerk_rms": round(float(np.sqrt((jerk ** 2).sum(1).mean())) if len(jerk) else 0.0, 3),
        "max_pan_px": round(float(np.abs(pan).max()) if len(pan) else 0.0, 2),
        "track_rms_px": round(float(np.sqrt(np.mean(np.square(track)))) if track else 0.0, 3),
        "track_max_px": round(float(max(track)) if track else 0.0, 3),
    })
hold_results = []
for sid, a, b in holds[:12]:
    ser = [r for r in series(a, min(b, a + 90)) if r is not None]
    mag = [np.hypot(r[1], r[2]) for r in ser]
    hold_results.append({"scene": sid, "from": round(a / fps, 2), "to": round(b / fps, 2), "still_rms": round(float(np.sqrt(np.mean(np.square(mag)))) if mag else 0.0, 3)})
measured = [m for m in move_results if m["measurable"]]
report["jitter"] = {
    "plan_bounces": plan_bounces,
    "moves": move_results,
    "holds": hold_results,
    "measured_moves": len(measured),
    "reversals": sum(m["reversals"] for m in measured),
    "max_hold_rms": max((h["still_rms"] for h in hold_results), default=0),
    "track_rms_px": round(float(np.sqrt(np.mean([m["track_rms_px"] ** 2 for m in measured]))) if measured else 0.0, 3),
}
report["jitter"]["pass"] = not plan_bounces and report["jitter"]["reversals"] == 0 and report["jitter"]["max_hold_rms"] < 0.05

# ---------- holds: longest span without a visual change ----------
raw = subprocess.run([FF, "-v", "error", "-i", video, "-vf", "scale=160:90:flags=area,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
n = len(raw) // (160 * 90)
g = np.frombuffer(raw[: n * 160 * 90], np.uint8).reshape(n, 90, 160).astype(np.float32)
# A visual event anywhere counts: the largest change in any 10x10 tile (a 120 px square at
# full size). Grain and the drifting backdrop average out well below the threshold.
d = np.abs(np.diff(g, axis=0)).reshape(-1, 9, 10, 16, 10).mean(axis=(2, 4))
diff = d.max(axis=(1, 2))
floor = float(np.percentile(diff, 20))
active = diff > max(1.2, floor * 2.2)
longest, run, at = 0, 0, 0
over = []  # every still span past 3 s, so one run shows all of them
for i, a in enumerate(list(active) + [True]):
    if a and run > 3.0 * fps:
        over.append({"at": round((i - run) / fps, 2), "seconds": round(run / fps, 2)})
    run = 0 if a else run + 1
    if run > longest:
        longest, at = run, i - run + 1
report["holds"] = {"longest_seconds": round(longest / fps, 2), "at": round(at / fps, 2), "over_3s": over, "threshold": round(max(1.2, floor * 2.2), 3), "pass": longest / fps <= 3.0}

# ---------- loudness ----------
r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
summary = r[r.rfind("Summary:"):]
lufs = float(summary.split("I:")[1].split("LUFS")[0])
tp = float(summary.split("Peak:")[1].split("dBFS")[0])
report["loudness"] = {"integrated": lufs, "true_peak": tp, "pass": abs(lufs + 16) <= 0.5 and tp <= -1.4}

# ---------- sync ----------
syncs = plan.get("syncs", [])
for s in syncs:
    s["offset_ms"] = round((s["event"] - s["word"]) * 1000)
report["sync"] = {"pairs": syncs, "worst_ms": max((abs(s["offset_ms"]) for s in syncs), default=0)}
report["sync"]["pass"] = report["sync"]["worst_ms"] <= 150

report["pass"] = all(report[k]["pass"] for k in ("runtime", "jitter", "holds", "loudness", "sync"))
json.dump(report, open(os.path.join(out, "report.json"), "w"), indent=2)
print(json.dumps({k: (v if not isinstance(v, dict) else {kk: vv for kk, vv in v.items() if kk not in ("moves", "holds", "pairs")}) for k, v in report.items()}, indent=1))
