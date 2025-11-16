// קבלת המיכל הדינמי ב-Header
const userStatusContainer = document.getElementById('user-status-container');

// פונקציית התנתקות גלובלית (שמקושרת לכפתור ההתנתקות שיווצר)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html'; 
}

/**
 * מציג את הסטטוס המתאים לפי תפקיד המשתמש.
 */
function displayUserStatus() {
    const userJson = localStorage.getItem('user');

    // 1. הגדרות אורח (ברירת מחדל)
    if (!userJson) {
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

        let linksHtml = '';
        let welcomeText = `שלום, ${name}`;

        // 3. הגדרות לפי תפקיד
        if (role === 'admin') {
            // אדמין
            linksHtml = `<a href="admin.html">ניהול</a>`; // בלי כפתור
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
        userStatusContainer.innerHTML = `
            <div class="welcome-text">שלום, אורח</div>
            <button class="header-cta" onclick="location.href='login.html'">התחברות</button>
        `;
    }
}

// קריאה לפונקציה בטעינת הדף
document.addEventListener('DOMContentLoaded', displayUserStatus);