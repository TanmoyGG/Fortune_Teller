# Fortune Teller (Pohela Boishakh)

Interactive Bangla fortune teller web app with NFC card scan flow, animated UI backgrounds, and cartoon-style Bangla audio prompts.

## Features

- 3-screen app flow (welcome -> instruction -> fortune)
- NFC card validation (USB keyboard-emulation reader + Web NFC fallback)
- Bangla month-card based instructions (12 Bengali months)
- Cartoon-style generated audio prompts (separate generator script)
- Random fortune reveal from 100 Bangla messages
- Express backend with optional dynamic name audio endpoint

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js + Express
- Audio generation: Python + gTTS + FFmpeg filter tuning

## Project Structure

```text
.
├─ public/
│  ├─ index.html
│  ├─ app.js
│  ├─ style.css
│  ├─ messages.js
│  ├─ assets/
│  │  └─ background/
│  ├─ audio/                # optional standard audio set (generated)
│  ├─ audio_cartoon/        # cartoon audio set (generated)
│  └─ audio_cartoon_test/   # optional test output folder
├─ scripts/
│  ├─ generate_audio.py
│  └─ generate_audio_cartoon.py
├─ server.js
├─ package.json
├─ DEPLOY.md
└─ README.md
```

Note: Generated audio folders are ignored in git. After clone, regenerate audio before running the app.

## Card Mapping (Bangla Months)

| Month Card | Serial |
|---|---|
| বৈশাখ | 0007221993 |
| জ্যৈষ্ঠ | 0007486798 |
| আষাঢ় | 0006963607 |
| শ্রাবণ | 0007033364 |
| ভাদ্র | 0007156002 |
| আশ্বিন | 0007207478 |
| কার্তিক | 0117413818 |
| অগ্রহায়ণ | 0116574830 |
| পৌষ | 0117417035 |
| মাঘ | 0117645191 |
| ফাল্গুন | 0117620589 |
| চৈত্র | 0117614835 |

Instruction voice now says: "আপনি <মাসের নাম> কার্ডটি তুলুন।"

## Prerequisites

- Node.js 18+ (recommended 20+)
- Python 3.10+
- FFmpeg (required for cartoon voice effect)

## Local Setup

1. Install Node dependencies:

```bash
npm install
```

2. Create/activate Python venv (if not already):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install gtts
```

3. Generate cartoon audio set (required for current frontend flow):

```powershell
python scripts/generate_audio_cartoon.py --voice-style cartoon --output-dir public/audio_cartoon
```

4. Start server:

```bash
npm start
```

5. Open app:

```text
http://localhost:3000
```

## Audio Generation

### A) Standard voice set

```powershell
python scripts/generate_audio.py
```

### B) Cartoon voice set (current app usage)

```powershell
python scripts/generate_audio_cartoon.py --voice-style cartoon --output-dir public/audio_cartoon
```

Useful options:

```powershell
python scripts/generate_audio_cartoon.py --voice-style normal
python scripts/generate_audio_cartoon.py --voice-style cartoon --limit 10 --output-dir public/audio_cartoon_test
```

## FFmpeg Note

If FFmpeg is not available in PATH, cartoon script falls back to normal gTTS output.

Windows install (example):

```powershell
winget install -e --id Gyan.FFmpeg
```

## Run and Test Flow

1. Click start button
2. App randomly selects one month-card
3. Voice prompt asks to pick that month card
4. Scan card serial using USB NFC reader or Web NFC button
5. Correct card reveals fortune and plays fortune audio

## Deployment Notes

- Keep runtime command: `npm start`
- Ensure write permissions for `public/audio/names/` if dynamic name endpoint is used
- Regenerate audio in build/deploy pipeline if generated folders are not committed
- See `DEPLOY.md` for detailed hosting checklist

## Security and Repository Hygiene

- `.env` and `.env.*` are ignored
- `node_modules/`, `.venv/`, and generated audio folders are ignored
- Do not commit local credentials, tokens, or host keys

## Future Improvements

- Admin panel for card serial/month mapping
- Multiple selectable cartoon voice presets
- Auto-build script to regenerate audio during deployment
- Optional fallback text-only mode when audio is missing
