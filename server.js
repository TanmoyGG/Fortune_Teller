const express = require("express");
const path = require("path");
const fs = require("fs");
const googleTTS = require("google-tts-api");

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const namesAudioDir = path.join(publicDir, "audio", "names");

if (!fs.existsSync(namesAudioDir)) {
    fs.mkdirSync(namesAudioDir, { recursive: true });
}

function sanitizeFilename(input) {
    // Keep it simple and safe for Windows paths.
    return input
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, "_")
        .trim()
        .slice(0, 64);
}

app.get("/api/name-audio", (req, res) => {
    const rawName = (req.query.name || "").toString().trim();
    if (!rawName) {
        res.status(400).json({ error: "name is required" });
        return;
    }

    const safeBase = sanitizeFilename(rawName) || "name";
    const filePath = path.join(namesAudioDir, `${safeBase}.mp3`);

    // Reuse cached audio to keep response fast.
    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "audio/mpeg");
        res.sendFile(filePath);
        return;
    }

    const streamFromGoogle = async () => {
        try {
            const url = googleTTS.getAudioUrl(rawName, {
                lang: "bn",
                slow: false,
                host: "https://translate.google.com"
            });

            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            });

            if (!response.ok) {
                throw new Error(`Google TTS HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            fs.writeFileSync(filePath, buffer);
            res.setHeader("Content-Type", "audio/mpeg");
            res.send(buffer);
        } catch (err) {
            console.error("TTS exception:", err);
            res.status(500).json({ error: "TTS exception" });
        }
    };

    streamFromGoogle();
});

// Serve static frontend from public/
app.use(express.static(publicDir));

app.get("/", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Fortune teller server running at http://localhost:${PORT}`);
});
