"""Local speech output.

- Kokoro (82M, ONNX, Apache-2.0): natural English and Hindi voices, fast on a CPU.
- MMS-TTS (Meta, VITS, CC-BY-NC-4.0): one small model per language for the other Indian languages.

Models download on first use into MODELS_DIR and stay loaded. Synthesis runs in a worker thread, one
request per engine at a time (neither runtime is safe to share across concurrent calls)."""

import asyncio
import io
import re
import threading
import time
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

from .. import config

KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
# Kokoro voices and its phonemizer language for each AwaazForm language.
KOKORO_LANGS = {"en": ("en-us", lambda: config.KOKORO_VOICE_EN), "hi": ("hi", lambda: config.KOKORO_VOICE_HI)}
# MMS checkpoints (facebook/mms-tts-<code>). Nepali has no public checkpoint: it borrows Hindi (same script).
MMS_CODES = {
    "hi": "hin", "bn": "ben", "mr": "mar", "te": "tel", "ta": "tam", "gu": "guj", "ur": "urd-script_arabic",
    "kn": "kan", "ml": "mal", "pa": "pan", "as": "asm", "ne": "hin",
}


def _download(url: str, dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    print(f"[tts] downloading {dest.name} …")
    urllib.request.urlretrieve(url, tmp)  # noqa: S310 (fixed https URL above)
    tmp.rename(dest)
    return dest


def wav_bytes(samples: np.ndarray, rate: int) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, np.clip(samples, -1, 1), rate, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def sentences(text: str) -> list[str]:
    """MMS (VITS) gets mumbly on long inputs, so it reads one sentence at a time."""
    parts = [p.strip() for p in re.split(r"(?<=[.!?।۔])\s+", text) if p.strip()]
    return parts or [text]


class Kokoro:
    def __init__(self):
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        if self._model is None:
            from kokoro_onnx import Kokoro as K  # imported lazily: onnxruntime is large

            d = config.MODELS_DIR / "kokoro"
            model = _download(KOKORO_URL + config.KOKORO_MODEL, d / config.KOKORO_MODEL)
            voices = _download(KOKORO_URL + "voices-v1.0.bin", d / "voices-v1.0.bin")
            self._model = K(str(model), str(voices))
        return self._model

    def synth(self, text: str, language: str) -> bytes:
        lang, voice = KOKORO_LANGS[language]
        with self._lock:
            samples, rate = self._load().create(text, voice=voice(), speed=1.0, lang=lang)
        return wav_bytes(samples, rate)


class Mms:
    def __init__(self):
        self._models: dict[str, tuple] = {}
        self._lock = threading.Lock()

    def _load(self, code: str):
        if code not in self._models:
            import torch
            from transformers import AutoTokenizer, VitsModel

            torch.set_num_threads(config.TTS_THREADS)
            name = f"facebook/mms-tts-{code}"
            cache = config.MODELS_DIR / "hf"
            self._models[code] = (AutoTokenizer.from_pretrained(name, cache_dir=cache), VitsModel.from_pretrained(name, cache_dir=cache).eval())
        return self._models[code]

    def synth(self, text: str, language: str) -> bytes:
        import torch

        with self._lock:
            tok, model = self._load(MMS_CODES[language])
            rate = model.config.sampling_rate
            gap = np.zeros(int(rate * 0.18), dtype=np.float32)
            out = []
            for s in sentences(text):
                inputs = tok(s, return_tensors="pt")
                if inputs["input_ids"].shape[-1] == 0:
                    continue  # nothing this voice can pronounce (e.g. only symbols)
                with torch.inference_mode():
                    out += [model(**inputs).waveform[0].numpy().astype(np.float32), gap]
        if not out:
            raise ValueError("Nothing to say")
        return wav_bytes(np.concatenate(out), rate)


kokoro, mms = Kokoro(), Mms()
_status: dict[str, str] = {}


def engine_for(language: str):
    if language in KOKORO_LANGS:
        return kokoro
    if language in MMS_CODES:
        return mms
    return None


def languages() -> list[str]:
    return sorted(set(KOKORO_LANGS) | set(MMS_CODES)) if config.LOCAL_TTS else []


async def synth(text: str, language: str) -> bytes:
    eng = engine_for(language)
    if eng is None:
        raise ValueError("No local voice for this language")
    try:
        return await asyncio.to_thread(eng.synth, text, language)
    except Exception:
        # Kokoro's Hindi can fail on unusual text; MMS has a Hindi voice too.
        if eng is kokoro and language in MMS_CODES:
            return await asyncio.to_thread(mms.synth, text, language)
        raise


async def warm_up() -> None:
    """Loads (and downloads if needed) the preloaded languages, so the first spoken reply is quick."""
    sample = {"en": "Hello.", "hi": "नमस्ते।"}
    for lang in config.TTS_PRELOAD:
        if engine_for(lang) is None:
            continue
        t = time.perf_counter()
        _status[lang] = "loading"
        try:
            await synth(sample.get(lang, "1"), lang)
            _status[lang] = f"ready ({time.perf_counter() - t:.1f}s warm-up)"
        except Exception as e:  # noqa: BLE001
            _status[lang] = f"failed: {type(e).__name__}"
        print(f"[tts] {lang}: {_status[lang]}")


_warming: set[str] = set()


def warm_soon(language: str) -> None:
    """Loads one language's voice in the background, once."""
    if language in _warming or engine_for(language) is None:
        return
    _warming.add(language)

    async def run():
        try:
            await synth("1", language)
            _status.setdefault(language, "ready")
        except Exception as e:  # noqa: BLE001
            _status[language] = f"failed: {type(e).__name__}"
            _warming.discard(language)

    asyncio.get_running_loop().create_task(run())


def status() -> dict[str, str]:
    return dict(_status)
