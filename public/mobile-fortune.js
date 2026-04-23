document.addEventListener("DOMContentLoaded", () => {
    const fortuneText = document.getElementById("fortuneText");
    const ttsPlayer = document.getElementById("mobile-tts-player");
    const audioHint = document.getElementById("audioHint");
    const FORTUNE_DATE_COOKIE = "daily_fortune_date";
    const FORTUNE_INDEX_COOKIE = "daily_fortune_index";
    let pendingUnlockPlay = false;

    function setCookie(name, value, maxAgeSeconds) {
        document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
    }

    function getCookie(name) {
        const prefix = `${name}=`;
        const cookieParts = document.cookie.split(";");
        for (const rawPart of cookieParts) {
            const part = rawPart.trim();
            if (part.startsWith(prefix)) {
                return decodeURIComponent(part.slice(prefix.length));
            }
        }
        return null;
    }

    function getTodayKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getRandomFortune() {
        if (!Array.isArray(fortunes) || fortunes.length === 0) {
            return {
                index: -1,
                text: "দুঃখিত, এই মুহূর্তে ভাগ্যবার্তা পাওয়া যাচ্ছে না।"
            };
        }
        const randomIndex = Math.floor(Math.random() * fortunes.length);
        return {
            index: randomIndex,
            text: fortunes[randomIndex]
        };
    }

    function getDailyFortuneSelection() {
        const today = getTodayKey();
        const storedDay = getCookie(FORTUNE_DATE_COOKIE);
        const storedIndexRaw = getCookie(FORTUNE_INDEX_COOKIE);
        const storedIndex = Number.parseInt(storedIndexRaw ?? "", 10);

        if (
            storedDay === today &&
            Number.isInteger(storedIndex) &&
            storedIndex >= 0 &&
            Array.isArray(fortunes) &&
            storedIndex < fortunes.length
        ) {
            return {
                index: storedIndex,
                text: fortunes[storedIndex]
            };
        }

        const selected = getRandomFortune();
        // One full day lifetime; date cookie ensures it changes on next day.
        const oneDaySeconds = 24 * 60 * 60;
        setCookie(FORTUNE_DATE_COOKIE, today, oneDaySeconds);
        if (selected.index >= 0) {
            setCookie(FORTUNE_INDEX_COOKIE, String(selected.index), oneDaySeconds);
        }
        return selected;
    }

    function setAudioHintVisible(visible) {
        if (!audioHint) return;
        audioHint.hidden = !visible;
    }

    function removeUnlockListeners() {
        document.removeEventListener("pointerdown", handleFirstInteraction);
        document.removeEventListener("keydown", handleFirstInteraction);
        document.removeEventListener("touchstart", handleFirstInteraction);
    }

    function handleFirstInteraction() {
        if (!pendingUnlockPlay || !ttsPlayer) return;
        pendingUnlockPlay = false;
        setAudioHintVisible(false);
        removeUnlockListeners();
        ttsPlayer.play().catch((err) => {
            console.warn("User-interaction playback failed:", err);
        });
    }

    function addUnlockListeners() {
        document.addEventListener("pointerdown", handleFirstInteraction, { passive: true });
        document.addEventListener("keydown", handleFirstInteraction);
        document.addEventListener("touchstart", handleFirstInteraction, { passive: true });
    }

    function playFortuneAudio(fortuneIndex) {
        if (!ttsPlayer || fortuneIndex < 0) return;

        const src = `audio_cartoon/fortune_${fortuneIndex}.mp3?v=${Date.now()}`;
        ttsPlayer.src = src;
        ttsPlayer.load();
        ttsPlayer.play().catch((err) => {
            console.warn("Auto audio play blocked or failed:", err);
            pendingUnlockPlay = true;
            setAudioHintVisible(true);
            addUnlockListeners();
        });
    }

    const dailyFortune = getDailyFortuneSelection();
    fortuneText.textContent = dailyFortune.text;

    const hadGestureFromEntry = sessionStorage.getItem("fortune_user_gesture") === "1";
    if (hadGestureFromEntry) {
        sessionStorage.removeItem("fortune_user_gesture");
    }

    // Auto play pre-generated audio for the same daily fortune.
    // Try immediately when arriving from the entry-button flow.
    setTimeout(() => {
        playFortuneAudio(dailyFortune.index);
    }, hadGestureFromEntry ? 40 : 300);
});
