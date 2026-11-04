"""Frame-to-frame motion analysis for wobble detection.

Usage: python3 -I jitter.py VIDEO START END [x y w h] [--json]

For every consecutive frame pair inside [START, END] seconds, estimates the subpixel
translation of the region (phase correlation with a parabolic peak fit, at full
1920x1080 resolution).  A smooth camera move gives a displacement series that
changes gradually and never reverses; a still region gives ~0 everywhere.
Reports:
  reversals  frames where the motion direction flips while moving (> 0.05 px)
  jerk_rms   RMS of the second difference of position (px/frame^2)
  still_rms  RMS displacement, meaningful when the region should be still
"""
import json, subprocess, sys
import numpy as np

FF = __file__.rsplit("/qa/", 1)[0] + "/node_modules/ffmpeg-static/ffmpeg"


def frames(video, start, end, roi):
    x, y, w, h = roi
    cmd = [FF, "-v", "error", "-ss", str(start), "-to", str(end), "-i", video,
           "-vf", f"crop={w}:{h}:{x}:{y},format=gray", "-f", "rawvideo", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    n = len(raw) // (w * h)
    return np.frombuffer(raw[: n * w * h], np.uint8).reshape(n, h, w).astype(np.float32)


def shift(a, b):
    win = np.outer(np.hanning(a.shape[0]), np.hanning(a.shape[1]))
    A = np.fft.fft2((a - a.mean()) * win)
    B = np.fft.fft2((b - b.mean()) * win)
    R = A * np.conj(B)
    R /= np.abs(R) + 1e-9
    r = np.fft.ifft2(R).real
    py, px = np.unravel_index(np.argmax(r), r.shape)

    def sub(c, m, p):
        return 0.0 if m == p else 0.5 * (m - p) / (m - 2 * c + p)

    h, w = r.shape
    dy = py + sub(r[py, px], r[(py - 1) % h, px], r[(py + 1) % h, px])
    dx = px + sub(r[py, px], r[py, (px - 1) % w], r[py, (px + 1) % w])
    if dy > h / 2: dy -= h
    if dx > w / 2: dx -= w
    return dx, dy


def analyse(video, start, end, roi):
    f = frames(video, start, end, roi)
    d = np.array([shift(f[i], f[i + 1]) for i in range(len(f) - 1)])
    mag = np.hypot(d[:, 0], d[:, 1])
    moving = mag > 0.05
    rev = 0
    # A smooth move never changes direction from one moving frame to the next moving
    # frame along an axis (ignoring frames with no motion in between).
    for axis in (0, 1):
        s = [v for v in d[:, axis] if abs(v) > 0.05]
        rev += sum(1 for i in range(1, len(s)) if np.sign(s[i]) != np.sign(s[i - 1]))
    # Stair-stepping: moving frames separated by frames of zero motion during a move.
    stalls = int(sum(1 for i in range(1, len(mag) - 1) if mag[i] < 0.02 and mag[i - 1] > 0.15 and mag[i + 1] > 0.15))
    jerk = np.diff(d, axis=0)
    return {
        "frames": int(len(f)),
        "reversals": int(rev),
        "stalls": stalls,
        "jerk_rms": float(np.sqrt((jerk ** 2).sum(axis=1).mean())) if len(jerk) else 0.0,
        "still_rms": float(np.sqrt((mag ** 2).mean())),
        "max_step": float(mag.max()),
        "series": [[round(a, 3), round(b, 3)] for a, b in d],
    }


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    video, start, end = args[0], float(args[1]), float(args[2])
    roi = tuple(int(v) for v in args[3:7]) if len(args) >= 7 else (640, 300, 640, 480)
    out = analyse(video, start, end, roi)
    if "--json" in sys.argv:
        print(json.dumps(out))
    else:
        s = out.pop("series")
        print(json.dumps(out))
        print("dx:", " ".join(f"{v[0]:+.2f}" for v in s[:48]))
