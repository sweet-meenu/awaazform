# AwaazForm explainer video

Output: `explainer/out/awaazform-explainer.mp4` (1920×1080, 30 fps, H.264 + AAC, about 2 minutes).

The video is rendered deterministically from code, so you can edit and re-render it.

| Step | Command (from `media/`) | What it does |
|---|---|---|
| 1. Voice | `pnpm voice` | Speaks each line in `explainer/script.json` with the offline Windows voices: Heera (Indian English) as Bolu, Ravi as the user. |
| 2. Mix | `pnpm audio` | Places the lines on a timeline and estimates phrase cue times. It also builds the lip-sync envelope and synthesizes the music bed and sound effects. Writes `audio/master.wav` and `timeline.json`. |
| 3. Screens | `BASE_URL=http://localhost:3000 pnpm capture` | Drives the real app with Playwright to capture 2× screenshots and record zoom regions. Needs the app running with AI configured. |
| 4. Render | `pnpm render` | Renders `composition.html` frame by frame in Edge and encodes it with WebCodecs and `mp4-muxer`. No ffmpeg is needed. |

Preview single frames with `node explainer/render.mjs --stills 3,20,45` (writes `out/still-<t>.png`).

- **Script and timing:** edit `explainer/script.json`, then run steps 1, 2 and 4.
- **Scenes, Bolu the robot and camera moves:** edit `explainer/composition.html`.
- **The example PDF:** rendered live from `../example_forms/Form_6_English.pdf`.

**README visuals:** `node explainer/readme-assets.mjs`, then `python explainer/readme-gif.py` (needs Pillow). These write caption-free stills, a transparent Bolu and `demo.gif` to `../docs/media/`.
