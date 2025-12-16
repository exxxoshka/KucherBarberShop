// auth.js
document.addEventListener('DOMContentLoaded', function() {
    // Переключение между входом и регистрацией
    document.getElementById('btnLogin').addEventListener('click', function() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        this.classList.add('active');
        document.getElementById('btnRegister').classList.remove('active');
    });
    
    document.getElementById('btnRegister').addEventListener('click', function() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        this.classList.add('active');
        document.getElementById('btnLogin').classList.remove('active');
    });
    
    // Вход
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                showMessage('Вход успешный!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            })
            .catch(error => {
                showMessage('Ошибка входа: ' + error.message, 'danger');
            });
    });
    
    // Регистрация
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;
        
        if (password !== confirm) {
            showMessage('Пароли не совпадают!', 'danger');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Пароль должен быть не менее 6 символов', 'danger');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                showMessage('Регистрация успешна! Войдите в систему.', 'success');
                // Переключаемся на форму входа
                document.getElementById('btnLogin').click();
            })
            .catch(error => {
                showMessage('Ошибка регистрации: ' + error.message, 'danger');
            });
    });
    
    // Проверяем, если пользователь уже вошел
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });
});

// Функция показа сообщений
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}