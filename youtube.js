
async function fetchYouTubeVideo(videoId) 
{
    const apiKey = "AIzaSyCrCJQqXjiLJgsh2tcRluFsfP-aBpVrxLo"; // <-- מפתח
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data); //  בדיקה אם המפתח עובד
        const title = data.items[0].snippet.title;
        const description = data.items[0].snippet.description;

        document.getElementById("youtubeTitle").innerText = title;
        document.getElementById("youtubeDescription").innerText = description;
        const videoFrame = document.createElement("iframe");

    } catch (error) {
        console.error("שגיאה ב-YouTube API:", error);
    }
}

// קריאה לפונקציה עם מזהה סרטון לדוגמה
fetchYouTubeVideo("eGR2Yf6yBRA");

