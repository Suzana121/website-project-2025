// youtube.js – שימוש ב-YouTube Data API + הטמעת וידאו

// 🔑 כאן לשים את מפתח ה-API שלך (YouTube Data API v3)
const YT_API_KEY = "AIzaSyCVmfx4oilLyxklusuN68q7g64-NX-XmEY"; // לא את הישן שפרסמת

// פונקציה קטנה שמוודאת שאנחנו עובדים רק עם videoId (לא עם URL מלא)
function extractVideoId(raw) {
  if (!raw) return "";
  const str = String(raw).trim();

  // אם זה כבר נראה כמו ID קצר – נחזיר אותו
  if (/^[a-zA-Z0-9_-]{8,}$/.test(str) && !str.includes("http")) {
    return str;
  }

  // אם זה URL בסגנון ?v=XXXXX
  const m1 = str.match(/[?&]v=([^&]+)/);
  if (m1) return m1[1];

  // אם זה URL קצר של youtu.be/XXXXX
  const m2 = str.match(/youtu\.be\/([^?]+)/);
  if (m2) return m2[1];

  // ברירת מחדל – נחזיר כמו שהוא
  return str;
}

// פונקציה שמביאה מידע על הסרטון מיוטיוב + מטמיעה iframe
async function fetchYouTubeVideo(videoIdRaw) {
  const playerEl = document.getElementById("videoPlayer");
  const titleEl  = document.getElementById("youtubeTitle");
  const descEl   = document.getElementById("youtubeDescription");

  const videoId = extractVideoId(videoIdRaw);

  if (!videoId) {
    playerEl.innerHTML = "<p style='text-align:center;'>לא נמצא מזהה וידאו לקורס זה.</p>";
    return;
  }

  // הודעת ביניים
  playerEl.innerHTML = `
    <div class="video-placeholder">
      <p>טוען וידאו מיוטיוב...</p>
    </div>
  `;

  try {
    // 🔹 קריאה ל-YouTube Data API – זה ה-API שהמטלה דורשת
    const apiUrl =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?id=${encodeURIComponent(videoId)}` +
      `&part=snippet` +
      `&key=${YT_API_KEY}`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`YouTube API HTTP ${res.status}`);
    }

    const data = await res.json();
    const item = data.items && data.items[0];

    if (item && item.snippet) {
      // כותרת ותיאור מתוך YouTube (להראות במטלה)
      if (titleEl) titleEl.textContent = item.snippet.title || titleEl.textContent;
      if (descEl)  descEl.textContent  = item.snippet.description || descEl.textContent;
    } else {
      console.warn("לא נמצא מידע על הסרטון ב-YouTube API");
    }
  } catch (err) {
    console.error("❌ שגיאה בקריאה ל-YouTube API:", err);
    // במקרה של שגיאה – נשאיר את הכותרת/תיאור שהגיעו מהקורס
  }

  // ⬇️ בכל מקרה, מטמיעים את הווידאו (גם אם ה-API נכשל)
  playerEl.innerHTML = `
    <iframe
      width="100%"
      height="400"
      src="https://www.youtube.com/embed/${videoId}?rel=0"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen>
    </iframe>
  `;
}
