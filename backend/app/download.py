"""Downloads the local voices ahead of time, so a demo never waits on the network.

    uv run python -m app.download            # Kokoro + every MMS language
    uv run python -m app.download en hi ta   # just these"""

import sys
import time

from .tts import engines


def main(langs: list[str]) -> None:
    langs = langs or engines.languages()
    for lang in langs:
        eng = engines.engine_for(lang)
        if eng is None:
            print(f"{lang}: no local voice")
            continue
        t = time.perf_counter()
        eng.synth("1" if lang not in ("en", "hi") else "Hello.", lang)
        print(f"{lang}: ready ({time.perf_counter() - t:.1f}s)")


if __name__ == "__main__":
    main(sys.argv[1:])
