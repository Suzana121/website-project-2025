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
                window.location.href = "courses.html";
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
// ניהול כפתורי קנייה
// ----------------------
document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('user');
    const isLoggedIn = !!userJson;

    const courseCards = document.querySelectorAll('.course-card');
    const cardsContainer = document.querySelector('.courses-cards');

    if (!cardsContainer) return;

    if (isLoggedIn) {
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
        courseCards.forEach(card => {
            const btn = card.querySelector('.buy-btn');
            if (btn) btn.style.display = 'none';
        });

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

        cardsContainer.insertAdjacentElement('afterend', loginBtn);
    }
});

// ----------------------
// טעינת רשימת קורסים
// ----------------------
async function loadCourses() {
    try {
        const response = await fetch("http://localhost:8000/api/courses");
        const data = await response.json();
        
        if (!data.success) {
            console.error("שגיאה בטעינת קורסים");
            return;
        }

        const courses = data.courses;
        const coursesList = document.getElementById("coursesList");
        if (!coursesList) return;

        coursesList.innerHTML = "";
        courses.forEach(course => {
            const courseDiv = document.createElement("div");
            courseDiv.classList.add("course_item");
            courseDiv.textContent = `${course.title} - ${course.description}`;
            coursesList.appendChild(courseDiv);
        });
    } catch (error) {
        console.error("שגיאה בטעינת הקורסים:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadCourses);