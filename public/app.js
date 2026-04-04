// Ensure DOM holds
document.addEventListener("DOMContentLoaded", () => {
    
    // Globals
    let currentUser = "";
    let selectedCardIndex = 0;
    
    // Testing specific cards mapping
    const cardData = [
        { month: "বৈশাখ", serial: "0007221993" },
        { month: "জ্যৈষ্ঠ", serial: "0007486798" },
        { month: "আষাঢ়", serial: "0006963607" },
        { month: "শ্রাবণ", serial: "0007033364" },
        { month: "ভাদ্র", serial: "0007156002" },
        { month: "আশ্বিন", serial: "0007207478" },
        { month: "কার্তিক", serial: "0117413818" },
        { month: "অগ্রহায়ণ", serial: "0116574830" },
        { month: "পৌষ", serial: "0117417035" },
        { month: "মাঘ", serial: "0117645191" },
        { month: "ফাল্গুন", serial: "0117620589" },
        { month: "চৈত্র", serial: "0117614835" }
    ];
    
    // UI Elements
    const screenWelcome = document.getElementById("screen-welcome");
    const screenInstruction = document.getElementById("screen-instruction");
    const screenFortune = document.getElementById("screen-fortune");
    
    const inputName = document.getElementById("userNameInput");
    const btnStart = document.getElementById("btnStart");
    const btnRestart = document.getElementById("btnRestart");
    const btnStartNFC = document.getElementById("btnStartNFC");
    const pageBody = document.body;
    
    const textInstruction = document.getElementById("instruction-text");
    const textFortune = document.getElementById("fortune-text");
    const ttsPlayer = document.getElementById("tts-player");
    let ttsQueue = [];
    let isSpeaking = false;
    let currentFortuneIndex = -1;
    
    // Bangali Number Converter
    const banglaNumbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    function convertToBanglaNumber(num) {
        return num.toString().split('').map(digit => banglaNumbers[digit]).join('');
    }
    
    function playNextTts() {
        if (!ttsPlayer || isSpeaking || ttsQueue.length === 0) return;
        const nextSrc = ttsQueue.shift();
        isSpeaking = true;

        ttsPlayer.onended = () => {
            isSpeaking = false;
            playNextTts();
        };
        ttsPlayer.onerror = () => {
            console.error("Audio file failed:", nextSrc);
            isSpeaking = false;
            playNextTts();
        };

        const cacheBustedSrc = nextSrc.includes("?")
            ? `${nextSrc}&v=${Date.now()}`
            : `${nextSrc}?v=${Date.now()}`;

        ttsPlayer.src = cacheBustedSrc;
        ttsPlayer.load();
        ttsPlayer.play().catch((err) => {
            console.error("Local audio play failed:", err);
            isSpeaking = false;
            playNextTts();
        });
    }

    // Enqueue local audio file path
    function enqueueAudio(src) {
        if (!src) return;
        ttsQueue.push(src);
        playNextTts();
    }

    function enqueueNameAudio(name) {
        if (!name) return;
        const encodedName = encodeURIComponent(name);
        enqueueAudio(`/api/name-audio?name=${encodedName}`);
    }

    // Utility for switching screens
    function switchScreen(hideScreen, showScreen) {
        hideScreen.classList.remove("active");
        setTimeout(() => {
            hideScreen.style.display = "none";
            showScreen.style.display = "block";
            // trigger reflow
            void showScreen.offsetWidth;
            showScreen.classList.add("active");
            updateBackground(showScreen.id);
        }, 500);
    }

    function updateBackground(screenId) {
        pageBody.classList.remove("bg-welcome", "bg-instruction", "bg-fortune");
        if (screenId === "screen-welcome") {
            pageBody.classList.add("bg-welcome");
        } else if (screenId === "screen-instruction") {
            pageBody.classList.add("bg-instruction");
        } else if (screenId === "screen-fortune") {
            pageBody.classList.add("bg-fortune");
        }
    }

    // Step 1: User enters name
    btnStart.addEventListener("click", () => {
        // User gesture happens here, so browser allows speaking.
        
        // COMMENTED OUT FOR TESTING: Name input disabled
        // const name = inputName.value.trim();
        // if(name === "") {
        //     alert("অনুগ্রহ করে আপনার নাম দিন!");
        //     return;
        // }
        
        // currentUser = name;
        // For testing: set empty currentUser
        currentUser = "";
        // Pick one of the 12 month cards
        selectedCardIndex = Math.floor(Math.random() * cardData.length);
        const selectedCard = cardData[selectedCardIndex];
        
        // COMMENTED OUT FOR TESTING: Name display removed from instruction
        // textInstruction.innerHTML = `অভিনন্দন <span style="color:#D2122E;">${currentUser}</span>,<br> আপনি ${selectedCard.month} কার্ডটি তুলুন।`;
        textInstruction.innerHTML = `আপনি ${selectedCard.month} কার্ডটি তুলুন।`;
        
        // Speak in proper sentence order: অভিনন্দন + name + card instruction.
        // COMMENTED OUT FOR TESTING: Name audio disabled
        setTimeout(() => {
            enqueueAudio("audio_cartoon/instruction_prefix.mp3");
            // enqueueNameAudio(currentUser);
            enqueueAudio(`audio_cartoon/instruction_month_${selectedCardIndex + 1}.mp3`);
        }, 500);
        
        switchScreen(screenWelcome, screenInstruction);
        
        // Setup keyboard listener for JT308 USB NFC Reader
        setupKeyboardNFCTracking();
        
        // Show Mobile Web NFC button if supported
        if ('NDEFReader' in window) {
            btnStartNFC.style.display = "inline-block";
        }
    });

    // Enter key support for input
    // COMMENTED OUT FOR TESTING: Name input listener disabled
    // inputName.addEventListener("keypress", (e) => {
    //     if (e.key === "Enter") {
    //         btnStart.click();
    //     }
    // });
    
    // Restart logic
    btnRestart.addEventListener("click", () => {
        // COMMENTED OUT FOR TESTING: Reset inputName
        // inputName.value = "";
        currentUser = "";
        selectedCardIndex = 0;
        currentFortuneIndex = -1;
        ttsQueue = [];
        isSpeaking = false;
        if (ttsPlayer) {
            ttsPlayer.pause();
            ttsPlayer.currentTime = 0;
        }
        switchScreen(screenFortune, screenWelcome);
        removeKeyboardNFCTracking(); // Cleanup
    });

    // Initial background for first screen
    updateBackground("screen-welcome");
    
    // Step 2: The Scanning Logic
    
    // --- PC Mode: JT308 Emulates Keyboard typing a string and pressing 'Enter' ---
    let nfcBuffer = "";
    let lastKeyTime = 0;
    
    function keyboardNFCListener(e) {
        // Skip if not actively waiting for a card on screen 2
        if(!screenInstruction.classList.contains("active")) return;
        
        const currentTime = new Date().getTime();
        
        // NFC reader types very quickly compared to humans
        if (currentTime - lastKeyTime > 100) {
            nfcBuffer = ""; // Reset if it was a slow human typer
        }
        
        if (e.key === "Enter" && nfcBuffer.length > 5) { // IDs are usually 10 digits
            e.preventDefault();
            console.log("Card Scanned via USB:", nfcBuffer);
            verifyAndRevealFortune(nfcBuffer);
            nfcBuffer = "";
        } else if (e.key.length === 1 && !isNaN(e.key)) {
            nfcBuffer += e.key;
        }
        
        lastKeyTime = currentTime;
    }
    
    function setupKeyboardNFCTracking() {
        document.addEventListener('keydown', keyboardNFCListener);
    }
    
    function removeKeyboardNFCTracking() {
        document.removeEventListener('keydown', keyboardNFCListener);
    }
    
    // --- Mobile Mode: Web NFC API (13.56 MHz Cards) ---
    btnStartNFC.addEventListener("click", async () => {
        try {
            const ndef = new NDEFReader();
            await ndef.scan();
            btnStartNFC.innerText = "স্ক্যানিং চালু আছে... কার্ড ছোঁয়ান";
            btnStartNFC.style.backgroundColor = "#ff9800";
            
            ndef.addEventListener("reading", ({ message, serialNumber }) => {
                // Formatting mobile NFC serial to match 10-digit expected format (some devices pass hex strings)
                let cleanedSerial = serialNumber.replace(/:/g, "").toUpperCase();
                console.log("Card Scanned via Web NFC:", cleanedSerial);
                // Depending on card format returned, you might need to adapt this comparison
                verifyAndRevealFortune(cleanedSerial);
            });
            
            ndef.addEventListener("readingerror", () => {
                alert("কার্ড পড়তে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
            });
            
        } catch (error) {
            console.error(error);
            alert("আপনার ডিভাইসে এনএফসি চালু নেই বা সমর্থিত নয়।");
        }
    });

    // Step 3: Reveal Fortune
    function verifyAndRevealFortune(scannedId) {
        // Find which card ID is expected
        const expectedId = cardData[selectedCardIndex].serial;
        
        // Remove whitespace just in case
        scannedId = scannedId.trim();
        
        console.log("Expected ID:", expectedId, " | Scanned ID:", scannedId);

        if (scannedId === expectedId) {
            // Correct card scanned
            revealFortune();
        } else {
            const errorMsg = `দয়া করে ${cardData[selectedCardIndex].month} কার্ডটি তুলুন।`;
            enqueueAudio(`audio_cartoon/wrong_month_${selectedCardIndex + 1}.mp3`);
            alert(errorMsg);
        }
    }

    function revealFortune() {
        // Stop listening to background scans momentarily
        removeKeyboardNFCTracking();
        
        // Pick random fortune from the messages.js array
        // Expected variable `fortunes` exists in messages.js and loaded in HTML
        currentFortuneIndex = Math.floor(Math.random() * fortunes.length);
        const selectedMessage = fortunes[currentFortuneIndex];
        
        textFortune.innerText = selectedMessage;
        
        switchScreen(screenInstruction, screenFortune);
        
        // Speak fortune right after screen switched
        setTimeout(() => {
            enqueueAudio(`audio_cartoon/fortune_${currentFortuneIndex}.mp3`);
        }, 500);
    }
    
});