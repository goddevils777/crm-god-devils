document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('authForm');
    
    // Обработка формы авторизации
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Перенаправляем на CRM панель
                window.location.href = '/crm';
            } else {
                showError(result.message || 'Неверный логин или пароль');
            }
        } catch (error) {
            showError('Ошибка подключения к серверу');
        }
    });
    
    // Функция показа ошибок
    function showError(message) {
        // Удаляем предыдущую ошибку если есть
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Создаём новое сообщение об ошибке
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #ff3b30;
            text-align: center;
            margin-top: 16px;
            font-size: 14px;
        `;
        
        authForm.appendChild(errorDiv);
        
        // Автоматически удаляем через 3 секунды
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
});