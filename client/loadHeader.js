// קובץ: loadHeader.js

// ----------------------------------------------------
// --- פונקציות גלובליות לניהול משתמשים ---
// ----------------------------------------------------

/**
 * פונקציה לביצוע התנתקות: מחיקת הטוקן והמשתמש, והפניה.
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html'; 
}

/**
 * מציג את הסטטוס המתאים לפי תפקיד המשתמש.
 */
function displayUserStatus() {
    // 1. קבלת האלמנט שאותו נעדכן
    const userStatusContainer = document.getElementById('user-status-container');
    if (!userStatusContainer) return;

    const userJson = localStorage.getItem('user');

    // 2. מצב: אורח (ברירת מחדל)
    if (!userJson) {
        userStatusContainer.innerHTML = `
            <div class="welcome-text guest-status">שלום, אורח</div>
            <a href="login.html" class="header-cta login-link">התחברות</a>
        `;
        return;
    }
    
    // 3. מצב: משתמש מחובר (מפענח את הנתונים)
    try {
        const user = JSON.parse(userJson);
        const name = user.name || 'משתמש'; 
        const role = user.role || 'student';

        let linkTarget = '';
        let linkText = '';

        if (role === 'admin') {
            linkTarget = 'admin.html';
            linkText = 'ניהול';
        } else {
            linkTarget = 'profile.html';
            linkText = 'אזור אישי';
        }
        
        // 4. טעינת ה-HTML החדש לתוך המיכל (מבנה Flexbox של שתי שורות)
        userStatusContainer.innerHTML = `
            <div class="welcome-text logged-in-status">שלום, ${name}</div>
            
            <div class="status-links-row">
                <a href="${linkTarget}" class="status-link profile-link">${linkText}</a>
                <span class="seperetor"> | </span>
                <a href="#" onclick="logout()" class="status-link logout-link"> התנתקות</a>
            </div>
        `;
        
        // אין צורך בקשירת אירוע נפרדת, כי הפונקציה logout נקראת ישירות ב-onclick.

    } catch (e) {
        // במקרה של שגיאת JSON, חזור למצב אורח
        console.error('Failed to parse user data:', e);
        userStatusContainer.innerHTML = `
            <div class="welcome-text guest-status">שלום, אורח</div>
            <a href="login.html" class="header-cta login-link">התחברות</a>
        `;
    }
}


// ----------------------------------------------------
// --- לוגיקת טעינת ה-Header והפעלת הסטטוס ---
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. טען את ה-HTML של ה-Header
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Header file not found');
            return response.text();
        })
        .then(html => {
            // 2. הכנס את התוכן לתחילת ה-body
            document.body.insertAdjacentHTML('afterbegin', html);
            
            // 3. הפעל את פונקציית סטטוס המשתמש
            displayUserStatus(); 
        })
        .catch(err => {
            console.error('❌ Failed to load header:', err);
        });
});