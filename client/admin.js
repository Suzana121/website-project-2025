const API_URL = 'http://localhost:8000';
const messageDiv = document.getElementById('message');

// אלמנטים ניהול משתמשים
const usersList = document.getElementById('users-list');

// אלמנטים ניהול קורסים
const coursesListContainer = document.getElementById('courses-list-container');
const courseFormContainer = document.getElementById('course-form-container');
const courseForm = document.getElementById('course-form');
const formTitle = document.getElementById('form-title');
const saveCourseBtn = document.getElementById('save-course-btn');
const openCreateCourseBtn = document.getElementById('open-create-course-btn');
let currentEditCard = null; // משתנה לשמירת כרטיס הקורס הנערך

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

    const cardsHtml = courses.map(c => `
        <div class="course-card" id="card-${c._id}">
            <div class="course-info">
                <img src="${c.image || 'placeholder.png'}" alt="${c.title}">
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
    `).join(''); // ⬅️ כפתור 'תוכן' הוסר כאן

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
    // 💡 מניח שדף הקורס הוא course.html והוא מקבל ID כפרמטר
    window.open(`single-course.html?id=${courseId}`, '_blank');
}


/**
 * מנהל את פתיחת טופס העריכה/יצירה ה-Inline.
 */
function openCourseForm(mode, id = '') {
    const course = loadedCourses.find(c => c._id === id);
    
    // סגור את הטופס אם הוא כבר פתוח על אותו כרטיס
    if (id && currentEditCard && currentEditCard.id === `card-${id}` && !courseFormContainer.classList.contains('hidden')) {
        closeCourseForm();
        return;
    }

    courseForm.reset();
    document.getElementById('course-id').value = id;
    
    // עדכון כותרת וכפתור שמירה
    if (mode === 'create') {
        formTitle.textContent = 'יצירת קורס חדש';
        saveCourseBtn.textContent = 'צור קורס';
        // הכנס את הטופס בסוף הרשימה
        coursesListContainer.parentNode.insertBefore(courseFormContainer, coursesListContainer.nextSibling);
        currentEditCard = null;

    } else {
        formTitle.textContent = 'עריכת קורס קיים';
        saveCourseBtn.textContent = 'עדכן קורס';
        
        // מילוי הנתונים
        document.getElementById('course-title').value = course.title || '';
        document.getElementById('course-tagline').value = course.tagline || '';
        document.getElementById('course-description').value = course.description || '';
        document.getElementById('course-price').value = course.price || 0;
        document.getElementById('course-image').value = course.image || '';

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
}

// פונקציית שמירה/עדכון קורס
courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('course-id').value;
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `${API_URL}/api/admin/courses/${id}` : `${API_URL}/api/admin/courses`;
    
    const courseData = {
        title: document.getElementById('course-title').value,
        tagline: document.getElementById('course-tagline').value,
        description: document.getElementById('course-description').value,
        price: parseFloat(document.getElementById('course-price').value),
        image: document.getElementById('course-image').value,
    };
    
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

    // טעינת הנתונים הרלוונטיים לאחר מעבר
    if (targetId === 'users-section') {
        loadUsers();
    } else if (targetId === 'courses-section') {
        loadCourses();
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