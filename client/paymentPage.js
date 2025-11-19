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
    const bonus = document.getElementById('bonus');
    const chosenCard = document.getElementById('chosenCard');
    const bonusCard = document.getElementById('bonusCard');

    chosenCard.style.display = chosen.children.length ? 'block' : 'none';
    bonusCard.style.display = bonus.children.length ? 'block' : 'none';
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

    // שליפת הטוקן בצורה מוגנת
    const token = user.token || localStorage.getItem('token');
    if (!token) return;

    try {
        // שליפת רשימת הקורסים שנרכשו על ידי המשתמש הנוכחי
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
        
        // יצירת מערך של ID-ים בלבד
        const purchasedCourseIds = (data.courses || []).map(course => course._id.toString());

        console.log("🔵 קורסים שנרכשו על ידי משתמש (IDs):", purchasedCourseIds);
        
        // מעבר על כל הקורסים הזמינים והתאמת הממשק
        const allAvailableCourses = document.querySelectorAll('.course');
        const chosenContainer = document.getElementById('chosen');

        allAvailableCourses.forEach(course => {
            const courseId = course.dataset.id;
            const addBtn = course.querySelector('.add-btn');
            const removeBtn = course.querySelector('.remove-btn');
            const actionsDiv = course.querySelector('.course-actions');
            
            if (purchasedCourseIds.includes(courseId)) {
                // הקורס כבר נרכש!
                
                // הסתרת כפתורי הוסף/הסר
                if (addBtn) addBtn.style.display = 'none';
                if (removeBtn) removeBtn.style.display = 'none';

                // הוספת הודעת "נרכש"
                const purchasedTag = document.createElement('span');
                purchasedTag.textContent = '✅ נרכש';
                purchasedTag.classList.add('purchased-tag');
                purchasedTag.style.fontWeight = '700';
                purchasedTag.style.color = '#065f46';
                
                if (actionsDiv && !actionsDiv.querySelector('.purchased-tag')) {
                    actionsDiv.appendChild(purchasedTag);
                }
                
                // אם הקורס עדיין נמצא בסל (chosen), מעבירים אותו ל-bonus
                if (chosenContainer.contains(course)) {
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
        const response = await fetch('http://localhost:8000/api/courses/purchase', {
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
    // 1. הפעלת בדיקת הקורסים הנרכשים מיד
    initUserCourses();
    
    // 2. עדכון ראשוני של הסכומים (יקרה גם בתוך initUserCourses, אבל מומלץ לוודא)
    updateSectionsVisibility();
    updateTotals(); 
    
    console.log('✅ paymentPage.js נטען בהצלחה');
});