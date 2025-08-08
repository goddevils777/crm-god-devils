document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    
    // Проверка силы пароля в реальном времени
    passwordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        checkPasswordStrength(password);
    });
    
    // Проверка совпадения паролей
    confirmPasswordInput.addEventListener('input', function() {
        checkPasswordMatch();
    });
    
    // Обработка отправки формы
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };
        
        // Валидация
        if (!validateForm(formData)) {
            return;
        }
        
        // Блокируем кнопку
        const submitBtn = registerForm.querySelector('.btn-register');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрация...';
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Регистрация успешна! Переходим к входу...', 'success');
                
                // Перенаправляем на главную через 2 секунды
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                throw new Error(result.message || 'Ошибка регистрации');
            }
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            showNotification('Ошибка: ' + error.message, 'error');
            
            // Разблокируем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    
    // Проверка силы пароля
    function checkPasswordStrength(password) {
        let strength = 0;
        let message = '';
        
        if (password.length >= 6) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        
        switch (strength) {
            case 0:
            case 1:
                message = 'Слабый пароль';
                passwordStrength.className = 'password-strength strength-weak';
                break;
            case 2:
            case 3:
                message = 'Средний пароль';
                passwordStrength.className = 'password-strength strength-medium';
                break;
            case 4:
            case 5:
                message = 'Сильный пароль';
                passwordStrength.className = 'password-strength strength-strong';
                break;
        }
        
        passwordStrength.textContent = password ? message : '';
    }
    
    // Проверка совпадения паролей
    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword) {
            if (password === confirmPassword) {
                confirmPasswordInput.style.borderColor = '#34c759';
            } else {
                confirmPasswordInput.style.borderColor = '#ff3b30';
            }
        } else {
            confirmPasswordInput.style.borderColor = '#d1d1d6';
        }
    }
    
    // Валидация формы
    function validateForm(data) {
        if (data.username.length < 3) {
            showNotification('Логин должен содержать минимум 3 символа', 'error');
            document.getElementById('username').focus();
            return false;
        }
        
        if (data.username.length > 20) {
            showNotification('Логин не должен превышать 20 символов', 'error');
            document.getElementById('username').focus();
            return false;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            showNotification('Логин может содержать только буквы, цифры и _', 'error');
            document.getElementById('username').focus();
            return false;
        }
        
        if (data.password.length < 6) {
            showNotification('Пароль должен содержать минимум 6 символов', 'error');
            document.getElementById('password').focus();
            return false;
        }
        
        if (data.password !== data.confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            document.getElementById('confirmPassword').focus();
            return false;
        }
        
        return true;
    }
    
    // Показ уведомлений
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background: #34c759;' : ''}
            ${type === 'error' ? 'background: #ff3b30;' : ''}
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
});