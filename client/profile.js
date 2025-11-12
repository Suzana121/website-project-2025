// בדיקת משתמש מחובר
function checkAuth() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    /*if (!token || !userData) {
        alert('עליך להתחבר כדי לגשת לעמוד זה');
        window.location.href = 'login.html';
        return null;
    }*/
    
    return JSON.parse(userData);
}

// טעינת פרטי המשתמש
function loadUserInfo() {
    const user = checkAuth();
    if (!user) return;
    
    // עדכון פרטי המשתמש בממשק
    document.getElementById('userName').textContent = `שלום, ${user.name}`;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userRole').textContent = user.role === 'instructor' ? 'מרצה' : 'תלמיד';
    
    // אות ראשונה של השם לאווטאר
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('userInitial').textContent = initial;
    
    // תאריך הצטרפות (אם קיים)
    if (user.createdAt) {
        const date = new Date(user.createdAt);
        const formattedDate = date.toLocaleDateString('he-IL', { 
            month: 'short', 
            year: 'numeric' 
        });
        document.getElementById('memberSince').textContent = formattedDate;
    }
}

// טעינת הקורסים של המשתמש
async function loadMyCourses() {
    const token = localStorage.getItem('token');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    const coursesList = document.getElementById('coursesList');
    
    try {
        const response = await fetch('http://localhost:5000/api/courses/my-courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        // הסתרת ה-loading
        loadingSpinner.style.display = 'none';
        
        if (!data.success) {
            throw new Error(data.message || 'שגיאה בטעינת הקורסים');
        }
        
        const courses = data.courses;
        
        // עדכון סטטיסטיקות
        document.getElementById('totalCourses').textContent = courses.length;
        document.getElementById('coursesCount').textContent = `${courses.length} קורסים`;
        
        // אם אין קורסים
        if (courses.length === 0) {
            emptyState.style.display = 'block';
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
        if (course.title.includes('HTML') || course.title.includes('CSS')) {
            courseIcon = '🎨';
        } else if (course.title.includes('JavaScript') || course.title.includes('JS')) {
            courseIcon = '💻';
        } else if (course.title.includes('Node') || course.title.includes('Backend')) {
            courseIcon = '⚙️';
        } else if (course.title.includes('React') || course.title.includes('Vue')) {
            courseIcon = '⚛️';
        }
        
        // תאריך רכישה
        const purchaseDate = new Date(course.createdAt).toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // שם המרצה
        const instructorName = course.instructor ? course.instructor.name : 'לא ידוע';
        
        return `
            <div class="course-card" onclick="goToCourse('${course._id}')">
                <div class="course-image">
                    ${courseIcon}
                </div>
                <div class="course-content">
                    <h3>${course.title}</h3>
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
    // לדוגמה: course.html?id=${courseId}
    // או אם יש לך עמודי קורס ספציפיים כמו course-html-css.html
    
    alert(`מעבר לקורס ${courseId}\n\nכאן תצטרכי לשנות את הכתובת לעמוד הקורס הנכון`);
    // window.location.href = `course.html?id=${courseId}`;
}

// התנתקות
function logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
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