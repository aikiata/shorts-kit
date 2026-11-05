"""
Bridge for the `vieneu` engine (VieNeu-TTS, Vietnamese, offline, Apache-2.0).

    python vieneu_bridge.py job.json     # synthesise every line of the job
    python vieneu_bridge.py --voices     # list the preset voices

job.json: {"lines": ["...", ...], "voice": "<preset name or path to a 3-8 s wav>",
           "mode": "v3turbo", "out": "<dir>", "cache": "<dir>"}
Writes <out>/line-<i>.wav and prints one "." per line.

Model files are downloaded once into <cache> as plain files (local_dir), not
into the shared Hugging Face cache: huggingface_hub 2.x keeps blobs outside
the model folder and onnxruntime refuses to load external data from there.
"""

import json
import os
import sys
from pathlib import Path

DEFAULT_CACHE = Path(__file__).resolve().parents[3] / ".cache" / "vieneu"


def patch_hub(cache: Path) -> None:
    import huggingface_hub

    orig_file = huggingface_hub.hf_hub_download
    orig_snap = huggingface_hub.snapshot_download

    def local(repo_id: str) -> str:
        return str(cache / repo_id.replace("/", "--"))

    def hf_hub_download(repo_id, filename, *a, **kw):
        if not os.path.isdir(repo_id):
            kw.setdefault("local_dir", local(repo_id))
        return orig_file(repo_id, filename, *a, **kw)

    def snapshot_download(repo_id, *a, **kw):
        if not os.path.isdir(repo_id):
            kw.setdefault("local_dir", local(repo_id))
        return orig_snap(repo_id, *a, **kw)

    huggingface_hub.hf_hub_download = hf_hub_download
    huggingface_hub.snapshot_download = snapshot_download


def load(mode: str, cache: Path):
    patch_hub(cache)
    from vieneu import Vieneu

    return Vieneu(mode=mode) if mode else Vieneu()


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: vieneu_bridge.py job.json | --voices")
    if sys.argv[1] == "--voices":
        tts = load("", DEFAULT_CACHE)
        for label, voice_id in tts.list_preset_voices():
            print(f"{label}\t{voice_id}")
        return

    job = json.loads(Path(sys.argv[1]).read_text("utf8"))
    tts = load(job.get("mode") or "", Path(job.get("cache") or DEFAULT_CACHE))
    voice = job.get("voice") or ""
    is_ref = voice.lower().endswith((".wav", ".mp3", ".flac", ".m4a"))
    if voice and not is_ref:
        names = {v for pair in tts.list_preset_voices() for v in pair}
        if voice not in names:
            sys.exit(f'unknown VieNeu voice "{voice}"; list them with: .venv-vieneu/bin/python scripts/lib/engines/vieneu_bridge.py --voices')
    out = Path(job["out"])
    for i, text in enumerate(job["lines"]):
        kw = {"ref_audio": voice} if is_ref else ({"voice": voice} if voice else {})
        audio = tts.infer(text, **kw)
        tts.save(audio, str(out / f"line-{i}.wav"))
        print(".", end="", flush=True)
    print()


if __name__ == "__main__":
    main()
