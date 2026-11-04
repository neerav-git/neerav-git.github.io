# Cuts the Relay mark and wordmark out of the app's relay-logo.png (white background) into
# transparent PNGs for the film's sting, end card and poster: public/relay/relay-icon.png,
# relay-wordmark.png and relay-wordmark-white.png.
# Usage: python3 scripts/cut-relay-logo.py "<Relay repo>/public/relay-logo.png"
import sys
from pathlib import Path

import numpy as np
from PIL import Image

out = Path(__file__).resolve().parent.parent / "public" / "relay"
out.mkdir(parents=True, exist_ok=True)
im = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(float) / 255
# Un-composite from white: alpha = max over channels of (1 - c), colour = (c - (1 - a)) / a.
a = np.clip((1 - im).max(axis=2), 0, 1)
a = np.where(a < 0.04, 0, a)
rgb = np.where(a[..., None] > 0, (im - (1 - a[..., None])) / np.maximum(a[..., None], 1e-6), 0)
img = Image.fromarray((np.dstack([np.clip(rgb, 0, 1), a]) * 255).astype("uint8"), "RGBA")
img.crop((110, 445, 455, 785)).save(out / "relay-icon.png")
word = img.crop((470, 510, 1140, 800))
word.save(out / "relay-wordmark.png")
white = np.asarray(word).copy()
white[..., :3] = 255
Image.fromarray(white, "RGBA").save(out / "relay-wordmark-white.png")
