const API_URL = 'http://localhost:8000';
const messageDiv = document.getElementById('message');
const usersList = document.getElementById('users-list');
let loadedUsers = [];
let currentSort = { field: 'name', direction: 1 }; // ברירת מחדל

// ===== אימות משתמש =====
function checkAuth() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token) { window.location.href='login.html'; return false; }
    try { if (JSON.parse(userJson).role!=='admin') window.location.href='homePage.html'; } 
    catch(e){ localStorage.clear(); window.location.href='login.html'; }
    return true;
}

// ===== הודעות =====
function showMessage(text,type){ messageDiv.textContent=text; messageDiv.className=`message ${type}`; messageDiv.classList.remove('hidden'); setTimeout(()=>messageDiv.classList.add('hidden'),5000); }

// ===== טעינת משתמשים =====
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/admin/users`, { headers:{ 'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}});
        if(!res.ok) throw new Error('שגיאה בטעינת המשתמשים');
        loadedUsers = await res.json();
        loadedUsers.forEach(u=>{ u.roleText = getRoleText(u.role); });
        applySortAndDisplay();
    } catch(err){ usersList.innerHTML=`<tr><td colspan="6" style="text-align:center;color:red;">${err}</td></tr>`; }
}

// ===== מיון והצגה =====
function applySortAndDisplay(){
    const sorted=[...loadedUsers].sort((a,b)=> ( (a[currentSort.field]||'').toString().toLowerCase().localeCompare((b[currentSort.field]||'').toString().toLowerCase()) )*currentSort.direction);
    displayUsers(sorted);
}
function toggleSortDirection(){ currentSort.direction*=-1; applySortAndDisplay(); }

// ===== הצגת משתמשים =====
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
        const token=localStorage.getItem('token');
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
        const token=localStorage.getItem('token');
        const res=await fetch(`${API_URL}/api/admin/users/${id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${token}`}});
        const data=await res.json();
        showMessage(data.message,res.ok?'success':'error'); loadUsers();
    } catch { showMessage('שגיאה במחיקה','error'); }
}

// ===== התנתקות =====
function logout(){ localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='login.html'; }

// ===== Dropdown מיון =====
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
