"""Local speech output with Kokoro (82M, ONNX, Apache-2.0): English and Hindi voices, fast on a CPU.
Marathi is read by the Hindi voice with Marathi pronunciation rules (same Devanagari script).

The browser speaks with the device's own voice when it has a good one; these voices are the fallback,
so every device can speak. The model downloads on first use into MODELS_DIR and stays loaded.
Synthesis runs in a worker thread, one request at a time."""

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
# AwaazForm language → (espeak-ng phonemizer language, Kokoro voice).
LANGS = {
    "en": ("en-us", lambda: config.KOKORO_VOICE_EN),
    "hi": ("hi", lambda: config.KOKORO_VOICE_HI),
    "mr": ("mr", lambda: config.KOKORO_VOICE_HI),
}
# espeak-ng marks a switch into another language inside the text ("(en)…(hi)" around "Borivali"), and
# Kokoro would read the marker aloud as "en". The markers are removed; English words keep English sounds.
LANG_MARK = re.compile(r"\([a-z]{2,3}(?:-[a-z]{2,4})?\)")


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
        lang, voice = LANGS[language]
        with self._lock:
            model = self._load()
            phonemes = LANG_MARK.sub("", model.tokenizer.phonemize(text, lang))
            samples, rate = model.create(phonemes, voice=voice(), speed=1.0, lang=lang, is_phonemes=True)
        return wav_bytes(samples, rate)


kokoro = Kokoro()
_status: dict[str, str] = {}
_warming: set[str] = set()


def engine_for(language: str):
    return kokoro if language in LANGS else None


def languages() -> list[str]:
    return sorted(LANGS) if config.LOCAL_TTS else []


async def synth(text: str, language: str) -> bytes:
    if language not in LANGS:
        raise ValueError("No local voice for this language")
    return await asyncio.to_thread(kokoro.synth, text, language)


async def warm_up() -> None:
    """Loads (and downloads if needed) the voice, so the first spoken reply is quick."""
    sample = {"en": "Hello.", "hi": "नमस्ते।", "mr": "नमस्कार."}
    for lang in config.TTS_PRELOAD:
        if lang not in LANGS:
            continue
        t = time.perf_counter()
        _status[lang] = "loading"
        try:
            await synth(sample.get(lang, "1"), lang)
            _status[lang] = f"ready ({time.perf_counter() - t:.1f}s warm-up)"
        except Exception as e:  # noqa: BLE001
            _status[lang] = f"failed: {type(e).__name__}"
        print(f"[tts] {lang}: {_status[lang]}")


def warm_soon(language: str) -> None:
    """Loads one language's voice in the background, once."""
    if language in _warming or language not in LANGS:
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
