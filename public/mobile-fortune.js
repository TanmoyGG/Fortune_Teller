document.addEventListener("DOMContentLoaded", () => {
    const fortuneText = document.getElementById("fortuneText");
    const FORTUNE_DATE_COOKIE = "daily_fortune_date";
    const FORTUNE_INDEX_COOKIE = "daily_fortune_index";

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
            return "দুঃখিত, এই মুহূর্তে ভাগ্যবার্তা পাওয়া যাচ্ছে না।";
        }
        const randomIndex = Math.floor(Math.random() * fortunes.length);
        return {
            index: randomIndex,
            text: fortunes[randomIndex]
        };
    }

    function getDailyFortune() {
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
            return fortunes[storedIndex];
        }

        const selected = getRandomFortune();
        // One full day lifetime; date cookie ensures it changes on next day.
        const oneDaySeconds = 24 * 60 * 60;
        setCookie(FORTUNE_DATE_COOKIE, today, oneDaySeconds);
        setCookie(FORTUNE_INDEX_COOKIE, String(selected.index), oneDaySeconds);
        return selected.text;
    }

    fortuneText.textContent = getDailyFortune();
});
