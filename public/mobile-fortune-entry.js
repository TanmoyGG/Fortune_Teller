document.addEventListener("DOMContentLoaded", () => {
    const btnEnterFortune = document.getElementById("btnEnterFortune");
    if (!btnEnterFortune) return;

    btnEnterFortune.addEventListener("click", () => {
        // Mark that user already interacted once, which helps audio autoplay on next page.
        sessionStorage.setItem("fortune_user_gesture", "1");
        window.location.href = "mobile-fortune-view.html";
    });
});
