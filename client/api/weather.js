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
/*const WEATHER_DEFAULT_CITY = "Tel Aviv";
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

initWeather();*/





















// ===== Weather widget (דינמי עם נפילה ל-IP) =====
/*const WEATHER_API_KEY = "e3311e17923753e9ba49963fe4a687dd";

const cityEl = document.getElementById("weatherCity");
const tempEl = document.getElementById("weatherTemp");
const descEl = document.getElementById("weatherDesc");
const iconEl = document.getElementById("weatherIcon");

function showStatus(msg) {
  cityEl.textContent = msg;
  tempEl.textContent = "";
  descEl.textContent = "";
  iconEl.removeAttribute("src");
}

function renderWeather(data) {
  const name = data.name;
  const temp = Math.round(data.main.temp);
  const desc = data.weather?.[0]?.description || "";
  const icon = data.weather?.[0]?.icon || "01d";
  cityEl.textContent = `מזג האוויר – ${name}`;
  tempEl.textContent = `${temp}°C`;
  descEl.textContent = desc;
  iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  iconEl.alt = desc ? `מזג אוויר: ${desc}` : "אייקון מזג אוויר";
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=he`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  renderWeather(data);
}

// נפילה לפי IP (משוער; די טוב לשימוש רגיל)
async function fallbackByIP() {
  try {
    // אפשר גם ipinfo.io/json; כאן ipapi.co
    const ipRes = await fetch("https://ipapi.co/json/");
    const ipData = await ipRes.json();
    if (ipData?.latitude && ipData?.longitude) {
      await fetchWeatherByCoords(ipData.latitude, ipData.longitude);
      return true;
    }
  } catch (e) {
    console.error("IP fallback failed:", e);
  }
  return false;
}

function initWeather() {
  if (!WEATHER_API_KEY) {
    showStatus("חסר מפתח OpenWeather");
    return;
  }

  showStatus("מאתרת מיקום…");

  // אם אין API geolocation בכלל
  if (!("geolocation" in navigator)) {
    fallbackByIP().then(ok => {
      if (!ok) showStatus("מכשיר זה לא תומך במיקום");
    });
    return;
  }

  // ניסיון גיאולוקציה
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        await fetchWeatherByCoords(latitude, longitude);
      } catch (e) {
        console.error("Weather fetch error:", e);
        const ok = await fallbackByIP();
        if (!ok) showStatus("שגיאה בטעינת מזג האוויר");
      }
    },
    async (err) => {
      console.warn("Geolocation error:", err.code, err.message);
      // 1=PermissionDenied, 2=PositionUnavailable, 3=Timeout
      const ok = await fallbackByIP();
      if (!ok) {
        if (err.code === 1) showStatus("הרשאת מיקום נחסמה בדפדפן");
        else if (err.code === 3) showStatus("חרג מזמן המתנה למיקום");
        else showStatus("לא ניתן לזהות מיקום");
      }
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
  );
}

document.addEventListener("DOMContentLoaded", initWeather);*/

















async function fetchWeatherByCoords(lat, lon)
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
            message = "קריר בחוץ ❄️!";
            color = "blue";
        } else if (temperature >= 11 && temperature <= 15) {
            message = "מזג אוויר נעים קצת קריר 🍂";
            color = "teal";
        } else if (temperature >= 16 && temperature <= 22) {
            message = "מזג אוויר נעים 🌤️!";
            color = "green";
        } else if (temperature >= 23 && temperature <= 30) {
            message = "חם בחוץ 🔥!";
            color = "orange";
        } else {
            message = "מזג אוויר קיצוני ⚡!";
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
}