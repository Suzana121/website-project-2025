const API_URL = 'http://localhost:8000';
const messageDiv = document.getElementById('message');
// 💡 URL לתמונת ברירת המחדל
const DEFAULT_IMAGE = 'https://lh5.googleusercontent.com/proxy/oT48EWWGPA0l7fTkdUiAI26WAvE8TTB5oKeL1fLVK93Vi28Y-KDvpM9Vr2Prb6B960JysGyorjg7X8TY2jchWBNfmdX9NvBn7ZAsPulWo3ejTAErlCbFEW275iBbbXmE_ckUYERKjfw'; 

// אלמנטים ניהול משתמשים
const usersList = document.getElementById('users-list');

// אלמנטים ניהול קורסים
const coursesListContainer = document.getElementById('courses-list-container');
const courseFormContainer = document.getElementById('course-form-container');
const courseForm = document.getElementById('course-form');
const formTitle = document.getElementById('form-title');
const saveCourseBtn = document.getElementById('save-course-btn');
const openCreateCourseBtn = document.getElementById('open-create-course-btn');
// 💡 אלמנט חדש: קונטיינר לשיעורים
const courseContentContainer = document.getElementById('course-content-container'); 
let currentEditCard = null; 

let loadedUsers = [];
let loadedCourses = [];
let currentSort = { field: 'name', direction: 1 };
let currentCourseSort = { field: 'title', direction: 1 };

// ===== פונקציות עזר ו-Auth =====

function checkAuth() {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        window.location.href = 'login.html';
        return false;
    }
    try {
        const user = JSON.parse(userJson);
        if (!user.token || user.role !== 'admin') {
            alert('אין לך הרשאת גישה לדף זה!');
            window.location.href = user.role ? 'homePage.html' : 'login.html';
            localStorage.clear();
            return false;
        }
    }
    catch(e){
        console.error('שגיאה חמורה בפענוח נתוני משתמש:', e);
        localStorage.clear();
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function showMessage(text,type){
    messageDiv.textContent=text;
    messageDiv.className=`message ${type}`;
    messageDiv.classList.remove('hidden');
    setTimeout(()=>messageDiv.classList.add('hidden'),5000);
}

function getAuthHeaders() {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
    };
}

function getRoleText(role){ return {'student':'תלמיד','admin':'מנהל'}[role]||role; }

function logout(){ localStorage.removeItem('user'); window.location.href='login.html'; }

// #################################################################
// ############# לוגיקה לניהול משתמשים ##############################
// #################################################################

async function loadUsers() {
    usersList.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">טוען נתונים...</td></tr>';
    try {
        const res = await fetch(`${API_URL}/api/admin/users`, { headers: getAuthHeaders() });

        if (res.status === 401 || res.status === 403) { logout(); return; }
        if(!res.ok) throw new Error('שגיאה בטעינת המשתמשים');

        loadedUsers = await res.json();
        loadedUsers.forEach(u=>{ u.roleText = getRoleText(u.role); });
        applySortAndDisplay();

    } catch(err){
        usersList.innerHTML=`<tr><td colspan="6" style="text-align:center;color:red;">שגיאה בטעינה: ${err.message || err}</td></tr>`;
    }
}
function applySortAndDisplay(){
    const sorted=[...loadedUsers].sort((a,b)=> ( (a[currentSort.field]||'').toString().toLowerCase().localeCompare((b[currentSort.field]||'').toString().toLowerCase()) )*currentSort.direction);
    displayUsers(sorted);
}
function toggleSortDirection(){ currentSort.direction*=-1; applySortAndDisplay(); }

function displayUsers(users){
    if(!users.length){ usersList.innerHTML='<tr><td colspan="6" style="text-align:center;">אין משתמשים</td></tr>'; return; }
    usersList.innerHTML=users.map(u=>`
        <tr>
            <td>${u.name||''}</td>
            <td>${u.email||''}</td>
            <td>${u.idNumber||''}</td>
            <td><span class="role-badge role-${u.role}">${getRoleText(u.role)}</span></td>
            <td>
                <select id="role-${u._id}" ${u.role==='admin'?'disabled':''}>
                    <option value="student" ${u.role==='student'?'selected':''}>תלמיד</option>
                    <option value="admin" ${u.role==='admin'?'selected':''}>מנהל</option>
                </select>
            </td>
            <td>
                <button class="btn btn-save" onclick="updateRole('${u._id}')" ${u.role==='admin'?'disabled':''}>שמור</button>
                <button class="btn btn-delete" onclick="deleteUser('${u._id}')" ${u.role==='admin'?'disabled':''}>מחק</button>
            </td>
        </tr>
    `).join('');
}

async function updateRole(id){
    try{
        const role=document.getElementById(`role-${id}`).value;
        const res=await fetch(`${API_URL}/api/admin/users/${id}/role`,{method:'PUT', headers:getAuthHeaders(), body:JSON.stringify({role})});
        const data=await res.json();
        showMessage(data.message,res.ok?'success':'error'); loadUsers();
    } catch { showMessage('שגיאה בעדכון','error'); }
}

async function deleteUser(id){
    if(!confirm('בטוח למחוק?')) return;
    try{
        const res=await fetch(`${API_URL}/api/admin/users/${id}`,{method:'DELETE',headers:getAuthHeaders()});
        const data=await res.json();
        showMessage(data.message,res.ok?'success':'error'); loadUsers();
    } catch { showMessage('שגיאה במחיקה','error'); }
}


// #################################################################
// ############# לוגיקה לניהול קורסים ###############################
// #################################################################

async function loadCourses() {
    coursesListContainer.innerHTML = '<p style="text-align:center;width:100%;padding:20px;">טוען קורסים...</p>';
    closeCourseForm(); // ודא שהטופס סגור בטעינה חדשה
    try {
        const res = await fetch(`${API_URL}/api/admin/courses`, { headers: getAuthHeaders() });

        if (res.status === 401 || res.status === 403) { logout(); return; }
        if(!res.ok) throw new Error('שגיאה בטעינת הקורסים');

        loadedCourses = await res.json();
        applyCourseSortAndDisplay();

    } catch(err){
        coursesListContainer.innerHTML=`<p style="text-align:center;width:100%;color:red;">שגיאה בטעינה: ${err.message || err}</p>`;
    }
}

function applyCourseSortAndDisplay(){
    const sorted=[...loadedCourses].sort((a,b)=> ( (a.title||'').toString().toLowerCase().localeCompare((b.title||'').toString().toLowerCase()) )*currentCourseSort.direction);
    displayCourses(sorted);
}

/**
 * מציג את רשימת הקורסים כשורות (cards) ברוחב 100%.
 */
function displayCourses(courses){
    if(!courses.length){
        coursesListContainer.innerHTML='<p style="text-align:center;width:100%;">אין קורסים במערכת</p>';
        return;
    }

    const cardsHtml = courses.map(c => {
        // 🚀 שימוש בתמונה דיפולטיבית אם אין תמונה
        const imageUrl = c.image || DEFAULT_IMAGE; 

        return `
            <div class="course-card" id="card-${c._id}">
                <div class="course-info">
                    <img src="${imageUrl}" alt="${c.title}">
                    <div class="course-details">
                        <h3>${c.title}</h3>
                        <p>${c.tagline || ''}</p>
                        <p>מאת: ${c.instructor?.name || 'מנהל מערכת'} | מחיר: ${(c.price || 0).toFixed(2)} ₪</p>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn btn-view" onclick="viewCourse('${c._id}')">צפייה</button> 
                    <button class="btn btn-edit" onclick="openCourseForm('edit', '${c._id}')">ערוך</button>
                    <button class="btn btn-delete" onclick="deleteCourse('${c._id}')">מחק</button>
                </div>
            </div>
        `;
    }).join(''); 

    coursesListContainer.innerHTML = cardsHtml;
}


// פותח את טופס היצירה (Inline)
openCreateCourseBtn.addEventListener('click', () => {
    openCourseForm('create');
});

/**
 * פונקציה חדשה לצפייה בקורס.
 * פותחת את דף הקורס בחלון חדש.
 */
function viewCourse(courseId) {
    window.open(`single-course.html?id=${courseId}`, '_blank');
}


/**
 * מנהל את פתיחת טופס העריכה/יצירה ה-Inline.
 */
function openCourseForm(mode, id = '') {
    clearValidationErrors(); 
    
    const course = loadedCourses.find(c => c._id === id);
    
    // סגור את הטופס אם הוא כבר פתוח על אותו כרטיס
    if (id && currentEditCard && currentEditCard.id === `card-${id}` && !courseFormContainer.classList.contains('hidden')) {
        closeCourseForm();
        return;
    }

    courseForm.reset();
    document.getElementById('course-id').value = id;
    
    // 💡 ניקוי וטעינת שיעורים
    courseContentContainer.innerHTML = '';
    
    if (mode === 'create') {
        formTitle.textContent = 'יצירת קורס חדש';
        saveCourseBtn.textContent = 'צור קורס';
        coursesListContainer.parentNode.insertBefore(courseFormContainer, coursesListContainer.nextSibling);
        currentEditCard = null;
        // 💡 הוסף שורת שיעור ריקה להתחלה
        addLessonRow(); 

    } else {
        formTitle.textContent = 'עריכת קורס קיים';
        saveCourseBtn.textContent = 'עדכן קורס';
        
        // 🚀 מילוי נתונים קיימים
        document.getElementById('course-title').value = course.title || '';
        document.getElementById('course-tagline').value = course.tagline || '';
        document.getElementById('course-description').value = course.description || '';
        document.getElementById('course-price').value = course.price !== undefined ? course.price : 0; 
        document.getElementById('course-image').value = course.image || '';

        
        // 💡 טעינת נתוני שיעורים קיימים
        if (course.courseContent && course.courseContent.length) {
            course.courseContent.forEach(lesson => injectLessonRow(lesson));
        } else {
            addLessonRow(); // אם אין שיעורים, הוסף שורה ריקה
        }


        // הכנס את הטופס מתחת לכרטיס הקורס הנבחר
        currentEditCard = document.getElementById(`card-${id}`);
        currentEditCard.parentNode.insertBefore(courseFormContainer, currentEditCard.nextSibling);
    }
    
    courseFormContainer.classList.remove('hidden');
    courseFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCourseForm() {
    courseFormContainer.classList.add('hidden');
    currentEditCard = null;
    clearValidationErrors(); 
}

// ----------------------------------------------------
// 💡 פונקציות לניהול שורות שיעורים
// ----------------------------------------------------

/**
 * בונה ומזריקה שורת קלט של שיעור לטופס.
 * @param {Object} lessonData - אובייקט עם נתוני שיעור קיימים (אופציונלי).
 */
function injectLessonRow(lessonData = {}) {
    const row = document.createElement('div');
    row.classList.add('lesson-row');
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginBottom = '10px';
    row.style.alignItems = 'center';
    row.style.border = '1px solid #ccc';
    row.style.padding = '8px';
    row.style.borderRadius = '4px';

    // lessonId מושבת כדי למנוע עריכה ידנית, אבל אנחנו נעדכן אותו אוטומטית.
    const lessonId = lessonData.lessonId || (courseContentContainer.children.length + 1);
    
    // יצירת הקלטים
    row.innerHTML = `
        <input type="number" name="lessonId" value="${lessonId}" placeholder="מס' שיעור" required min="1" style="width: 80px;" disabled>
        <input type="text" name="title" value="${lessonData.title || ''}" placeholder="כותרת השיעור" required style="flex-grow: 1;">
        <input type="text" name="videoId" value="${lessonData.videoId || ''}" placeholder="YouTube ID" required style="width: 150px;">
        <input type="text" name="duration" value="${lessonData.duration || ''}" placeholder="משך (HH:MM:SS)" required style="width: 120px;">
        <button type="button" class="btn btn-delete btn-sm" onclick="removeLessonRow(this)">❌</button>
    `;

    courseContentContainer.appendChild(row);
}

/**
 * מוסיף שורת שיעור ריקה חדשה.
 */
function addLessonRow() {
    injectLessonRow({});
    // יש לוודא עדכון מספרי השיעורים לאחר הוספה
    updateLessonIds(); 
}

/**
 * מסיר שורת שיעור מהטופס ומעדכן את מספרי השיעורים.
 * @param {HTMLElement} button - כפתור המחיקה שנלחץ.
 */
function removeLessonRow(button) {
    const row = button.closest('.lesson-row');
    if (row) {
        row.remove();
        // עדכון מספרי השיעורים לאחר מחיקה (lessonId)
        updateLessonIds();
    }
}

/**
 * מוודא שמספרי השיעורים (lessonId) עוקבים ונכונים.
 */
function updateLessonIds() {
    Array.from(courseContentContainer.children).forEach((row, index) => {
        const lessonIdInput = row.querySelector('input[name="lessonId"]');
        if (lessonIdInput) {
            lessonIdInput.value = index + 1;
        }
    });
}


// ----------------------------------------------------
// 💡 פונקציות עזר לאימות בצד לקוח
// ----------------------------------------------------

/**
 * מציג הודעת שגיאה ב-div המתאים מעל השדה.
 * @param {string} fieldName - ה-ID של השגיאה (למשל, 'title').
 * @param {string} message - ההודעה להצגה.
 */
function displayValidationError(fieldName, message) {
    const errorDiv = document.getElementById(`error-${fieldName}`);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

/**
 * מנקה את כל הודעות השגיאה בטופס הקורסים.
 */
function clearValidationErrors() {
    document.querySelectorAll('.validation-error').forEach(div => {
        div.textContent = '';
        div.classList.add('hidden');
    });
    // מנקה את הגבולות האדומים של שורות השיעורים
    document.querySelectorAll('.lesson-row').forEach(row => {
        row.style.border = '1px solid #ccc';
    });
}


// פונקציית שמירה/עדכון קורס
courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearValidationErrors(); // 1. מנקה שגיאות קודמות
    
    const id = document.getElementById('course-id').value;
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `${API_URL}/api/admin/courses/${id}` : `${API_URL}/api/admin/courses`;
    
    // 2. איסוף נתונים לאימות ושיעורים
    const title = document.getElementById('course-title').value.trim();
    const tagline = document.getElementById('course-tagline').value.trim();
    const description = document.getElementById('course-description').value.trim();
    const priceInput = document.getElementById('course-price').value;
    const price = parseFloat(priceInput);
    const image = document.getElementById('course-image').value.trim();

    // 💡 איסוף מערך השיעורים
    const courseContent = [];
    let lessonHasError = false;

    Array.from(courseContentContainer.children).forEach(row => {
        const lessonInputs = row.querySelectorAll('input');
        const lesson = {};
        let isValidRow = true;

        lessonInputs.forEach(input => {
            if (input.name) {
                const val = input.value.trim();
                lesson[input.name] = input.name === 'lessonId' ? parseInt(val) : val;
                
                // בדיקת שדות השיעור
                if (val.length === 0 && input.name !== 'lessonId') { // lessonId הוא רק תצוגה
                    isValidRow = false;
                    lessonHasError = true;
                }
            }
        });

        if (isValidRow) {
            courseContent.push(lesson);
            row.style.border = '1px solid #ccc'; // מנקה גבול אדום אם תקין
        } else {
            row.style.border = '2px solid red'; // מסמן שורה לא תקינה
        }
    });
    
    // 3. 🚨 אימות צד לקוח (Client-Side Validation) 🚨
    let hasError = false;

    // A. כותרת
    if (title.length < 2) { displayValidationError('title', '❌ כותרת הקורס חייבת להיות באורך של 2 תווים לפחות.'); hasError = true; }
    
    // B. כותרת משנה (חובה)
    if (tagline.length < 5) { displayValidationError('tagline', '❌ כותרת המשנה (תקציר) חייבת להיות באורך של 5 תווים לפחות.'); hasError = true; }

    // C. תיאור
    if (description.length < 10) { displayValidationError('description', '❌ התיאור המלא חייב להיות באורך של 10 תווים לפחות.'); hasError = true; }
    
    // D. מחיר
    if (!priceInput || isNaN(price) || price < 0) { displayValidationError('price', '❌ המחיר חייב להיות מספר חיובי תקין (אפס מותר).'); hasError = true; }
    
    // E. תמונה (חובה)
    if (image.length === 0) { displayValidationError('image', '❌ יש לספק כתובת URL לתמונת הקורס.'); hasError = true; }


    // 💡 בדיקת שגיאות שיעור
    if (courseContentContainer.children.length === 0) {
        // אם אין שום שיעור
        displayValidationError('course-content', '❌ חייבים להוסיף לפחות שיעור אחד לתוכן הקורס.');
        hasError = true;
    } else if (lessonHasError) {
        // אם יש שיעורים אבל אחד מהם לא תקין
        displayValidationError('course-content', '❌ יש למלא את כל השדות בכל שורות השיעורים המסומנות באדום.');
        hasError = true;
    }
    
    
    // אם נמצאו שגיאות, עוצרים את השליחה
    if (hasError) {
        courseFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    // 4. יצירת אובייקט הנתונים עם מערך השיעורים
    const courseData = {
        title: title,
        tagline: tagline,
        description: description,
        price: price,
        image: image,
        // 💡 הוספת המערך courseContent
        courseContent: courseContent 
    };
    
    // 5. שליחה לשרת
    try {
        const res = await fetch(endpoint, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(courseData)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            showMessage(data.message, 'success');
            closeCourseForm();
            loadCourses(); 
        } else {
            showMessage(data.message || 'שגיאה בשמירת הקורס', 'error');
        }

    } catch (err) {
        console.error('שגיאה בשמירת הקורס:', err);
        showMessage('שגיאת שרת', 'error');
    }
});


// מחיקת קורס
async function deleteCourse(id) {
    if(!confirm('בטוח למחוק את הקורס הזה?')) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/courses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        const data = await res.json();
        
        showMessage(data.message, res.ok ? 'success' : 'error'); 
        loadCourses();
        
    } catch { 
        showMessage('שגיאה במחיקת הקורס', 'error'); 
    }
}


// #################################################################
// ############# לוגיקה לסטטיסטיקה (Aggregation) ####################
// #################################################################

async function loadRoleStatistics() {
    const STATS_API_URL = `${API_URL}/api/users/roles/count`; 
    const statsContainer = document.getElementById('roleStats'); 
    
    if (!statsContainer) return; 
    
    statsContainer.innerHTML = '<p style="text-align: center;">טוען נתונים סטטיסטיים...</p>';
    
    try {
        const response = await fetch(STATS_API_URL, { headers: getAuthHeaders() });
        
        if (response.status === 401 || response.status === 403) { logout(); return; }
        if (!response.ok) {
            throw new Error(`שגיאת HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const roleCounts = data.stats || []; 
        
        if (roleCounts.length === 0) {
            statsContainer.innerHTML = '<p>לא נמצאו נתונים לספירת תפקידים.</p>';
            return;
        }

        // יצירת טבלת סטטיסטיקה
        let html = '<h3>👤 ספירת תפקידי משתמשים:</h3><table class="stats-table"><thead><tr><th>תפקיד</th><th>כמות</th></tr></thead><tbody>';
        
        roleCounts.forEach(item => {
            html += `
                <tr>
                    <td>${getRoleText(item._id)}</td>
                    <td>${item.count}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        statsContainer.innerHTML = html;

    } catch (error) {
        console.error("❌ שגיאה בטעינת נתוני תפקידים:", error);
        statsContainer.innerHTML = `<p style="color: #e53e3e;">שגיאה בטעינת הסטטיסטיקה.</p>`;
    }
}


/**
 * טוען ומציג את סטטיסטיקת כמות הסטודנטים הרשומים לכל קורס.
 */
async function loadCourseStatistics() {
    const STATS_API_URL = `${API_URL}/api/courses/stats/students`; 
    const statsContainer = document.getElementById('courses-stats-container'); 

    if (!statsContainer) return;

    statsContainer.innerHTML = '<p style="text-align: center;">טוען נתוני סטטיסטיקת קורסים...</p>';

    try {
        const response = await fetch(STATS_API_URL, { headers: getAuthHeaders() });
        
        if (response.status === 401 || response.status === 403) { logout(); return; }
        if (!response.ok) {
            throw new Error(`שגיאת HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const courseStats = data.courseStats || []; 
        
        if (courseStats.length === 0) {
            statsContainer.innerHTML = '<p>לא נמצאו נתונים לקורסים רשומים.</p>';
            return;
        }

        // יצירת טבלת סטטיסטיקה
        let html = '<h3>👥 סטודנטים רשומים לקורס:</h3><table class="stats-table"><thead><tr><th>קורס</th><th>כמות סטודנטים</th></tr></thead><tbody>';
        
        courseStats.forEach(item => {
            html += `
                <tr>
                    <td>${item.title || 'כותרת חסרה'}</td>
                    <td>${item.numberOfStudents}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        statsContainer.innerHTML = html;

    } catch (error) {
        console.error("❌ שגיאה בטעינת נתוני קורסים:", error);
        statsContainer.innerHTML = `<p style="color: #e53e3e;">שגיאה בטעינת סטטיסטיקת הקורסים.</p>`;
    }
}


// #################################################################
// ############# ניווט וטעינה ראשונית ################################
// #################################################################

// ניהול טאבים
const tabButtons = document.querySelectorAll('.tab-btn');
const contentSections = document.querySelectorAll('.content-section');

function switchTab(targetId) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    contentSections.forEach(section => section.classList.add('hidden'));

    const activeBtn = document.querySelector(`.tab-btn[data-target="${targetId}"]`);
    const activeSection = document.getElementById(targetId);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeSection) activeSection.classList.remove('hidden');

    if (targetId === 'users-section') {
        loadUsers();
        loadRoleStatistics(); 
    } else if (targetId === 'courses-section') {
        loadCourses();
        loadCourseStatistics(); 
    }
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.target);
    });
});

// ===== Dropdown מיון משתמשים (משוחזר) =====
const sortBtn = document.getElementById('sort-btn');
const sortList = document.getElementById('sort-list');

sortBtn.addEventListener('click',()=> sortList.classList.toggle('hidden'));
sortList.querySelectorAll('li').forEach(item=>{
    item.addEventListener('click',()=>{
        currentSort.field=item.dataset.field;
        currentSort.direction=1;
        sortBtn.textContent=`מיין לפי: ${item.textContent} ▼`;
        sortList.classList.add('hidden');
        applySortAndDisplay();
    });
});
document.addEventListener('click',e=>{
    if(!sortBtn.contains(e.target) && !sortList.contains(e.target)) sortList.classList.add('hidden');
});


// ===== טעינה ראשונית =====
if(checkAuth()) {
    // טוען אוטומטית את הטאב הראשון
    switchTab('users-section');
}

console.log('✅ admin.js נטען בהצלחה');