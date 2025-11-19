const API_URL = 'http://localhost:8000';
const messageDiv = document.getElementById('message');
const usersList = document.getElementById('users-list');
let loadedUsers = [];
let currentSort = { field: 'name', direction: 1 }; // ברירת מחדל

// ===== אימות משתמש (מתוקן) =====
function checkAuth() {
    // 🛑 קריאה רק לאובייקט המשתמש
    const userJson = localStorage.getItem('user');

    if (!userJson) { 
        // אם אין נתוני משתמש, הפנה להתחברות
        window.location.href = 'login.html'; 
        return false; 
    }

    try { 
        const user = JSON.parse(userJson);
        
        // ודא שיש טוקן בתוך האובייקט (אימות נוסף)
        if (!user.token) {
            console.error('שגיאה: אובייקט משתמש קיים, אך ללא טוקן.');
            localStorage.clear();
            window.location.href = 'login.html';
            return false;
        }

        // בדיקה: אם המשתמש אינו מנהל
        if (user.role !== 'admin') {
            alert('אין לך הרשאת גישה לדף זה!');
            window.location.href = 'homePage.html'; // הפניה לדף הבית אם אין הרשאה
            return false;
        }
    } 
    catch(e){ 
        // אם יש שגיאת JSON בנתונים, נקה והפנה להתחברות
        console.error('שגיאה חמורה בפענוח נתוני משתמש (JSON Corrupt):', e);
        localStorage.clear(); 
        window.location.href = 'login.html'; 
        return false;
    }
    
    return true;
}

// ===== הודעות (ללא שינוי) =====
function showMessage(text,type){ 
    messageDiv.textContent=text; 
    messageDiv.className=`message ${type}`; 
    messageDiv.classList.remove('hidden'); 
    setTimeout(()=>messageDiv.classList.add('hidden'),5000); 
}

// ===== טעינת משתמשים (מתוקן) =====
async function loadUsers() {
    try {
        // 🛑 קריאה לטוקן מאובייקט המשתמש
        const userJson = localStorage.getItem('user');
        const user = JSON.parse(userJson);
        const token = user.token;

        const res = await fetch(`${API_URL}/api/admin/users`, { 
            headers:{ 
                'Authorization':`Bearer ${token}`,
                'Content-Type':'application/json'
            }
        });
        
        // טיפול בשגיאת 401/403 מהשרת
        if (res.status === 401 || res.status === 403) {
            console.error('❌ הטוקן נדחה על ידי השרת. הפנייה להתחברות.');
            logout();
            return;
        }

        if(!res.ok) throw new Error('שגיאה בטעינת המשתמשים');
        
        loadedUsers = await res.json();
        loadedUsers.forEach(u=>{ u.roleText = getRoleText(u.role); });
        applySortAndDisplay();
        
    } catch(err){ 
        usersList.innerHTML=`<tr><td colspan="6" style="text-align:center;color:red;">שגיאה בטעינה: ${err.message || err}</td></tr>`; 
    }
}

// ===== מיון והצגה (ללא שינוי) =====
function applySortAndDisplay(){
    const sorted=[...loadedUsers].sort((a,b)=> ( (a[currentSort.field]||'').toString().toLowerCase().localeCompare((b[currentSort.field]||'').toString().toLowerCase()) )*currentSort.direction);
    displayUsers(sorted);
}
function toggleSortDirection(){ currentSort.direction*=-1; applySortAndDisplay(); }

// ===== הצגת משתמשים (ללא שינוי) =====
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

function getRoleText(role){ return {'student':'תלמיד','admin':'מנהל'}[role]||role; }

// ===== עדכון תפקיד =====
async function updateRole(id){
    try{
        const user = JSON.parse(localStorage.getItem('user'));
        const token=user.token;
        const role=document.getElementById(`role-${id}`).value;
        const res=await fetch(`${API_URL}/api/admin/users/${id}/role`,{method:'PUT', headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify({role})});
        const data=await res.json();
        showMessage(data.message,res.ok?'success':'error'); loadUsers();
    } catch { showMessage('שגיאה בעדכון','error'); }
}

// ===== מחיקת משתמש =====
async function deleteUser(id){
    if(!confirm('בטוח למחוק?')) return;
    try{
        const user = JSON.parse(localStorage.getItem('user'));
        const token=user.token;
        const res=await fetch(`${API_URL}/api/admin/users/${id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${token}`}});
        const data=await res.json();
        showMessage(data.message,res.ok?'success':'error'); loadUsers();
    } catch { showMessage('שגיאה במחיקה','error'); }
}

// ===== התנתקות =====
function logout(){ localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='login.html'; }

// ===== Dropdown מיון (משוחזר לגרסה שרק פותחת/סוגרת) =====
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
if(checkAuth()) loadUsers();

console.log('✅ admin.js נטען בהצלחה');