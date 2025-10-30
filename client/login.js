// קבלת אלמנטים
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const formTitle = document.getElementById('form-title');
const messageDiv = document.getElementById('message');

// כפתורי פעולה
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const forgotPasswordButton = document.getElementById('forgot-password-button');
const forgotSubmitButton = document.getElementById('forgot-submit-button');
const backToLoginButton = document.getElementById('back-to-login-button');

// שדות התחברות
const loginId = document.getElementById('login-id');
const loginPassword = document.getElementById('login-password');

// שדות הרשמה
const registerId = document.getElementById('register-id');
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const registerConfirmPassword = document.getElementById('register-confirm-password');

// שדה שכחתי סיסמה
const forgotId = document.getElementById('forgot-id');

// ספירת תווים בתעודת זהות
const loginIdCount = document.getElementById('login-id-count');
const registerIdCount = document.getElementById('register-id-count');
const forgotIdCount = document.getElementById('forgot-id-count');

// ולידציה לתעודת זהות
const loginIdValid = document.getElementById('login-id-valid');
const registerIdValid = document.getElementById('register-id-valid');

// פונקציה להצגת הודעות
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

// פונקציה לוולידציה של תעודת זהות ישראלית
function validateIsraeliID(id) {
    if (!id || id.length !== 9) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let digit = Number(id[i]);
        let step = digit * ((i % 2) + 1);
        sum += step > 9 ? step - 9 : step;
    }
    return sum % 10 === 0;
}

// פונקציה לוולידציה של פורמט אימייל
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// פונקציה לאיפוס טופס (ניקוי שדות)
function resetFormFields(formElement) {
    formElement.querySelectorAll('input').forEach(input => {
        input.value = '';
    });
    // איפוס מונים והודעות ולידציה
    if (formElement.id === 'login-form') {
        loginIdCount.textContent = '0';
        loginIdValid.textContent = '';
    }
    if (formElement.id === 'register-form') {
        registerIdCount.textContent = '0';
        registerIdValid.textContent = '';
    }
    if (formElement.id === 'forgot-password-form') {
        forgotIdCount.textContent = '0';
    }
}

// פונקציה מרכזית למעבר בין טפסים
function switchForm(activeFormId, title, activeTabElement = null, focusElement = null) {
    const allForms = [loginForm, registerForm, forgotPasswordForm];
    const allTabs = [loginTab, registerTab];

    // 1. הסתרת כל הטפסים ואיפוס שדות
    allForms.forEach(form => {
        form.classList.remove('active');
        resetFormFields(form); // **שיפור: איפוס טפסים**
    });

    // 2. הפעלת הטופס הנכון
    const activeForm = document.getElementById(activeFormId);
    activeForm.classList.add('active');
    
    // 3. עדכון כותרת והודעות
    formTitle.textContent = title;
    messageDiv.classList.add('hidden');

    // 4. עדכון טאבים
    allTabs.forEach(tab => {
        if (tab === activeTabElement) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // 5. **שיפור: מיקוד אוטומטי**
    if (focusElement) {
        focusElement.focus();
    }
}

// מעבר בין טאבים
loginTab.addEventListener('click', () => {
    switchForm('login-form', 'התחברות למערכת', loginTab, loginId);
});

registerTab.addEventListener('click', () => {
    switchForm('register-form', 'הרשמה למערכת', registerTab, registerId);
});

forgotPasswordButton.addEventListener('click', () => {
    switchForm('forgot-password-form', 'שכחתי סיסמה', null, forgotId);
});

backToLoginButton.addEventListener('click', () => {
    // מנקים את השדה של שכחתי סיסמה בתוך הפונקציה switchForm
    switchForm('login-form', 'התחברות למערכת', loginTab, loginId);
});


// ולידציה בזמן אמת עבור שדות תעודת זהות (ריפקטור חלקי)
function setupIdValidation(idInput, countSpan, validSpan) {
    idInput.addEventListener('input', (e) => {
        // מונע הקלדת תווים שאינם ספרות - מצוין!
        e.target.value = e.target.value.replace(/\D/g, '');
        countSpan.textContent = e.target.value.length;
        
        if (e.target.value.length === 9) {
            if (validateIsraeliID(e.target.value)) {
                validSpan.textContent = '✓ תקינה';
                validSpan.className = 'valid';
            } else {
                validSpan.textContent = '✗ לא תקינה';
                validSpan.className = 'invalid';
            }
        } else {
            validSpan.textContent = '';
            validSpan.className = '';
        }
    });
}

// הפעלת הולידציה המשותפת
setupIdValidation(loginId, loginIdCount, loginIdValid);
setupIdValidation(registerId, registerIdCount, registerIdValid);

// ספירת תווים - שכחתי סיסמה (אין צורך בולידציה בזמן אמת כאן, רק ספירה)
forgotId.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
    forgotIdCount.textContent = e.target.value.length;
});

// **שיפור: ניקיון קלט לשם (מונע ספרות ותווים מיוחדים)**
registerName.addEventListener('input', (e) => {
    // מאפשר רק אותיות, רווחים וגרש/מקף (לשמות משולבים)
    e.target.value = e.target.value.replace(/[^א-תa-zA-Z\s'-]/g, '');
});


// התחברות
loginButton.addEventListener('click', async (e) => {
    e.preventDefault(); // מונע שליחת טופס רגילה
    
    const idNumber = loginId.value.trim();
    const password = loginPassword.value;
    
    if (!validateIsraeliID(idNumber)) {
        showMessage('תעודת זהות לא תקינה', 'error');
        loginId.focus();
        return;
    }
    
    if (!password) {
        showMessage('נא למלא סיסמה', 'error');
        loginPassword.focus();
        return;
    }
    
    loginButton.disabled = true;
    loginButton.textContent = 'מעבד...';
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idNumber, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            setTimeout(() => {
                window.location.href = 'homePage.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('שגיאה בהתחברות לשרת', 'error');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'התחבר';
    }
});

// הרשמה
registerButton.addEventListener('click', async (e) => {
    e.preventDefault(); // מונע שליחת טופס רגילה
    
    const idNumber = registerId.value.trim();
    const name = registerName.value.trim(); // **שיפור: ניקיון רווחים**
    const email = registerEmail.value.trim(); // **שיפור: ניקיון רווחים**
    const password = registerPassword.value;
    const confirmPassword = registerConfirmPassword.value;
    
    if (!validateIsraeliID(idNumber)) {
        showMessage('תעודת זהות לא תקינה', 'error');
        registerId.focus();
        return;
    }

    if (!name || !email || !password || !confirmPassword) {
        showMessage('נא למלא את כל השדות', 'error');
        return;
    }
    
    // **שיפור: ולידציה לפורמט אימייל**
    if (!validateEmail(email)) {
        showMessage('כתובת אימייל לא תקינה', 'error');
        registerEmail.focus();
        return;
    }

    if (password !== confirmPassword) {
        showMessage('הסיסמאות אינן תואמות', 'error');
        registerConfirmPassword.focus();
        return;
    }
    
    if (password.length < 6) {
        showMessage('הסיסמה חייבת להכיל לפחות 6 תווים', 'error');
        registerPassword.focus();
        return;
    }
    
    registerButton.disabled = true;
    registerButton.textContent = 'מעבד...';
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idNumber, name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            setTimeout(() => {
                window.location.href = 'homePage.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('שגיאה בהתחברות לשרת', 'error');
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = 'הירשם';
    }
});

// שכחתי סיסמה
forgotSubmitButton.addEventListener('click', async (e) => {
    e.preventDefault(); // מונע שליחת טופס רגילה
    
    const idNumber = forgotId.value.trim();
    
    if (!validateIsraeliID(idNumber)) {
        showMessage('תעודת זהות לא תקינה', 'error');
        forgotId.focus();
        return;
    }
    
    forgotSubmitButton.disabled = true;
    forgotSubmitButton.textContent = 'שולח...';
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idNumber })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            setTimeout(() => {
                backToLoginButton.click();
            }, 5000);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('שגיאה בהתחברות לשרת', 'error');
    } finally {
        forgotSubmitButton.disabled = false;
        forgotSubmitButton.textContent = 'שלח קישור לאיפוס סיסמה';
    }
});