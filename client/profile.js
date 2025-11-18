// בדיקת משתמש מחובר
function checkAuth() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user'); // שינוי מ-userData ל-user
    
    if (!token || !userJson) {
        alert('עליך להתחבר כדי לגשת לעמוד זה');
        window.location.href = 'login.html';
        return null;
    }
    
    try {
        return JSON.parse(userJson);
    } catch (e) {
        console.error('שגיאה בפענוח נתוני משתמש:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return null;
    }
}

// טעינת פרטי המשתמש
function loadUserInfo() {
    const user = checkAuth();
    if (!user) return;
    
    // עדכון פרטי המשתמש בממשק
    document.getElementById('userName').textContent = `שלום, ${user.name || 'משתמש'}`;
    document.getElementById('userEmail').textContent = user.email || 'לא זמין';
    
    // תרגום תפקיד לעברית
    let roleText = 'תלמיד';
    if (user.role === 'instructor') roleText = 'מרצה';
    else if (user.role === 'admin') roleText = 'מנהל';
    
    document.getElementById('userRole').textContent = roleText;
    
    // אות ראשונה של השם לאווטאר
    const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
    document.getElementById('userInitial').textContent = initial;
    
    // תאריך הצטרפות (אם קיים)
    if (user.createdAt) {
        const date = new Date(user.createdAt);
        const formattedDate = date.toLocaleDateString('he-IL', { 
            month: 'short', 
            year: 'numeric' 
        });
        document.getElementById('memberSince').textContent = formattedDate;
    } else {
        document.getElementById('memberSince').textContent = 'חדש';
    }
}

// טעינת הקורסים של המשתמש
async function loadMyCourses() {
    const token = localStorage.getItem('token');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    const coursesList = document.getElementById('coursesList');
    
    if (!token) {
        loadingSpinner.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    try {
        // שים לב! שיניתי את הפורט ל-8000 כמו ב-server.js שלך
        const response = await fetch('http://localhost:8000/api/courses/my-courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        // הסתרת ה-loading
        loadingSpinner.style.display = 'none';
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'שגיאה בטעינת הקורסים');
        }
        
        const courses = data.courses || [];
        
        // עדכון סטטיסטיקות
        document.getElementById('totalCourses').textContent = courses.length;
        document.getElementById('coursesCount').textContent = `${courses.length} קורסים`;
        
        // אם אין קורסים
        if (courses.length === 0) {
            emptyState.style.display = 'block';
            coursesList.innerHTML = '';
            return;
        }
        
        // הצגת הקורסים
        displayCourses(courses);
        
    } catch (error) {
        console.error('שגיאה:', error);
        loadingSpinner.style.display = 'none';
        coursesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                <p style="font-size: 18px; margin-bottom: 10px;">⚠️ אופס! משהו השתבש</p>
                <p>${error.message}</p>
                <button onclick="loadMyCourses()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">נסה שוב</button>
            </div>
        `;
    }
}

// הצגת הקורסים בממשק
function displayCourses(courses) {
    const coursesList = document.getElementById('coursesList');
    
    coursesList.innerHTML = courses.map(course => {
        // אייקון לפי שם הקורס
        let courseIcon = '📚';
        const title = course.title || '';
        
        if (title.includes('HTML') || title.includes('CSS')) {
            courseIcon = '🎨';
        } else if (title.includes('JavaScript') || title.includes('JS')) {
            courseIcon = '💻';
        } else if (title.includes('Node') || title.includes('Backend')) {
            courseIcon = '⚙️';
        } else if (title.includes('React') || title.includes('Vue')) {
            courseIcon = '⚛️';
        }
        
        // תאריך רכישה
        const purchaseDate = course.createdAt 
            ? new Date(course.createdAt).toLocaleDateString('he-IL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : 'לא זמין';
        
        // שם המרצה
        const instructorName = course.instructor?.name || 'לא ידוע';
        
        return `
            <div class="course-card" onclick="goToCourse('${course._id}')">
                <div class="course-image">
                    ${courseIcon}
                </div>
                <div class="course-content">
                    <h3>${course.title || 'ללא כותרת'}</h3>
                    <p>${course.description || 'תיאור הקורס יעודכן בקרוב'}</p>
                    <div class="course-instructor">
                        👨‍🏫 ${instructorName}
                    </div>
                    <div class="course-date">
                        📅 נרכש ב: ${purchaseDate}
                    </div>
                    <div class="course-footer">
                        <div class="course-price">₪${course.price || 0}</div>
                        <button class="btn-course" onclick="event.stopPropagation(); goToCourse('${course._id}')">
                            כניסה לקורס →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// מעבר לקורס ספציפי
function goToCourse(courseId) {
    // כאן תצטרכי להחליף לכתובת הנכונה של עמוד הקורס
    console.log('מעבר לקורס:', courseId);
    alert(`מעבר לקורס ${courseId}\n\nכאן תצטרכי לשנות את הכתובת לעמוד הקורס הנכון`);
    // window.location.href = `course.html?id=${courseId}`;
}

// התנתקות
function logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('התנתקת בהצלחה!');
        window.location.href = 'login.html';
    }
}

// חזרה לעמוד הבית
function goHome() {
    window.location.href = 'homePage.html';
}

// טעינת הכל כשהעמוד נטען
window.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadMyCourses();
});