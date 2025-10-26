async function fetchWeather(city) {
    const apiKey = "e3311e17923753e9ba49963fe4a687dd"; // כאן תכניסי את המפתח
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=he`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        // הצגת מידע בדף
        document.getElementById("weatherCity").innerText = data.name;
        document.getElementById("weatherTemp").innerText = `${data.main.temp}°C`;
        document.getElementById("weatherDesc").innerText = data.weather[0].description;

    } catch (error) {
        console.error("שגיאה ב-Weather API:", error);
        // הצגת הודעה ידידותית למשתמש במקום הריק
        document.getElementById("weatherCity").innerText = "לא הצלחנו לטעון את מזג האוויר";
        document.getElementById("weatherTemp").innerText = "";
        document.getElementById("weatherDesc").innerText = "";
    }
}

// קריאה לדוגמה
fetchWeather("Tel Aviv");
