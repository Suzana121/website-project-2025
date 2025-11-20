// ----------------------
// פונקציות עזר כלליות
// ----------------------

// פונקציה לעיצוב מספרים לשני מקומות אחרי הנקודה
const fmt = v => Number(v).toFixed(2);

// פונקציה לעדכון סך הקורסים והסכום לתשלום
function updateTotals() {
    const products = Array.from(document.querySelectorAll('#chosen .course'));
    let items = products.length, sum = 0;

    products.forEach(p => {
        const price = parseFloat((p.dataset.price || 0).toString().replace(',', '.')) || 0;
        sum += price;
    });

    document.getElementById('itemsCount').textContent = items;
    document.getElementById('total').textContent = fmt(sum) + ' ₪';
    document.getElementById('payAmount').textContent = fmt(sum) + ' ₪';
}

// פונקציה לעדכון visibility לפי תוכן (מסתיר את כרטיס הקורסים שבחרתי אם הוא ריק)
function updateSectionsVisibility() {
    const chosen = document.getElementById('chosen');
    // const bonus = document.getElementById('bonus'); // לא נחוץ
    const chosenCard = document.getElementById('chosenCard');
    const bonusCard = document.getElementById('bonusCard');

    // נניח ש-chosenCard ו-bonusCard הם הדיבים העוטפים עם ה-ID הזה
    if (chosenCard) {
        chosenCard.style.display = chosen.children.length ? 'block' : 'none';
    }
    // נניח ש-bonusCard תמיד מוצג אם יש בו תוכן, או תלוי במספר הילדים
    // if (bonusCard) {
    //     bonusCard.style.display = bonus.children.length ? 'block' : 'none';
    // }
}


// ----------------------
// 🛒 לוגיקת טעינת כל הקורסים הזמינים (חדש)
// ----------------------
async function loadAllAvailableCourses() {
    const coursesContainer = document.getElementById('bonus');
    
    // ⚠️ החלף בנקודת הקצה הנכונה שמחזירה את *כל* הקורסים
    const API_URL = 'http://localhost:8000/api/courses/all-available'; 
    
    coursesContainer.innerHTML = '<p style="text-align: center; color: #6507FA; padding: 20px;">טוען את הקורסים הזמינים...</p>';
    
    try {
        // שליפה ללא אימות (אם הקורסים הם ציבוריים)
        const response = await fetch(API_URL); 
        
        if (!response.ok) {
            throw new Error(`שגיאת HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        // נניח שהשרת מחזיר { courses: [...] }
        const courses = data.courses || []; 

        coursesContainer.innerHTML = ''; // מנקה את הטוען

        if (courses.length === 0) {
            coursesContainer.innerHTML = '<p style="text-align: center; color: #555; padding: 20px;">אין קורסים זמינים כרגע.</p>';
            return;
        }
        
        // יצירת אלמנטים HTML והוספתם ל-DOM
        courses.forEach(course => {
            const courseElement = createCourseCard(course);
            coursesContainer.appendChild(courseElement);
        });
        
        // לאחר הטעינה, מעדכנים את סטטוס "נרכש"
        initUserCourses(); 

    } catch (error) {
        console.error("❌ שגיאה בטעינת כל הקורסים הזמינים:", error);
        coursesContainer.innerHTML = `<p style="text-align: center; color: #e53e3e; padding: 20px;">שגיאה בטעינת הקורסים. נסה לרענן.</p>`;
    }
}


// ----------------------
// 🖼️ פונקציה ליצירת כרטיס קורס (HTML) (חדש)
// ----------------------
function createCourseCard(course) {
    // מטפל במקרה שה-ID הוא אובייקט (MongoDB ObjectId) או מחרוזת
    const courseId = course._id.$oid || course._id;
    const price = fmt(course.price || 0);
    const tagline = course.tagline || course.description || 'קורס ללא תיאור';
    
    // בחירת אייקון
    let courseIcon = '📚';
    if (course.title.includes('HTML') || course.title.includes('CSS')) courseIcon = '🎨';
    else if (course.title.includes('JavaScript') || course.title.includes('JS')) courseIcon = '💻';
    else if (course.title.includes('Node') || course.title.includes('Express')) courseIcon = '⚙️';
    
    // בניית האלמנט
    const courseDiv = document.createElement('div');
    courseDiv.className = 'course';
    courseDiv.dataset.id = courseId;
    courseDiv.dataset.price = course.price; // חשוב לחישובים

    // מבנה הכרטיס (יש להתאים למבנה ה-CSS שלך)
    courseDiv.innerHTML = `
        <div class="course-info">
            <span class="course-icon" style="font-size: 24px; margin-left: 10px;">${courseIcon}</span>
            <div class="course-details">
                <h4 class="course-title" style="margin: 0;">${course.title}</h4>
                <p class="course-tagline" style="margin: 0; font-size: 14px; opacity: 0.8;">${tagline}</p>
            </div>
        </div>
        <div class="course-actions">
            <span class="course-price" style="font-weight: bold; margin-left: 15px;">${price} ₪</span>
            <button class="add-btn" title="הוסף" style="padding: 6px 15px; font-size: 14px; border-radius: 6px;">הוסף</button>
        </div>
    `;
    
    return courseDiv;
}


// ----------------------
// 🚨 לוגיקת קורסים שנרכשו (מניעת רכישה חוזרת)
// ----------------------
async function initUserCourses() {
    const userJson = localStorage.getItem('user');
    if (!userJson) return; 

    let user;
    try {
        user = JSON.parse(userJson);
    } catch (e) {
        console.error("שגיאה בפענוח נתוני משתמש:", e);
        return;
    }

    const token = user.token || localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:8000/api/courses/my-courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('שגיאה בשליפת קורסים שנרכשו. סטטוס:', response.status);
            return;
        }

        const data = await response.json();
        const purchasedCourseIds = (data.courses || []).map(course => (course._id.$oid || course._id).toString());

        console.log("🔵 קורסים שנרכשו על ידי משתמש (IDs):", purchasedCourseIds);
        
        const allAvailableCourses = document.querySelectorAll('.course');
        const chosenContainer = document.getElementById('chosen');

        allAvailableCourses.forEach(course => {
            // הוספת טיפול לשני סוגי ה-ID: ObjectId ו-String
            const courseId = course.dataset.id;
            const addBtn = course.querySelector('.add-btn');
            const removeBtn = course.querySelector('.remove-btn');
            const actionsDiv = course.querySelector('.course-actions');
            
            if (purchasedCourseIds.includes(courseId)) {
                
                // 1. הסתרת כפתורי הוסף/הסר
                if (addBtn) addBtn.style.display = 'none';
                if (removeBtn) removeBtn.style.display = 'none';

                // 2. הוספת הודעת "נרכש"
                const purchasedTag = document.createElement('span');
                purchasedTag.textContent = '✅ נרכש';
                purchasedTag.classList.add('purchased-tag');
                purchasedTag.style.fontWeight = '700';
                purchasedTag.style.color = '#065f46';
                
                if (actionsDiv && !actionsDiv.querySelector('.purchased-tag')) {
                    actionsDiv.appendChild(purchasedTag);
                }
                
                // 3. אם הקורס עדיין נמצא בסל (chosen), מעבירים אותו ל-bonus
                if (chosenContainer && chosenContainer.contains(course)) {
                    document.getElementById('bonus').appendChild(course);
                }
            }
        });

        // עדכון הסיכומים והתצוגה
        updateTotals();
        updateSectionsVisibility();

    } catch (error) {
        console.error("❌ שגיאה ב-initUserCourses:", error);
    }
}


// ----------------------
// לוגיקת סל קניות (הוספה / הסרה)
// ----------------------

// Add from bonus
document.getElementById('bonus').addEventListener('click', e => {
    if (e.target.classList.contains('add-btn')) {
        const product = e.target.closest('.course');
        if (!product) return;

        document.getElementById('chosen').appendChild(product);

        const btn = product.querySelector('.add-btn');
        btn.className = 'remove-btn';
        btn.textContent = 'הסר';
        btn.title = 'הסר';
        btn.style.backgroundColor = '#e53e3e'; // צבע אדום להסרה

        updateTotals();
        updateSectionsVisibility();
    }
});

// Remove from chosen
document.getElementById('chosen').addEventListener('click', e => {
    if (e.target.classList.contains('remove-btn')) {
        const product = e.target.closest('.course');
        if (product) {
            document.getElementById('bonus').appendChild(product);

            const btn = product.querySelector('.remove-btn');
            btn.className = 'add-btn';
            btn.textContent = 'הוסף';
            btn.title = 'הוסף';
            btn.style.backgroundColor = ''; // חזרה לצבע ברירת מחדל

            updateTotals();
            updateSectionsVisibility();
        }
    }
});


// ----------------------
// פורמט שדות תשלום
// ----------------------

// formatting: card number
document.getElementById('cardNumber').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    v = v.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = v;
});

// formatting: expiry
document.getElementById('exp').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
});


// ----------------------
// Submit - תהליך תשלום מאומת
// ----------------------
document.getElementById('paymentForm').addEventListener('submit', async function (ev) {
    ev.preventDefault();

    console.log('🔵 התחלת תהליך תשלום...');

    const btn = this.querySelector('.pay-btn');
    btn.disabled = true;
    btn.textContent = 'מעבד...';

    const name = document.getElementById('cardName').value.trim();
    const number = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const exp = document.getElementById('exp').value;
    const cvc = document.getElementById('cvc').value.trim();

    // בדיקת תקינות פרטי תשלום
    if (!name || number.length < 13 || !/^\d{2}\/\d{2}$/.test(exp) || cvc.length < 3) {
        alert('אנא מלא/י נכון את פרטי התשלום.');
        btn.disabled = false;
        btn.textContent = 'שלם עכשיו';
        return;
    }

    const chosenCourses = Array.from(document.querySelectorAll('#chosen .course'));
    
    if (chosenCourses.length === 0) {
        alert('אנא בחר/י לפחות קורס אחד');
        btn.disabled = false;
        btn.textContent = 'שלם עכשיו';
        return;
    }

    const courseIds = chosenCourses.map(course => course.dataset.id).filter(Boolean);

    // בדיקת משתמש מחובר ושליפת טוקן
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        alert('נדרשת התחברות לביצוע רכישה');
        window.location.href = 'login.html';
        return;
    }

    let user;
    try {
        user = JSON.parse(userJson);
    } catch (e) {
        alert('שגיאה בנתוני משתמש, אנא התחבר שוב');
        window.location.href = 'login.html';
        return;
    }

    // שליפת הטוקן בצורה מוגנת
    const token = user.token || localStorage.getItem('token'); 
    
    if (!token) {
        alert('שגיאה באימות, אנא התחבר שוב');
        window.location.href = 'login.html';
        return;
    }

    try {
        // שליחת הבקשה לשרת
        const response = await fetch('http://localhost:8000/courses/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseIds })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // הצלחה!
            document.getElementById('notice').style.display = 'block';
            btn.textContent = 'הושלם בהצלחה!';
            
            // ניקוי הסל והעברה לדף פרופיל
            setTimeout(() => {
                alert('הקורסים נרכשו בהצלחה! מועבר לעמוד הקורסים שלי...');
                window.location.href = 'profile.html'; 
            }, 1500);
        } else {
            alert('שגיאה ברכישה: ' + (data.message || 'נסה שוב'));
            btn.disabled = false;
            btn.textContent = 'שלם עכשיו';
        }
    } catch (error) {
        console.error('❌ שגיאה בביצוע התשלום:', error);
        alert('שגיאה בביצוע התשלום: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'שלם עכשיו';
    }
});


// ----------------------
// 🎯 הפעלת פונקציות ראשוניות
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    // 1. טעינת כל הקורסים הזמינים (תפעיל בתוכה את initUserCourses)
    loadAllAvailableCourses();
    
    // 2. עדכון ראשוני של הסכומים (מופעל שוב לאחר טעינת הקורסים)
    updateSectionsVisibility();
    updateTotals(); 
    
    console.log('✅ paymentPage.js נטען בהצלחה');
});