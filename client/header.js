
console.log('🔵 Script loaded!');

// קבלת המיכל הדינמי ב-Header
const userStatusContainer = document.getElementById('user-status-container');
const mainNavContainer = document.getElementById('main-nav-container');

// פונקציית התנתקות גלובלית (שמקושרת לכפתור ההתנתקות שיווצר)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/**
 * מעדכן את תפריט הניווט לפי תפקיד המשתמש
 */
function updateNavigationMenu(role) {
    if (role === 'student') {
        // סטודנט - הצגת קישור לקורסים שלי
        mainNavContainer.innerHTML = `
            <ul>
                <li><a href="my-courses.html">הקורסים שלי</a></li>
            </ul>
        `;
    } else if (role === 'admin') {
        // מנהל - הצגת קישור לעמוד ניהול
        mainNavContainer.innerHTML = `
            <ul>
                <li><a href="admin.html">ניהול</a></li>
            </ul>
        `;
    } else {
        // אורח - התפריט המקורי
        mainNavContainer.innerHTML = `
            <ul>
                <li><a href="homePage.html#sec2">הקורסים שלנו</a></li>
                <li><a href="homePage.html#sec3">יתרונות</a></li>
                <li><a href="homePage.html#sec4">למה לבחור בנו</a></li>
            </ul>
        `;
    }
}

/**
 * מציג את הסטטוס המתאים לפי תפקיד המשתמש.
 */
function displayUserStatus() {
    const userJson = localStorage.getItem('user');

    // 1. הגדרות אורח (ברירת מחדל)
    if (!userJson) {
        updateNavigationMenu('guest'); // תפריט אורח
        userStatusContainer.innerHTML = `
            <h4>שלום, אורח</h4>
            <button class="header-cta" onclick="location.href='login.html'">התחברות</button>
        `;
        return;
    }

    // 2. משתמש מחובר (מפענח את הנתונים)
    try {
        const user = JSON.parse(userJson);
        const name = user.name || 'משתמש'; // השם חייב להיות קיים ב-data.user מהשרת
        const role = user.role || 'student'; // ודא שהשרת מחזיר שדה role

        // עדכון תפריט הניווט לפי תפקיד
        updateNavigationMenu(role);

        let linkTarget, linkText;

        // 3. הגדרות לפי תפקיד
        if (role === 'admin') {
            // אדמין
            linkTarget = 'admin.html';
            linkText = 'ניהול';
        } else {
            // סטודנט/משתמש רגיל
            linkTarget = 'profile.html';
            linkText = 'אזור אישי';
        }

        // טעינת ה-HTML לתוך המיכל
        userStatusContainer.innerHTML = `
            <div class="welcome-text">שלום, ${name}</div>
            <div class="status-links-row">
                <a href="${linkTarget}" class="status-link profile-link">${linkText}</a>
                <a href="#" onclick="logout()" class="status-link logout-link">התנתקות</a>
            </div>
        `;

        // קשירת הפונקציה logout לכפתור החדש
        const logoutBtn = document.getElementById('logout-header-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    } catch (e) {
        // במקרה של שגיאת JSON, חזור למצב אורח
        console.error('Failed to parse user data:', e);
        updateNavigationMenu('guest');
        userStatusContainer.innerHTML = `
            <div class="welcome-text">שלום, אורח</div>
            <button class="header-cta" onclick="location.href='login.html'">התחברות</button>
        `;
    }
}

// קריאה לפונקציה בטעינת הדף
document.addEventListener('DOMContentLoaded', displayUserStatus);