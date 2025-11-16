// youtube.js — גרסה מעודכנת: כותרת → סרטון → תיאור

/* ===== עזר לעיצוב טקסט התיאור ===== */
const escapeHtml = (str = "") =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeWhitespace = (str = "") =>
  str
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const addSectionEmojis = (str = "") =>
  str
    .replace(/(^|\n)\s*(Email[^:\n]*:)/gi, "$1📧 $2")
    .replace(/(^|\n)\s*(Hashtags?)/gi, "$1#️⃣ $2")
    .replace(/(^|\n)\s*(Tags?)/gi, "$1🏷️ $2");

const linkify = (str = "") =>
  str.replace(/(https?:\/\/[^\s]+)/g, (url) => {
    const safe = url.replace(/"/g, "%22");
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

const guessDir = (text = "") => (/[א-ת]/.test(text) ? "rtl" : "ltr");

/* ===== פונקציה ראשית ===== */
async function fetchYouTubeVideo(videoId) {
  const apiKey = "AIzaSyCrCJQqXjiLJgsh2tcRluFsfP-aBpVrxLo"; // מפתח YouTube Data API v3
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(
    videoId
  )}&key=${apiKey}&part=snippet`;

  const titleEl = document.getElementById("youtubeTitle");
  const descEl = document.getElementById("youtubeDescription");
  const section = document.getElementById("youtubeSection");

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const item = data?.items?.[0];
    if (!item) {
      if (titleEl) titleEl.textContent = "לא נמצא סרטון";
      if (descEl) descEl.textContent = "בדקי את ה־videoId או את מפתח ה־API.";
      return;
    }

    const { title, description } = item.snippet || {};

    /* --- עיבוד טקסטים --- */
    if (titleEl) titleEl.textContent = title || "ללא כותרת";

    if (descEl) {
      const normalized = normalizeWhitespace(description || "");
      const safe = escapeHtml(normalized);
      const withEmojis = addSectionEmojis(safe);
      const withLinks = linkify(withEmojis);
      descEl.innerHTML = withLinks;
      descEl.style.whiteSpace = "pre-line";
      descEl.setAttribute("dir", guessDir(normalized));
    }

    /* --- יצירת iframe --- */
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
    frame.width = "100%";
    frame.height = "520";
    frame.style.maxWidth = "900px";
    frame.loading = "lazy";
    frame.title = title || "YouTube video";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.style.border = "0";

    /* --- ניקוי ישן וסידור חדש --- */
    [...section.querySelectorAll("iframe")].forEach((n) => n.remove());

    // ננקה את הסקשן ונבנה את הסדר החדש במפורש
    section.innerHTML = "";

    // 1️⃣ כותרת
    if (titleEl) section.appendChild(titleEl);

    // 2️⃣ סרטון
    section.appendChild(frame);

    // 3️⃣ תיאור
    if (descEl) section.appendChild(descEl);

  } catch (err) {
    console.error("שגיאה ב-YouTube API:", err);
    if (titleEl) titleEl.textContent = "שגיאה בטעינת הסרטון";
    if (descEl) {
      descEl.textContent =
        "בדקי חיבור אינטרנט, מפתח API או מזהה וידאו, ונסי שוב.";
      descEl.style.whiteSpace = "normal";
    }
  }
}

/* ===== הרצה עם טעינת הדף ===== */
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("youtubeSection");
  const videoId = section?.dataset?.videoId;
  if (videoId) fetchYouTubeVideo(videoId);
});
