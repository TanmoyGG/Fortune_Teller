import argparse
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from gtts import gTTS


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DEFAULT_MESSAGES_FILE = PROJECT_DIR / "public" / "messages.js"
DEFAULT_OUTPUT_DIR = PROJECT_DIR / "public" / "audio_cartoon"


def load_fortunes(path: Path) -> list[str]:
    with path.open("r", encoding="utf-8") as f:
        content = f.read()

    fortunes = re.findall(r'"((?:[^"\\]|\\.)*)"', content)
    cleaned = [s.replace(r'\"', '"').replace(r"\\", "\\") for s in fortunes]
    return cleaned


def save_tts(text: str, output_path: Path) -> None:
    tts = gTTS(text=text, lang="bn")
    tts.save(str(output_path))


def apply_cartoon_effect(input_mp3: Path, output_mp3: Path) -> bool:
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        return False

    # Keep the voice slightly cartoon-like without over-processing it into a buzz.
    audio_filter = "asetrate=44100*0.75,atempo=0.80,aresample=44100"
    cmd = [
        ffmpeg_path,
        "-y",
        "-i",
        str(input_mp3),
        "-filter:a",
        audio_filter,
        "-codec:a",
        "libmp3lame",
        "-q:a",
        "4",
        str(output_mp3),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0


def save_tts_with_style(text: str, output_path: Path, style: str) -> None:
    if style == "normal":
        save_tts(text, output_path)
        return

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        temp_input = Path(temp_file.name)

    try:
        save_tts(text, temp_input)
        converted = apply_cartoon_effect(temp_input, output_path)
        if not converted:
            # Fallback to original voice when ffmpeg is unavailable.
            shutil.copyfile(temp_input, output_path)
    finally:
        if temp_input.exists():
            temp_input.unlink()


def generate_instruction_audio(output_dir: Path, style: str) -> None:
    save_tts_with_style("অভিনন্দন", output_dir / "instruction_prefix.mp3", style)

    months = [
        "বৈশাখ",
        "জ্যৈষ্ঠ",
        "আষাঢ়",
        "শ্রাবণ",
        "ভাদ্র",
        "আশ্বিন",
        "কার্তিক",
        "অগ্রহায়ণ",
        "পৌষ",
        "মাঘ",
        "ফাল্গুন",
        "চৈত্র",
    ]
    for index, month in enumerate(months, start=1):
        instruction_text = f"আপনি {month} কার্ডটি তুলুন।"
        wrong_text = f"ভুল কার্ড। দয়া করে {month} কার্ডটি তুলুন।"

        save_tts_with_style(instruction_text, output_dir / f"instruction_month_{index}.mp3", style)
        save_tts_with_style(wrong_text, output_dir / f"wrong_month_{index}.mp3", style)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate separate Bangla audio set with optional cartoon-like voice effect."
    )
    parser.add_argument(
        "--messages-file",
        type=Path,
        default=DEFAULT_MESSAGES_FILE,
        help="Path to messages.js containing fortune strings.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Output directory for generated files (separate from current project audio).",
    )
    parser.add_argument(
        "--voice-style",
        choices=["normal", "cartoon"],
        default="cartoon",
        help="normal = plain gTTS, cartoon = gTTS + ffmpeg effect if available.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Generate only first N fortunes for testing (0 = all).",
    )
    args = parser.parse_args()

    messages_file = args.messages_file
    output_dir = args.output_dir
    style = args.voice_style
    limit = args.limit

    output_dir.mkdir(parents=True, exist_ok=True)
    fortunes = load_fortunes(messages_file)

    if limit > 0:
        fortunes = fortunes[:limit]

    print(f"Loaded {len(fortunes)} fortunes")
    print(f"Voice style: {style}")
    print(f"Output dir: {output_dir}")

    generate_instruction_audio(output_dir, style)

    for idx, msg in enumerate(fortunes):
        out = output_dir / f"fortune_{idx}.mp3"
        save_tts_with_style(msg, out, style)
        if idx % 10 == 0:
            print(f"Created up to fortune_{idx}.mp3")

    print("Separate cartoon audio generation complete.")
    if style == "cartoon" and not shutil.which("ffmpeg"):
        print("Warning: ffmpeg not found, generated normal voice fallback files.")


if __name__ == "__main__":
    main()
