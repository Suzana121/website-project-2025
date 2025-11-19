// ----------------------
// בדיקה שה-JS נטען
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    console.log("JS נטען בהצלחה!");
});

// ----------------------
// פונקציית בדיקה לשרת
// ----------------------
async function testServer() {
    try {
        const response = await fetch("http://localhost:3000/api/test");
        const data = await response.json();
        console.log("תגובה מהשרת:", data);
    } catch (error) {
        console.error("שגיאה בפנייה לשרת:", error);
    }
}

// קריאה לבדיקה
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
            const response = await fetch("http://localhost:3000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log("תגובה מהשרת:", data);

            if (response.ok) {
                alert("התחברת בהצלחה!");
                // ניתן להוסיף כאן הפניה לדף הקורסים
                // window.location.href = "courses.html";
            } else {
                alert("שגיאה בהתחברות: " + data.message);
            }
        } catch (error) {
            console.error("שגיאה:", error);
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
            const response = await fetch("http://localhost:3000/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            console.log("תגובה מהשרת:", data);

            if (response.ok) {
                alert("נרשמת בהצלחה!");
                // ניתן להפנות לדף ההתחברות
                // window.location.href = "homepage.html";
            } else {
                alert("שגיאה בהרשמה: " + data.message);
            }
        } catch (error) {
            console.error("שגיאה:", error);
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('user');
    const isLoggedIn = !!userJson;

    const courseCards = document.querySelectorAll('.course-card');
    const cardsContainer = document.querySelector('.courses-cards');

    if (!cardsContainer) return;

    if (isLoggedIn) {
        // מצב: משתמש מחובר → משאירים כפתורים ומחברים אותם לעמוד התשלום
        courseCards.forEach(card => {
            const btn = card.querySelector('.buy-btn');
            if (btn) {
                btn.style.display = 'block'; 
                btn.addEventListener('click', () => {
                    window.location.href = 'paymentPage.html';
                });
            }
        });

    } else {
        // מצב: אורח → מסתירים את כל כפתורי "קנו עכשיו"
        courseCards.forEach(card => {
            const btn = card.querySelector('.buy-btn');
            if (btn) btn.style.display = 'none';
        });

        // יוצרים כפתור התחברות אחד מתחת לכל הקורסים
        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'לקנייה התחברו';
        loginBtn.classList.add('login-buy-btn');
        loginBtn.style.marginTop = '25px';
        loginBtn.style.padding = '12px 22px';
        loginBtn.style.fontSize = '18px';
        loginBtn.style.borderRadius = '8px';
        loginBtn.style.border = 'none';
        loginBtn.style.cursor = 'pointer';
        loginBtn.style.backgroundColor = '#6507fa';
        loginBtn.style.color = '#fff';
        loginBtn.style.display = 'block';
        loginBtn.style.marginLeft = 'auto';
        loginBtn.style.marginRight = 'auto';

        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });

        // מוסיפים מתחת לרשימת הקורסים
        cardsContainer.insertAdjacentElement('afterend', loginBtn);
    }
});

// ----------------------
// טעינת רשימת קורסים
// ----------------------
async function loadCourses() {
    try {
        const response = await fetch("http://localhost:3000/api/courses");
        const courses = await response.json();
        const coursesList = document.getElementById("coursesList");
        if (!coursesList) return;

        coursesList.innerHTML = "";
        courses.forEach(course => {
            const courseDiv = document.createElement("div");
            courseDiv.classList.add("course_item");
            courseDiv.textContent = `${course.name} - ${course.description}`;
            coursesList.appendChild(courseDiv);
        });
    } catch (error) {
        console.error("שגיאה בטעינת הקורסים:", error);
    }
}

// קריאה לטעינת הקורסים
document.addEventListener("DOMContentLoaded", loadCourses);
