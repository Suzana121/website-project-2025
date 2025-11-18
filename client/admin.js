const API_URL = 'http://localhost:8000';

const messageDiv = document.getElementById('message');
const usersList = document.getElementById('users-list');

let loadedUsers = [];
let currentSort = { field: 'name', direction: 1 }; // ברירת מחדל: שם A→Z

// ===================== אימות הרשאות =====================
function checkAuth() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (!token) {
        alert('אין לך הרשאות - לא מחובר');
        window.location.href = 'login.html';
        return false;
    }

    try {
        const user = JSON.parse(userJson || '{}');
        if (user.role !== 'admin') {
            alert('אין הרשאות מנהל');
            window.location.href = 'homePage.html';
            return false;
        }
    } catch (e) {
        localStorage.clear();
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

// ===================== הודעות =====================
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
}

// ===================== טעינת משתמשים =====================
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('שגיאה בטעינת המשתמשים');

        const users = await response.json();
        loadedUsers = users;

        applySortAndDisplay();

    } catch (err) {
        usersList.innerHTML =
            `<tr><td colspan="6" style="text-align:center;color:red;">${err}</td></tr>`;
    }
}

// ===================== מיון והצגה =====================
function applySortAndDisplay() {
    let sorted = [...loadedUsers];
    sorted.forEach(u => { u.roleText = getRoleText(u.role); });

    sorted.sort((a, b) => {
        const f = currentSort.field;
        const d = currentSort.direction;
        const A = (a[f] || '').toString().toLowerCase();
        const B = (b[f] || '').toString().toLowerCase();
        return A.localeCompare(B) * d;
    });

    displayUsers(sorted);
}

function toggleSortDirection() {
    currentSort.direction *= -1;
    applySortAndDisplay();
}

function changeSortField() {
    const field = document.getElementById('sort-select').value;
    currentSort.field = field;
    currentSort.direction = 1;
    applySortAndDisplay();
}

// ===================== הצגת המשתמשים =====================
function displayUsers(users) {
    if (!users.length) {
        usersList.innerHTML =
            '<tr><td colspan="6" style="text-align:center;">אין משתמשים</td></tr>';
        return;
    }

    usersList.innerHTML = users.map(user => `
        <tr>
            <td>${user.name || ''}</td>
            <td>${user.email || ''}</td>
            <td>${user.idNumber || ''}</td>
            <td>
                <span class="role-badge role-${user.role}">
                    ${getRoleText(user.role)}
                </span>
            </td>
            <td>
                <select id="role-${user._id}" ${user.role==='admin'?'disabled':''}>
                    <option value="student" ${user.role==='student'?'selected':''}>תלמיד</option>
                    <option value="admin" ${user.role==='admin'?'selected':''}>מנהל</option>
                </select>
            </td>
            <td>
                <button class="btn btn-save" onclick="updateRole('${user._id}')" ${user.role==='admin'?'disabled':''}>שמור</button>
                <button class="btn btn-delete" onclick="deleteUser('${user._id}')" ${user.role==='admin'?'disabled':''}>מחק</button>
            </td>
        </tr>
    `).join('');
}

// ===================== טקסט לפי תפקיד =====================
function getRoleText(role) {
    const roles = { 'student':'תלמיד', 'admin':'מנהל' };
    return roles[role] || role;
}

// ===================== עדכון תפקיד =====================
async function updateRole(userId) {
    try {
        const token = localStorage.getItem('token');
        const newRole = document.getElementById(`role-${userId}`).value;

        const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });

        const data = await res.json();
        showMessage(data.message, res.ok?'success':'error');
        loadUsers();
    } catch {
        showMessage('שגיאה בעדכון', 'error');
    }
}

// ===================== מחיקת משתמש =====================
async function deleteUser(userId) {
    if (!confirm('בטוח למחוק?')) return;

    try {
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        showMessage(data.message, res.ok?'success':'error');
        loadUsers();
    } catch {
        showMessage('שגיאה במחיקה', 'error');
    }
}

// ===================== התנתקות =====================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ===================== טעינה ראשונית =====================
if (checkAuth()) loadUsers();
