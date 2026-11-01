# Builds docs/media/demo.gif from the frames readme-assets.mjs writes. Needs Pillow.
# Usage (from media/): python explainer/readme-gif.py
from pathlib import Path
from PIL import Image

here = Path(__file__).parent
frames = sorted((here / "out/gif-frames").glob("*.png"))
out = here.parent.parent / "docs/media/demo.gif"

ims = [Image.open(f).convert("RGB").resize((960, 540), Image.LANCZOS) for f in frames]
# One shared palette keeps colours stable between frames.
pal = ims[len(ims) // 2].quantize(colors=128, method=Image.MEDIANCUT)
ims = [im.quantize(palette=pal, dither=Image.NONE) for im in ims]
durations = [100] * len(ims)
durations[-1] = 1800  # hold on the verified field
ims[0].save(out, save_all=True, append_images=ims[1:], duration=durations, loop=0, optimize=True)
print(out, f"{out.stat().st_size / 1e6:.1f} MB")
