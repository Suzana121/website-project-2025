/*async function fetchWeatherByCoords(lat, lon)
 {
    const apiKey = "e3311e17923753e9ba49963fe4a687dd";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=he`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        const city = document.getElementById("weatherCity");
        const temp = document.getElementById("weatherTemp");
        const desc = document.getElementById("weatherDesc");
        const weatherDiv = document.getElementById("weather");

        // בדיקה שהנתונים קיימים
        if (!data || !data.main || !data.weather) {
            throw new Error("נתוני מזג האוויר לא זמינים");
        }

        city.innerText = data.name || "לא ידוע";
        temp.innerText = data.main.temp !== undefined ? `${data.main.temp}°C` : "-";
        desc.innerText = data.weather[0].description || "-";

        // ניקוי הודעות קודמות
        const oldMsgs = weatherDiv.querySelectorAll(".weather-message");
        oldMsgs.forEach(msg => msg.remove());

        // הודעה לפי טמפרטורה
        const temperature = data.main.temp;

        let message = "";
        let color = "";

        if (temperature >= 0 && temperature <= 10) {
            message = "קריר בחוץ ❄️ — הזמן להישאר בבית וללמוד מרחוק!";
            color = "blue";
        } else if (temperature >= 11 && temperature <= 15) {
            message = "מזג אוויר נעים קצת קריר 🍂 — אפשר ללמוד בבית או לקחת הפסקה קצרה בחוץ.";
            color = "teal";
        } else if (temperature >= 16 && temperature <= 22) {
            message = "מזג אוויר נעים 🌤️ — יום מצוין ללמוד בחוץ או ליהנות מהאוויר הפתוח!";
            color = "green";
        } else if (temperature >= 23 && temperature <= 30) {
            message = "חם בחוץ 🔥 — כדאי לשתות הרבה מים ולהתקרר בזמן הלימוד!";
            color = "orange";
        } else {
            message = "מזג אוויר קיצוני ⚡ — שמרי על עצמך!";
            color = "red";
        }

        const tempMessage = document.createElement("p");
        tempMessage.className = "weather-message";
        tempMessage.innerText = message;
        tempMessage.style.fontWeight = "bold";
        tempMessage.style.color = color;
        weatherDiv.appendChild(tempMessage);

    } catch (error) {
        console.error("שגיאה ב-Weather API:", error);
        document.getElementById("weatherCity").innerText = "לא הצלחנו לטעון את מזג האוויר";
        document.getElementById("weatherTemp").innerText = "";
        document.getElementById("weatherDesc").innerText = "";
    }
}

// אם הדפדפן תומך במיקום
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByCoords(lat, lon);
        },
        (error) => {
            console.warn("לא ניתן לקבל את המיקום, נטען ערך ברירת מחדל (תל אביב).", error);
            fetchWeatherByCoords(32.0853, 34.7818);
        }
    );
} else {
    console.warn("Geolocation לא נתמך בדפדפן זה, נטען ערך ברירת מחדל.");
    fetchWeatherByCoords(32.0853, 34.7818);
}*/











// weather.js
const WEATHER_DEFAULT_CITY = "Tel Aviv";
const WEATHER_API_KEY = "e3311e17923753e9ba49963fe4a687dd"; // הרשמי ב-openweathermap.org

const cityEl = document.getElementById("weatherCity");
const tempEl = document.getElementById("weatherTemp");
const descEl = document.getElementById("weatherDesc");

function renderWeather(data) {
  const name = data.name;
  const temp = Math.round(data.main.temp);
  const desc = data.weather?.[0]?.description || "";

  cityEl.textContent = `מזג האוויר ב-${name}`;
  tempEl.textContent = `טמפרטורה: ${temp}°C`;
  descEl.textContent = `תיאור: ${desc}`;
}

async function fetchWeatherByQuery(query) {
  const url = `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${WEATHER_API_KEY}&units=metric&lang=he`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getWeatherByCity(city) {
  try {
    const data = await fetchWeatherByQuery(`q=${encodeURIComponent(city)}`);
    renderWeather(data);
  } catch (err) {
    console.error("Weather by city error:", err);
    cityEl.textContent = "שגיאה בטעינת מזג האוויר";
    tempEl.textContent = "";
    descEl.textContent = "בדקי את מפתח ה־API או שם העיר.";
  }
}

async function getWeatherByCoords(lat, lon) {
  try {
    const data = await fetchWeatherByQuery(`lat=${lat}&lon=${lon}`);
    renderWeather(data);
  } catch (err) {
    console.error("Weather by coords error:", err);
    // נפילה לעיר ברירת מחדל
    await getWeatherByCity(WEATHER_DEFAULT_CITY);
  }
}

function initWeather() {
  if (!WEATHER_API_KEY || WEATHER_API_KEY.startsWith("PUT_")) {
    cityEl.textContent = "חסר מפתח OpenWeather";
    tempEl.textContent = "הכניסי אותו ב-weather.js";
    descEl.textContent = "";
    return;
  }

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        getWeatherByCoords(latitude, longitude);
      },
      () => getWeatherByCity(WEATHER_DEFAULT_CITY),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  } else {
    getWeatherByCity(WEATHER_DEFAULT_CITY);
  }
}

initWeather();
