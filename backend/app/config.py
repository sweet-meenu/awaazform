"""Settings from the environment. Secrets are read here and never logged or sent to clients."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND = Path(__file__).resolve().parent.parent
# backend/.env first; the web app's .env.local as a fallback, so one key file can serve both.
load_dotenv(BACKEND / ".env")
load_dotenv(BACKEND.parent / "apps" / "web" / ".env.local")


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, "") or default)
    except ValueError:
        return default


GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
STT_MODEL = os.environ.get("GROQ_STT_MODEL") or "whisper-large-v3-turbo"
CHAT_MODEL = os.environ.get("GROQ_CHAT_MODEL", "")
# Used when the chat model is rate-limited (per minute or per day). Must support tool calls.
CHAT_FALLBACK = os.environ.get("GROQ_CHAT_FALLBACK", "openai/gpt-oss-20b")
GROQ_TTS_MODEL = os.environ.get("GROQ_TTS_MODEL", "")
GROQ_TTS_VOICE = os.environ.get("GROQ_TTS_VOICE", "")
MAX_AUDIO_BYTES = _int("MAX_AUDIO_BYTES", 2_000_000)
MAX_CHAT_CHARS = _int("MAX_CHAT_INPUT_CHARS", 2000)

# Who may call the API: the web app's origins, and the AwaazForm extension (pinned by ID if set).
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if o.strip()]
EXTENSION_IDS = [s.strip() for s in os.environ.get("AWAAZ_EXTENSION_IDS", "").split(",") if s.strip()]

# Local speech output.
LOCAL_TTS = os.environ.get("LOCAL_TTS", "1") not in ("0", "false", "off")
MODELS_DIR = Path(os.environ.get("MODELS_DIR", BACKEND / "models"))
KOKORO_MODEL = os.environ.get("KOKORO_MODEL", "kokoro-v1.0.onnx")  # or kokoro-v1.0.int8.onnx (smaller, faster)
KOKORO_VOICE_EN = os.environ.get("KOKORO_VOICE_EN", "af_heart")
KOKORO_VOICE_HI = os.environ.get("KOKORO_VOICE_HI", "hf_alpha")
TTS_PRELOAD = [s.strip() for s in os.environ.get("TTS_PRELOAD", "en,hi").split(",") if s.strip()]
TTS_THREADS = _int("TTS_THREADS", max(1, (os.cpu_count() or 4) // 2))
