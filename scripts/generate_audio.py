import os
import re
from gtts import gTTS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
AUDIO_DIR = os.path.join(PROJECT_DIR, "public", "audio")
MESSAGES_FILE = os.path.join(PROJECT_DIR, "public", "messages.js")


def load_fortunes(path: str) -> list[str]:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract all JS double-quoted strings from fortunes array.
    fortunes = re.findall(r'"((?:[^"\\]|\\.)*)"', content)
    # Only unescape JS string escapes that may appear in file.
    # Do NOT use unicode_escape here, it corrupts Bangla text.
    cleaned = [
        s.replace(r"\"", '"').replace(r"\\", "\\")
        for s in fortunes
    ]
    return cleaned


def save_tts(text: str, output_path: str) -> None:
    tts = gTTS(text=text, lang="bn")
    tts.save(output_path)


def main() -> None:
    os.makedirs(AUDIO_DIR, exist_ok=True)

    fortunes = load_fortunes(MESSAGES_FILE)
    print(f"Loaded {len(fortunes)} fortunes")

    # Instruction split audio for placing dynamic name in middle
    save_tts("অভিনন্দন", os.path.join(AUDIO_DIR, "instruction_prefix.mp3"))

    # Instruction suffix audio per card (1-6)
    bn_digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]
    for i in range(1, 7):
        bn_num = "".join(bn_digits[int(d)] for d in str(i))
        text = f"আপনি {bn_num} নাম্বার কার্ডটি পাঞ্চ করুন।"
        out = os.path.join(AUDIO_DIR, f"instruction_suffix_{i}.mp3")
        save_tts(text, out)
        print(f"Created {out}")

    # Wrong card audio per card (1-6)
    for i in range(1, 7):
        bn_num = "".join(bn_digits[int(d)] for d in str(i))
        text = f"ভুল কার্ড। দয়া করে {bn_num} নাম্বার কার্ডটি পাঞ্চ করুন।"
        out = os.path.join(AUDIO_DIR, f"wrong_{i}.mp3")
        save_tts(text, out)
        print(f"Created {out}")

    # Fortune audios
    for idx, msg in enumerate(fortunes):
        out = os.path.join(AUDIO_DIR, f"fortune_{idx}.mp3")
        save_tts(msg, out)
        if idx % 10 == 0:
            print(f"Created up to fortune_{idx}.mp3")

    print("Audio generation complete.")


if __name__ == "__main__":
    main()
