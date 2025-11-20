// youtube.js — וידאו בודד + פלייליסט

/* ===== פונקציות עזר לטקסט ===== */
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

/* ===== הגדרות כלליות ===== */
// ⚠️ ודא שהמפתח שלך עדיין תקף!
const apiKey = "AIzaSyCrCJQqXjiLJgsh2tcRluFsfP-aBpVrxLo"; 
const DEFAULT_PLAYLIST_ID = "PL0eyrZgxdwhwNC5ppZo_dYGVjerQY3xYU";

/* ===== וידאו בודד לפי videoId (פונקציה זו חיונית ל-loadCourse.js) ===== */
async function fetchYouTubeVideo(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(
    videoId
  )}&key=${apiKey}&part=snippet`;

  const section = document.getElementById("youtubeSection");
  const titleEl = document.getElementById("youtubeTitle");
  const descEl = document.getElementById("youtubeDescription");
  const videoPlayerEl = document.getElementById("videoPlayer");

  if (!section || !videoPlayerEl) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const item = data?.items?.[0];
    if (!item) {
      if (titleEl) titleEl.textContent = "לא נמצא סרטון";
      if (descEl) descEl.textContent = "בדקי את ה־videoId או את מפתח ה־API.";
      videoPlayerEl.innerHTML = '<p style="text-align:center;">וידאו חסר או לא זמין.</p>';
      return;
    }

    const { title, description } = item.snippet || {};

    // כותרת (מעודכנת)
    if (titleEl) titleEl.textContent = title || "ללא כותרת";

    // תיאור מעובד
    if (descEl) {
      const normalized = normalizeWhitespace(description || "");
      const safe = escapeHtml(normalized);
      const withEmojis = addSectionEmojis(safe);
      const withLinks = linkify(withEmojis);

      descEl.innerHTML = withLinks;
      descEl.style.whiteSpace = "pre-line";
      descEl.setAttribute("dir", guessDir(normalized));
    }

    // iframe - טוען את נגן ה-YouTube
    videoPlayerEl.innerHTML = ''; // מנקה תוכן קודם

    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1`;
    frame.width = "100%";
    frame.style.aspectRatio = "16/9"; // משתמשים ב-CSS במקום גובה קבוע
    frame.loading = "lazy";
    frame.title = title || "YouTube video";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.style.border = "0";
    frame.style.borderRadius = "12px";

    videoPlayerEl.appendChild(frame);

  } catch (err) {
    console.error("שגיאה ב-YouTube API:", err);
    if (titleEl) titleEl.textContent = "שגיאה בטעינת הסרטון";
    if (descEl) {
      descEl.textContent =
        "בדקי חיבור אינטרנט, מפתח API או מזהה וידאו, ונסי שוב.";
      descEl.style.whiteSpace = "normal";
    }
    videoPlayerEl.innerHTML = '<p style="text-align:center;">שגיאה בנגן הוידאו.</p>';
  }
}

/* ===== פלייליסט (playlistItems) - נשמר עבור שימוש עתידי או חיצוני ===== */
async function fetchPlaylist(playlistId, pageToken = "", maxResults = 10) {
  const base = "https://www.googleapis.com/youtube/v3/playlistItems";
  const url = `${base}?part=snippet&playlistId=${encodeURIComponent(
    playlistId
  )}&maxResults=${maxResults}&key=${apiKey}${
    pageToken ? `&pageToken=${pageToken}` : ""
  }`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Playlist HTTP ${res.status}`);
  return res.json();
}
//... שאר הפונקציות renderPlaylistItems ו-wirePlaylistPaging נשמרו כפי שהיו

// *************
// ⚠️ הערה חשובה:
// בגלל ש-loadCourse.js אחראי לטעינת נתוני הקורס והשיעורים שלך מה-Backend,
// הבלוק הזה למטה, שמנסה לטעון פלייליסט שלם מ-YouTube API אוטומטית, 
// הפך להיות מיותר ואפילו מפריע. 
// אם את משתמשת ב-courseContent מה-Backend שלך, עדיף להשאירו מחוץ לקוד.
// אם את רוצה להשאיר אותו לצורך בדיקות, הוא מובא פה:
// *************

function renderPlaylistItems(items, currentVideoId) {
  const listEl = document.getElementById("playlistList");
  if (!listEl) return;

  listEl.innerHTML = "";

  items.forEach((it) => {
    const sn = it.snippet;
    const vid = sn?.resourceId?.videoId;
    if (!vid) return;

    const card = document.createElement("div");
    card.className =
      "playlist-item" + (vid === currentVideoId ? " active" : "");
    card.dataset.videoId = vid;

    const thumbUrl =
      sn?.thumbnails?.medium?.url ||
      sn?.thumbnails?.default?.url ||
      "https://via.placeholder.com/320x180?text=YouTube";

    const safeTitle = escapeHtml(sn?.title || "ללא כותרת");
    const channel =
      sn?.videoOwnerChannelTitle || sn?.channelTitle || "ערוץ לא ידוע";
    const published = (sn?.publishedAt || "").slice(0, 10);

    card.innerHTML = `
      <img class="playlist-thumb" src="${thumbUrl}" alt="">
      <div class="playlist-meta">
        <div class="playlist-title-sm" title="${safeTitle}">
          ${safeTitle}
        </div>
        <div class="playlist-channel">${escapeHtml(channel)}</div>
        <div class="playlist-pub">${published}</div>
      </div>
    `;

    card.addEventListener("click", async () => {
      await fetchYouTubeVideo(vid);

      // עדכון הדגשה
      document
        .querySelectorAll(".playlist-item.active")
        .forEach((el) => el.classList.remove("active"));
      card.classList.add("active");

      document
        .querySelector(".course-video")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    listEl.appendChild(card);
  });
}

function wirePlaylistPaging(
  playlistId,
  nextToken,
  prevToken,
  currentVideoId,
  maxResults
) {
  const nextBtn = document.getElementById("playlistNext");
  const prevBtn = document.getElementById("playlistPrev");

  if (nextBtn) {
    nextBtn.hidden = !nextToken;
    nextBtn.onclick = async () => {
      const data = await fetchPlaylist(playlistId, nextToken, maxResults);
      renderPlaylistItems(data.items || [], currentVideoId);
      wirePlaylistPaging(
        playlistId,
        data.nextPageToken,
        data.prevPageToken,
        currentVideoId,
        maxResults
      );
    };
  }

  if (prevBtn) {
    prevBtn.hidden = !prevToken;
    prevBtn.onclick = async () => {
      const data = await fetchPlaylist(playlistId, prevToken, maxResults);
      renderPlaylistItems(data.items || [], currentVideoId);
      wirePlaylistPaging(
        playlistId,
        data.nextPageToken,
        data.prevPageToken,
        currentVideoId,
        maxResults
      );
    };
  }
}

/* ===== הרצה אוטומטית עם טעינת הדף (מומלץ לבטל אם משתמשים ב-loadCourse.js) ===== */
document.addEventListener("DOMContentLoaded", async () => {
  const section = document.getElementById("youtubeSection");
  if (!section) return;

  // loadCourse.js כבר מביא את ה-videoId, אז זה פחות רלוונטי
  const initialVideoId = section.dataset.videoId || ""; 
  const playlistId =
    section.dataset.playlistId || DEFAULT_PLAYLIST_ID;

  // אם הוידאו והפלייליסט כבר נטענים על ידי loadCourse.js, 
  // אפשר להשאיר את הבלוק הזה ריק או למחוק אותו כדי למנוע כפילויות.
  
  if (initialVideoId) {
    // await fetchYouTubeVideo(initialVideoId); // loadCourse.js עושה את זה
  }

  // טוענים פלייליסט (אם לא נטען על ידי loadCourse.js)
  if (playlistId) {
    try {
      const data = await fetchPlaylist(playlistId, "", 10);
      // renderPlaylistItems(data.items || [], initialVideoId); // loadCourse.js עושה את זה
      // wirePlaylistPaging( // loadCourse.js עושה את זה
      //   playlistId,
      //   data.nextPageToken,
      //   data.prevPageToken,
      //   initialVideoId,
      //   10
      // );
    } catch (e) {
      console.error("שגיאה בטעינת פלייליסט אוטומטי:", e);
      // ... הצגת שגיאה
    }
  }
});