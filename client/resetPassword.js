const form = document.getElementById('resetPasswordForm');
const messageDiv = document.getElementById('message');

// שולף פרמטרים מה-URL (token ו-id)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const idNumber = urlParams.get('id');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (!newPassword || !confirmPassword) {
        showMessage('נא למלא את כל השדות', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage('הסיסמאות אינן תואמות', 'error');
        return;
    }

    try {
        const res = await fetch('http://localhost:8000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idNumber, token, newPassword })
        });

        const data = await res.json();

        if (res.ok) {
            showMessage(data.message, 'success');
            form.reset();
        } else {
            showMessage(data.message || 'שגיאה באיפוס סיסמה', 'error');
        }
    } catch (error) {
        showMessage('שגיאה בשרת, נסה שוב מאוחר יותר', 'error');
        console.error(error);
    }
});

function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
}
