// ----------------------
// פונקציית בדיקה לשרת
// ----------------------
async function testServer() {
    try {
        const response = await fetch("http://localhost:8000/api/test");
        const data = await response.json();
        console.log("תגובה מהשרת:", data);
    } catch (error) {
        console.error("שגיאה בפנייה לשרת:", error);
    }
}

testServer();

// ----------------------
// התחברות משתמש (Login)
// ----------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:8000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log("תגובה מהשרת:", data);

            if (response.ok) {
                // שמירת פרטי המשתמש והטוקן ב-localStorage
                const userData = {
                    userId: data.userId,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    token: data.token  // שמירת הטוקן!
                };
                localStorage.setItem('user', JSON.stringify(userData));
                
                alert("התחברת בהצלחה!");
                window.location.href = "homePage.html";
            } else {
                alert("שגיאה בהתחברות: " + data.message);
            }
        } catch (error) {
            console.error("שגיאה:", error);
            alert("שגיאה בהתחברות");
        }
    });
}

// ----------------------
// הרשמה משתמש (Signup)
// ----------------------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        try {
            const response = await fetch("http://localhost:8000/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            console.log("תגובה מהשרת:", data);

            if (response.ok) {
                alert("נרשמת בהצלחה!");
                window.location.href = "login.html";
            } else {
                alert("שגיאה בהרשמה: " + data.message);
            }
        } catch (error) {
            console.error("שגיאה:", error);
            alert("שגיאה בהרשמה");
        }
    });
}

// ----------------------
// טעינת רשימת קורסים דינמית
// ----------------------
async function loadCourses() {
    const coursesContainer = document.getElementById("courses-container");
    
    // אם אין container (לא בדף הבית), צא מהפונקציה
    if (!coursesContainer) return;

    try {
        const response = await fetch("http://localhost:8000/api/courses");
        
        if (!response.ok) {
            coursesContainer.innerHTML = '<p style="text-align:center; color:#ff6b6b; width:100%; padding:40px;">שגיאה בטעינת הקורסים</p>';
            return;
        }

        const data = await response.json();
        
        // קבלת מערך הקורסים מתוך האובייקט
        const courses = data.courses || data;
        
        // אם אין קורסים
        if (!courses || !Array.isArray(courses) || courses.length === 0) {
            coursesContainer.innerHTML = '<p style="text-align:center; color:#fff; width:100%; padding:40px;">אין קורסים זמינים כרגע</p>';
            return;
        }

        // יצירת כרטיסי קורסים דינמית
        coursesContainer.innerHTML = courses.map(course => {
            // טיפול בנתיב התמונה - תמיכה בנתיבים יחסיים וב-URLs מלאים
            let imageSrc = course.image || 'assets/default-course.png';
            // אם זה נתיב יחסי (לא מתחיל ב-http), לא צריך לשנות כלום
            
            return `
            <div class="course-card" data-id="${course._id}" data-price="${course.price || 0}">
                <img src="${imageSrc}" alt="${course.title}" onerror="this.src='assets/default-course.png'">
                <h3>${course.title}</h3>
                <p>${course.tagline || course.description || 'אין תיאור זמין'}</p>
                <div class="course-price">₪${course.price || 0}</div>
                <button class="buy-btn" onclick="handleBuyCourse('${course._id}', ${course.price || 0})">קנו עכשיו</button>
            </div>
            `;
        }).join('');

        // עדכון כפתורי קנייה לפי סטטוס התחברות
        updateBuyButtons();

    } catch (error) {
        console.error("שגיאה בטעינת הקורסים:", error);
        coursesContainer.innerHTML = '<p style="text-align:center; color:#ff6b6b; width:100%; padding:40px;">שגיאה בחיבור לשרת</p>';
    }
}

// ----------------------
// פונקציה לטיפול בלחיצה על כפתור קנייה
// ----------------------
function handleBuyCourse(courseId, price) {
    const userJson = localStorage.getItem('user');
    
    if (!userJson) {
        // משתמש לא מחובר - הפניה להתחברות
        alert('יש להתחבר כדי לרכוש קורס');
        window.location.href = 'login.html';
        return;
    }

    // משתמש מחובר - הפניה לתשלום
    // שמירת מידע הקורס לסל
    localStorage.setItem('selectedCourse', JSON.stringify({ id: courseId, price: price }));
    window.location.href = 'paymentPage.html';
}

// ----------------------
// עדכון כפתורי קנייה לפי סטטוס משתמש
// ----------------------
function updateBuyButtons() {
    const userJson = localStorage.getItem('user');
    const isLoggedIn = !!userJson;
    const buyButtons = document.querySelectorAll('.buy-btn');

    if (!isLoggedIn) {
        buyButtons.forEach(btn => {
            btn.textContent = 'התחבר לקנייה';
            btn.style.backgroundColor = '#a92ffb';
        });
    }
}

// ----------------------
// טעינה ראשונית
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    console.log("JS נטען בהצלחה!");
    loadCourses();
});