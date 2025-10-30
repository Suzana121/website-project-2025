const messageDiv = document.getElementById('message');
const usersList = document.getElementById('users-list');

// בדיקה שהמשתמש מחובר ושהוא Admin
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
        alert('אין לך הרשאות גישה לעמוד זה');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// הצגת הודעה
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

// קבלת כל המשתמשים
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5000/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('שגיאה בטעינת המשתמשים');
        }
        
        const users = await response.json();
        displayUsers(users);
        
    } catch (error) {
        console.error('Load users error:', error);
        showMessage('שגיאה בטעינת רשימת המשתמשים', 'error');
        usersList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">שגיאה בטעינת נתונים</td></tr>';
    }
}

// הצגת המשתמשים בטבלה
function displayUsers(users) {
    if (users.length === 0) {
        usersList.innerHTML = '<tr><td colspan="6" style="text-align: center;">אין משתמשים במערכת</td></tr>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <tr data-user-id="${user._id}">
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.idNumber}</td>
            <td>
                <span class="role-badge role-${user.role}">
                    ${getRoleText(user.role)}
                </span>
            </td>
            <td>
                <select id="role-${user._id}" ${user.role === 'admin' ? 'disabled' : ''}>
                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>תלמיד</option>
                    <option value="instructor" ${user.role === 'instructor' ? 'selected' : ''}>מדריך</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>מנהל</option>
                </select>
            </td>
            <td>
                <button class="btn btn-save" onclick="updateRole('${user._id}')" ${user.role === 'admin' ? 'disabled' : ''}>
                    שמור
                </button>
                <button class="btn btn-delete" onclick="deleteUser('${user._id}')" ${user.role === 'admin' ? 'disabled' : ''}>
                    מחק
                </button>
            </td>
        </tr>
    `).join('');
}

// המרת תפקיד לטקסט בעברית
function getRoleText(role) {
    const roles = {
        'student': 'תלמיד',
        'instructor': 'מדריך',
        'admin': 'מנהל'
    };
    return roles[role] || role;
}

// עדכון תפקיד משתמש
async function updateRole(userId) {
    try {
        const newRole = document.getElementById(`role-${userId}`).value;
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            loadUsers(); // טען מחדש את הרשימה
        } else {
            showMessage(data.message, 'error');
        }
        
    } catch (error) {
        console.error('Update role error:', error);
        showMessage('שגיאה בעדכון תפקיד', 'error');
    }
}

// מחיקת משתמש
async function deleteUser(userId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            loadUsers(); // טען מחדש את הרשימה
        } else {
            showMessage(data.message, 'error');
        }
        
    } catch (error) {
        console.error('Delete user error:', error);
        showMessage('שגיאה במחיקת משתמש', 'error');
    }
}

// התנתקות
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// טעינה ראשונית
if (checkAuth()) {
    loadUsers();
}