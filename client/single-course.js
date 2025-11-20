


document.addEventListener('DOMContentLoaded', () => {
    // 1. שליפת ID הקורס מכתובת ה-URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (courseId) {
        fetchCourseData(courseId);
    } else {
        displayError('⚠️ שגיאה: לא סופק מזהה קורס (ID).', 'לא ניתן לזהות את הקורס המבוקש.');
    }
});

// פונקציה לשליפת נתוני הקורס מהשרת (Backend)
async function fetchCourseData(courseId) {
    // 1. אימות ושליפת טוקן
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const token = user ? user.token : null;
    
    // אם אין טוקן - מפנה להתחברות
    if (!token) {
        displayError('נדרש להתחבר כדי לצפות בפרטי הקורס.', 'העמוד הזה דורש אימות.');
        setTimeout(() => {
             window.location.href = '/login.html';
        }, 3000);
        return;
    }
    
    const API_URL = `http://localhost:8000/api/courses/${courseId}`; 

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('user');
                throw new Error('פג תוקף ההתחברות או שהטוקן לא תקין. אנא התחבר מחדש.');
            }
            if (response.status === 404) {
                 throw new Error('הקורס לא נמצא.');
            }
            throw new Error(data.message || `שגיאת HTTP: ${response.status}`);
        }
        
        const course = data.course; 
        if (course) {
            updateCoursePage(course, data.isEnrolled); 
        } else {
            throw new Error('נתוני הקורס אינם תקינים או חסרים.');
        }

    } catch (error) {
        console.error("❌ שגיאה בטעינת הקורס:", error);
        displayError('אירעה שגיאה בטעינת הנתונים:', error.message);
    }
}

// פונקציה לעדכון כל אלמנט ה-HTML והפעלת טעינת ה-YouTube
function updateCoursePage(course, isEnrolled) {
    
    // 1. עדכון כותרות ותיאורים (Hero Section)
    document.getElementById('pageTitle').textContent = course.title || 'קורס';
    document.getElementById('courseTitle').textContent = course.title || 'שם הקורס חסר';
    document.getElementById('courseTagline').textContent = course.tagline || course.description || 'תיאור קצר חסר';
    

    
    // 2. קביעת תוכן וידאו ראשוני
    const firstLesson = course.courseContent && course.courseContent[0];
    let initialVideoId = firstLesson ? firstLesson.videoId : null;
    let initialTitle = firstLesson ? firstLesson.title : 'סרטון פתיחה';
    
    // 3. יצירת הפלייליסט הדינמי שלנו
    const playlistList = document.getElementById('playlistList');
    playlistList.innerHTML = ''; 
    
    if (course.courseContent && course.courseContent.length > 0) {
        course.courseContent.forEach((lesson, index) => {
            lesson.lessonId = lesson.lessonId || (index + 1);
            const lessonElement = createLessonElement(lesson, isEnrolled); 
            playlistList.appendChild(lessonElement);
        });
        
        // טוען אוטומטית את הסרטון הראשון (אם קיים)
        if (initialVideoId && typeof fetchYouTubeVideo === 'function') {
            // ⚠️ נשתמש בפונקציה הגלובלית מתוך youtube.js כדי לטעון את הסרטון
            fetchYouTubeVideo(initialVideoId); 
            
            // עדכון כותרת ותיאור הוידאו
            document.getElementById('youtubeTitle').textContent = initialTitle;
            
            // 4. הפעלת מנגנון שינוי הוידאו עבור הפלייליסט
            window.changeVideo = (videoId, title, description) => {
                if (typeof fetchYouTubeVideo === 'function') {
                    fetchYouTubeVideo(videoId);
                    document.getElementById('youtubeTitle').textContent = title;
                }
                // עדכון ה-Active State
                document.querySelectorAll(".playlist-item").forEach(el => el.classList.remove("active"));
                document.querySelector(`[data-video-id='${videoId}']`)?.classList.add('active');
            };
            
            // עדכון ה-Active State לסרטון הראשון לאחר הטעינה
            document.querySelector(`[data-video-id='${initialVideoId}']`)?.classList.add('active');

        } else if (initialVideoId) {
            document.getElementById('videoPlayer').innerHTML = '<p style="text-align:center;">הסרטון מוכן, אך קובץ youtube.js לא נטען!</p>';
        }

    } else {
        playlistList.innerHTML = '<p style="text-align: center; color: #555;">לא נמצאו שיעורים בקורס זה.</p>';
        document.getElementById('videoPlayer').innerHTML = '<p style="text-align:center;">אין תוכן זמין.</p>';
    }
}

// פונקציה ליצירת אלמנט HTML עבור שיעור אחד
function createLessonElement(lesson, isEnrolled) {
    const div = document.createElement('div');
    div.classList.add('playlist-item');
    
    // שמירת ה-ID של הוידאו עבור שימוש בפונקציית changeVideo
    div.dataset.videoId = lesson.videoId;
    
    // אם המשתמש רשום לקורס או אם השיעור הוא חינמי, השיעור לחיץ
    const isPlayable = isEnrolled || lesson.isFreePreview;
    
    if (isPlayable) {
        div.classList.add('playable'); 
        
        // שימוש בפונקציה הגלובלית changeVideo
        const cleanTitle = escapeHtml(lesson.title || 'שיעור');
        const cleanDesc = escapeHtml(lesson.description || '');
        
        // מעביר את ה-ID והכותרת הנקייה ל-changeVideo
        div.setAttribute('onclick', `changeVideo('${lesson.videoId}', '${cleanTitle.replace(/'/g, "\\'")}', '${cleanDesc.replace(/'/g, "\\'")}')`);
    } else {
        div.classList.add('locked');
    }
    
    // בניית תוכן השיעור
    div.innerHTML = `
        <div class="lesson-details">
            <span class="lesson-number">${lesson.lessonId}.</span>
            <span class="lesson-title">${lesson.title || 'שיעור ללא כותרת'}</span>
        </div>
        <div class="lesson-meta">
            <span class="lesson-duration">${lesson.duration || '00:00'}</span>
            ${!isPlayable ? '<span class="lock-icon">🔒</span>' : ''}
        </div>
    `;
    
    return div;
}


// פונקציה להצגת הודעת שגיאה במקום התוכן
function displayError(title, message) {
    if (document.getElementById('courseTitle')) document.getElementById('courseTitle').textContent = title || 'שגיאה בטעינת הקורס';
    if (document.getElementById('courseTagline')) document.getElementById('courseTagline').textContent = message;
    if (document.getElementById('playlistList')) document.getElementById('playlistList').innerHTML = `<p style="color: red; text-align: center; padding: 20px;">${message}</p>`;
}