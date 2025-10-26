
async function fetchYouTubeVideo(videoId) {
    const apiKey = "AIzaSyCrCJQqXjiLJgsh2tcRluFsfP-aBpVrxLo"; // <-- כאן המפתח
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data); // כאן ניתן לראות אם המפתח עובד
        const title = data.items[0].snippet.title;
        const description = data.items[0].snippet.description;

        document.getElementById("youtubeTitle").innerText = title;
        document.getElementById("youtubeDescription").innerText = description;
        const videoFrame = document.createElement("iframe");
videoFrame.src = `https://www.youtube.com/embed/${videoId}`;
videoFrame.width = "560";
videoFrame.height = "315";
videoFrame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
document.getElementById("youtubeSection").appendChild(videoFrame);

    } catch (error) {
        console.error("שגיאה ב-YouTube API:", error);
    }
}

// קריאה לפונקציה עם מזהה סרטון לדוגמה
fetchYouTubeVideo("Yv5PqqYHiec");

