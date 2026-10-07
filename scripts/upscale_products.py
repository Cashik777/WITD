import os
import glob
from PIL import Image, ImageFilter

SRC_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "products")
SCALE = 2

files = sorted(glob.glob(os.path.join(SRC_DIR, "*.png")))
print(f"Found {len(files)} files")

for i, path in enumerate(files):
    im = Image.open(path)
    w, h = im.size
    if w >= 1999:
        print(f"[{i+1}/{len(files)}] skip (already large) {os.path.basename(path)} {w}x{h}")
        continue
    up = im.resize((w * SCALE, h * SCALE), Image.LANCZOS)
    # Mild unsharp mask to counter the softness Lanczos upscaling introduces,
    # so pinch-zoom reveals crisper edges instead of just bigger blur.
    sharpened = up.filter(ImageFilter.UnsharpMask(radius=2, percent=130, threshold=2))
    sharpened.save(path, optimize=True)
    print(f"[{i+1}/{len(files)}] {os.path.basename(path)} {w}x{h} -> {w*SCALE}x{h*SCALE}")

print("Done.")
